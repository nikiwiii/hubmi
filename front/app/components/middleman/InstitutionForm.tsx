"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { InstitutionProfile } from "../../lib/types";
import { CustomSelect, SelectOption } from "../shared/CustomSelect";
import {
  BUDGET_OPTIONS,
  HORIZON_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  POWIAT_OPTIONS,
} from "../../lib/middleman";

interface InstitutionFormProps {
  profile: InstitutionProfile;
  onChange: (profile: InstitutionProfile) => void;
  isLoading: boolean;
  onBack?: () => void;
  backLabel?: string;
  onSubmit: (profile: InstitutionProfile) => void;
}

const POWIAT_SELECT_OPTIONS: SelectOption<string>[] = POWIAT_OPTIONS.map(
  (p) => ({
    value: p,
    label: p,
  }),
);

const inputClass =
  "w-full px-3.5 py-2 bg-white dark:bg-[#1C1E23] border border-black/10 dark:border-white/15 rounded-xl text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-900/15 dark:focus:ring-white/20 focus:border-stone-900/30 dark:focus:border-white/30 transition-all";

const Field: React.FC<{
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, children }) => (
  <div className="space-y-1">
    <label
      htmlFor={htmlFor}
      className="block text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200"
    >
      {label}
    </label>
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
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm transition-all cursor-pointer ${
              active
                ? "bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 border-stone-900 dark:border-amber-400 font-semibold shadow-2xs"
                : "bg-white dark:bg-[#1C1E23] text-stone-700 dark:text-stone-300 border-black/10 dark:border-white/15 hover:border-black/25 dark:hover:border-white/30 font-normal"
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
  profile,
  onChange,
  isLoading,
  onSubmit,
}) => {
  const [showErrors, setShowErrors] = useState(false);

  const update = <K extends keyof InstitutionProfile>(
    key: K,
    value: InstitutionProfile[K],
  ) => {
    onChange({ ...profile, [key]: value });
  };

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
    showErrors && show ? (
      <p className="text-xs font-semibold text-red-700 dark:text-red-400">{text}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white dark:bg-[#1C1E23] rounded-[24px] border border-black/5 dark:border-white/10 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* 1. Typ instytucji & Powiat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <Field label="Typ instytucji" htmlFor="mm-type">
            <CustomSelect
              id="mm-type"
              value={profile.institution_type}
              onChange={(val) =>
                update(
                  "institution_type",
                  val as InstitutionProfile["institution_type"],
                )
              }
              options={INSTITUTION_TYPE_OPTIONS}
              fullWidth
              size="md"
            />
          </Field>

          <Field label="Powiat" htmlFor="mm-powiat">
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
        </div>

        {/* 2. Nazwa jednostki & Grupa docelowa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <Field
            label="Nazwa gminy lub instytucji (opcjonalnie)"
            htmlFor="mm-name"
          >
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

          <Field label="Grupa docelowa (dla kogo)" htmlFor="mm-target">
            <input
              id="mm-target"
              type="text"
              value={profile.target_group}
              onChange={(e) => update("target_group", e.target.value)}
              placeholder="np. samotni seniorzy 65+"
              maxLength={500}
              className={inputClass}
            />
            {errorText(missing.target_group, "Wskaż grupę docelową.")}
          </Field>
        </div>

        {/* 3. Liczba odbiorców & Zespół / kadra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <Field label="Szacowana liczba odbiorców" htmlFor="mm-count">
            <input
              id="mm-count"
              type="number"
              inputMode="numeric"
              min={1}
              value={profile.recipients_count ?? ""}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                update(
                  "recipients_count",
                  Number.isFinite(n) && n > 0 ? n : null,
                );
              }}
              placeholder="np. 40"
              className={inputClass}
            />
          </Field>

          <Field label="Dedykowany zespół / kadra" htmlFor="mm-staff">
            <input
              id="mm-staff"
              type="text"
              value={profile.staff_resources}
              onChange={(e) => update("staff_resources", e.target.value)}
              placeholder="np. 1 pracownik socjalny, 2 wolontariuszy"
              maxLength={500}
              className={inputClass}
            />
            {errorText(
              missing.staff_resources,
              "Opisz krótko zespół do realizacji.",
            )}
          </Field>
        </div>

        {/* 4. Dostępny budżet & Czas uruchomienia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-1">
          <Field label="Dostępny budżet">
            <ChoiceChips
              name="Budżet"
              value={profile.budget_range}
              options={BUDGET_OPTIONS}
              onChange={(v) => update("budget_range", v)}
            />
          </Field>

          <Field label="Czas na uruchomienie">
            <ChoiceChips
              name="Horyzont czasowy"
              value={profile.time_horizon_months}
              options={HORIZON_OPTIONS}
              onChange={(v) => update("time_horizon_months", v)}
            />
          </Field>
        </div>

        {/* 5. Kontekst lokalny */}
        <Field
          label="Lokalny kontekst lub specyfika (opcjonalnie)"
          htmlFor="mm-context"
        >
          <textarea
            id="mm-context"
            value={profile.local_context ?? ""}
            onChange={(e) => update("local_context", e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="np. słaby transport publiczny, brak świetlicy, aktywne KGW..."
            className={`${inputClass} resize-y`}
          />
        </Field>

        {showErrors && !isValid && (
          <p
            role="alert"
            className="text-xs sm:text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
          >
            Uzupełnij pola zaznaczone na czerwono powyżej.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm sm:text-base font-semibold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Dostosowuję innowację do usługi...
            </>
          ) : (
            <>Dostosuj innowację do potrzeb mieszkańców</>
          )}
        </button>
      </div>
    </form>
  );
};
