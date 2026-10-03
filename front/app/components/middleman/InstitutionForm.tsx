"use client";

import React, { useState } from "react";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { InstitutionProfile } from "../../lib/types";
import { CustomSelect, SelectOption } from "../shared/CustomSelect";
import {
  BUDGET_OPTIONS,
  HORIZON_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  POWIAT_OPTIONS,
} from "../../lib/middleman";

interface InstitutionFormProps {
  initialProfile: InstitutionProfile;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (profile: InstitutionProfile) => void;
}

const POWIAT_SELECT_OPTIONS: SelectOption<string>[] = POWIAT_OPTIONS.map((p) => ({
  value: p,
  label: p,
}));

const inputClass =
  "w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/15 focus:border-stone-900/30";

const Field: React.FC<{
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-800">
      {label}
    </label>
    {hint && <p className="text-xs text-stone-500">{hint}</p>}
    {children}
  </div>
);

function ChoiceChips<T extends string | number>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${active
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-700 border-black/10 hover:border-black/25"
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const InstitutionForm: React.FC<InstitutionFormProps> = ({
  initialProfile,
  isLoading,
  onBack,
  onSubmit,
}) => {
  const [profile, setProfile] = useState<InstitutionProfile>(initialProfile);
  const [showErrors, setShowErrors] = useState(false);

  const update = <K extends keyof InstitutionProfile>(key: K, value: InstitutionProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const missing = {
    powiat: !profile.powiat,
    target_group: profile.target_group.trim().length < 2,
    staff_resources: profile.staff_resources.trim().length < 2,
  };
  const isValid = !Object.values(missing).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      ...profile,
      institution_name: profile.institution_name?.trim() || null,
      target_group: profile.target_group.trim(),
      staff_resources: profile.staff_resources.trim(),
      local_context: profile.local_context?.trim() || null,
    });
  };

  const errorText = (show: boolean, text: string) =>
    showErrors && show ? <p className="text-xs font-semibold text-red-700">{text}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="1. Jaką instytucję reprezentujesz?" htmlFor="mm-type">
        <CustomSelect
          id="mm-type"
          value={profile.institution_type}
          onChange={(val) => update("institution_type", val as InstitutionProfile["institution_type"])}
          options={INSTITUTION_TYPE_OPTIONS}
          fullWidth
          size="md"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="2. Powiat w Małopolsce" htmlFor="mm-powiat">
          <CustomSelect
            id="mm-powiat"
            value={profile.powiat}
            onChange={(val) => update("powiat", val)}
            options={POWIAT_SELECT_OPTIONS}
            placeholder="– wybierz powiat –"
            error={showErrors && missing.powiat}
            fullWidth
            size="md"
          />
          {errorText(missing.powiat, "Wybierz powiat.")}
        </Field>
        <Field label="Nazwa gminy lub instytucji (opcjonalnie)" htmlFor="mm-name">
          <input
            id="mm-name"
            type="text"
            value={profile.institution_name ?? ""}
            onChange={(e) => update("institution_name", e.target.value)}
            placeholder="np. GOPS w Dobrej"
            maxLength={200}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
        <Field label="3. Dla kogo ma być usługa?" htmlFor="mm-target">
          <input
            id="mm-target"
            type="text"
            value={profile.target_group}
            onChange={(e) => update("target_group", e.target.value)}
            placeholder="np. samotni seniorzy 65+"
            maxLength={500}
            className={inputClass}
          />
          {errorText(missing.target_group, "Napisz, dla kogo jest usługa.")}
        </Field>
        <Field label="Ilu odbiorców (około)?" htmlFor="mm-count">
          <input
            id="mm-count"
            type="number"
            inputMode="numeric"
            min={1}
            value={profile.recipients_count ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              update("recipients_count", Number.isFinite(n) && n > 0 ? n : null);
            }}
            placeholder="np. 40"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="4. Jaki budżet macie do dyspozycji?">
        <ChoiceChips
          name="Budżet"
          value={profile.budget_range}
          options={BUDGET_OPTIONS}
          onChange={(v) => update("budget_range", v)}
        />
      </Field>

      <Field
        label="5. Kto z Waszego obecnego zespołu może się zająć usługą?"
        hint="Opisz swoimi słowami, np. „1 pracownik socjalny na pół etatu i 2 wolontariuszy”. Ich pensji nie wliczamy do budżetu usługi."
        htmlFor="mm-staff"
      >
        <input
          id="mm-staff"
          type="text"
          value={profile.staff_resources}
          onChange={(e) => update("staff_resources", e.target.value)}
          placeholder="np. 1 pracownik socjalny na pół etatu"
          maxLength={500}
          className={inputClass}
        />
        {errorText(missing.staff_resources, "Opisz krótko, kto zajmie się usługą.")}
      </Field>

      <Field label="6. W jakim czasie chcecie uruchomić usługę?">
        <ChoiceChips
          name="Horyzont czasowy"
          value={profile.time_horizon_months}
          options={HORIZON_OPTIONS}
          onChange={(v) => update("time_horizon_months", v)}
        />
      </Field>

      <Field
        label="7. Lokalny problem lub dodatkowe uwagi (opcjonalnie)"
        hint="Co jest u Was szczególne? Np. słaby transport, brak świetlicy, aktywne Koło Gospodyń Wiejskich."
        htmlFor="mm-context"
      >
        <textarea
          id="mm-context"
          value={profile.local_context ?? ""}
          onChange={(e) => update("local_context", e.target.value)}
          rows={3}
          maxLength={2000}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {showErrors && !isValid && (
        <p role="alert" className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Uzupełnij pola zaznaczone na czerwono powyżej.
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-black/5">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-stone-700 hover:text-stone-900 bg-white border border-black/10 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Zmień innowację
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Przygotowuję kartę usługi...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#EFE5C6]" />
              Przygotuj kartę usługi
            </>
          )}
        </button>
      </div>
    </form>
  );
};
