"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Pencil,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  Users2,
} from "lucide-react";
import {
  adaptInnovation,
  fetchInnovationById,
  refineServiceCard,
  startExpertConversation,
} from "../lib/api";
import {
  InnovationRecord,
  InstitutionProfile,
  ServiceCardResponse,
} from "../lib/types";
import {
  BUDGET_OPTIONS,
  EMPTY_PROFILE,
  errorMessage,
  institutionDisplayName,
  serviceCardToText,
} from "../lib/middleman";
import { useApp } from "../context/AppContext";
import { InnovationPicker } from "../components/middleman/InnovationPicker";
import { InstitutionForm } from "../components/middleman/InstitutionForm";
import { ServiceCardView } from "../components/middleman/ServiceCardView";

type Step = "pick" | "profile" | "result";

const STEPS: { id: Step; label: string }[] = [
  { id: "pick", label: "Wybierz innowację" },
  { id: "profile", label: "Opisz instytucję" },
  { id: "result", label: "Karta usługi" },
];

const REFINE_EXAMPLES = [
  "Mamy mniejszy budżet",
  "Mamy tylko jednego pracownika",
  "Chcemy zacząć od jednej miejscowości",
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="print:hidden flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active
                ? "bg-stone-900 text-white"
                : done
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-200 text-stone-500"
                }`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
            </span>
            <span className={active ? "font-semibold text-stone-900" : "text-stone-500"}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <span className="w-6 h-px bg-stone-300 mx-1" />}
          </li>
        );
      })}
    </ol>
  );
}

function SelectedInnovation({
  innovation,
  onChange,
}: {
  innovation: InnovationRecord;
  onChange?: () => void;
}) {
  return (
    <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF4E5] border border-[#E7DAC0]">
      <div className="space-y-0.5">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Wybrana innowacja
        </span>
        <p className="text-base font-bold text-stone-900">{innovation.title}</p>
        {innovation.target_group && (
          <p className="text-xs text-stone-600 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5" />
            {innovation.target_group}
          </p>
        )}
      </div>
      {onChange && (
        <button
          onClick={onChange}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-black/10 hover:bg-stone-50 text-stone-700 cursor-pointer"
        >
          Zmień
        </button>
      )}
    </div>
  );
}

function MiddlemanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const innovationFromUrl = searchParams.get("innovation");
  const {
    currentUser,
    innovations,
    middlemanStep: step,
    setMiddlemanStep: setStep,
    selectedInnovation: innovation,
    setSelectedInnovation: setInnovation,
    institutionProfile: profile,
    setInstitutionProfile: setProfile,
    serviceCardResult: result,
    setServiceCardResult: setResult,
    resetMiddleman,
  } = useApp();

  const [isLoadingInnovation, setIsLoadingInnovation] = useState(
    Boolean(innovationFromUrl && (!innovation || innovation.id !== innovationFromUrl))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultMessage, setConsultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!innovationFromUrl) return;
    if (innovation?.id === innovationFromUrl) return;

    // Najpierw sprawdź, czy innowacja jest już w globalnym stanie
    const found = innovations.find((inn) => inn.id === innovationFromUrl);
    if (found) {
      setInnovation(found);
      setResult(null);
      setError(null);
      setStep("profile");
      return;
    }

    let cancelled = false;
    setIsLoadingInnovation(true);
    fetchInnovationById(innovationFromUrl)
      .then((inn) => {
        if (cancelled) return;
        setInnovation(inn);
        setResult(null);
        setError(null);
        setStep("profile");
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Nie znaleziono wybranej innowacji."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInnovation(false);
      });
    return () => {
      cancelled = true;
    };
  }, [innovationFromUrl, innovation?.id, innovations, setInnovation, setResult, setStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleSelectInnovation = (inn: InnovationRecord) => {
    setInnovation(inn);
    setResult(null);
    setError(null);
    setStep("profile");
  };

  const handleBackToPick = () => {
    setStep("pick");
    setError(null);
    if (innovationFromUrl) router.replace("/middleman");
  };

  const handleGenerate = async (newProfile: InstitutionProfile) => {
    if (!innovation) return;
    setProfile(newProfile);
    setIsGenerating(true);
    setError(null);
    try {
      const res = await adaptInnovation(innovation.id, newProfile);
      setResult(res);
      setStep("result");
    } catch (err) {
      setError(errorMessage(err, "Nie udało się przygotować karty usługi."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    const text = instruction.trim();
    if (!innovation || !result || !text || isRefining) return;
    setIsRefining(true);
    setError(null);
    try {
      const res = await refineServiceCard(innovation.id, profile, result.card, text);
      setResult(res);
      setRefineText("");
    } catch (err) {
      setError(errorMessage(err, "Nie udało się poprawić karty usługi."));
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(serviceCardToText(result, profile));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nie udało się skopiować. Zaznacz tekst ręcznie lub użyj „Drukuj”.");
    }
  };

  const handleConsultExpert = async () => {
    if (!result) return;
    if (!currentUser) {
      setConsultMessage("Aby napisać do eksperta ROPS, zaloguj się. Kartę możesz wcześniej skopiować lub zapisać jako PDF.");
      return;
    }
    setIsConsulting(true);
    setConsultMessage(null);
    try {
      const budgetLabel = BUDGET_OPTIONS.find((b) => b.value === profile.budget_range)?.label;
      const conversation = await startExpertConversation({
        topic: `Innowacje: ${result.innovation_title}`,
        initial_message:
          `Dzień dobry, piszę w imieniu: ${institutionDisplayName(profile)}. ` +
          `Chcemy wdrożyć innowację „${result.innovation_title}” jako usługę „${result.card.service_name}” ` +
          `(budżet: ${budgetLabel}, horyzont: ${profile.time_horizon_months} mies.). ` +
          `Prosimy o konsultację przygotowanej karty usługi.`,
      });
      router.push(`/chat?recipient=${encodeURIComponent(conversation.id)}`);
    } catch (err) {
      setConsultMessage(errorMessage(err, "Nie udało się otworzyć czatu z ekspertem."));
      setIsConsulting(false);
    }
  };

  const handleStartOver = () => {
    resetMiddleman();
    setError(null);
    setConsultMessage(null);
    if (innovationFromUrl) router.replace("/middleman");
  };

  return (
    <div className="mm-print-root py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="print:hidden flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Innowacje</span>
            <span className="block text-stone-300">Innowacja → Usługa</span>
          </div>
          <p className="mt-2 text-stone-500 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            Wybierz innowację społeczną z bazy ROPS Kraków i opisz swoją instytucję. Asystent AI
            przygotuje z niej konkretną kartę usługi: zakres, zasoby, harmonogram, budżet i wskaźniki.
          </p>
        </div>
        {step !== "pick" && (
          <button
            onClick={handleStartOver}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-black/5 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            Zacznij od nowa
          </button>
        )}
      </div>

      <StepIndicator current={step} />

      {error && (
        <div role="alert" className="print:hidden text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {step === "pick" &&
        (isLoadingInnovation ? (
          <div className="flex items-center justify-center gap-2 text-sm text-stone-500 py-10">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Wczytuję wybraną innowację...
          </div>
        ) : (
          <InnovationPicker onSelect={handleSelectInnovation} />
        ))}

      {step === "profile" && innovation && (
        <div className="space-y-5">
          <SelectedInnovation innovation={innovation} onChange={handleBackToPick} />
          <div className="bg-white rounded-[28px] border border-black/5 p-5 sm:p-8 shadow-2xs">
            <InstitutionForm
              initialProfile={profile}
              isLoading={isGenerating}
              onBack={handleBackToPick}
              onSubmit={handleGenerate}
            />
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-5">
          <div className="print:hidden flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStep("profile")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-black/10 hover:bg-stone-50 text-stone-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Zmień dane instytucji
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-black/10 hover:bg-stone-50 text-stone-700 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Drukuj / zapisz jako PDF
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-black/10 hover:bg-stone-50 text-stone-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Skopiowano" : "Kopiuj"}
            </button>
          </div>

          <div className={isRefining ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <ServiceCardView
              response={result}
              profile={profile}
              onConsultExpert={handleConsultExpert}
              isConsulting={isConsulting}
            />
          </div>

          {consultMessage && (
            <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span>{consultMessage}</span>
              {!currentUser && (
                <button
                  onClick={() => router.push("/auth")}
                  className="self-start px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Zaloguj się
                </button>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRefine(refineText);
            }}
            className="print:hidden bg-white rounded-2xl border border-black/10 p-4 sm:p-5 shadow-2xs space-y-3"
          >
            <label htmlFor="mm-refine" className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Pencil className="w-4 h-4" />
              Dopytaj / popraw kartę
            </label>
            <div className="flex flex-wrap gap-2">
              {REFINE_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  disabled={isRefining}
                  onClick={() => handleRefine(ex)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                id="mm-refine"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                rows={2}
                maxLength={2000}
                disabled={isRefining}
                placeholder="Napisz, co zmienić, np. „mamy tylko 15 tys. zł” albo „dodaj współpracę ze szkołą”"
                className="flex-1 px-4 py-3 bg-white border border-black/10 rounded-xl text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/15 resize-y disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isRefining || refineText.trim().length < 2}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-40 cursor-pointer"
              >
                {isRefining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isRefining ? "Poprawiam..." : "Popraw kartę"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MiddlemanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 text-sm text-stone-500 py-16">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Ładowanie...
        </div>
      }
    >
      <MiddlemanContent />
    </Suspense>
  );
}
