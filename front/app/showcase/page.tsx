"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  ArrowRight,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  FileText,
  Users,
  Users2,
  Layers,
  Send,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  DollarSign,
  Award,
  MessageSquare,
  ShieldCheck,
  Check,
  AlertTriangle,
  Info,
  Compass,
  ArrowUp,
  Maximize2,
  Minimize2,
  RefreshCw,
  Building2,
  Briefcase,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Heart,
  Eye,
  Edit3,
} from "lucide-react";

// Definicja 7 etapów demonstracji (0: Intro, 1-5: Kroki, 6: Outro)
type ShowcaseStepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface ShowcaseStepMeta {
  id: ShowcaseStepId;
  title: string;
  badge: string;
  screenName: string;
  durationMs: number;
}

const SHOWCASE_STEPS: ShowcaseStepMeta[] = [
  {
    id: 0,
    title: "MiNNO – Małopolskie Innowacje Społeczne",
    badge: "Intro",
    screenName: "Początek",
    durationMs: 4500,
  },
  {
    id: 1,
    title: "Asystent AI – Sprawdzenie Unikalności",
    badge: "Krok 1 / 5",
    screenName: "Asystent (/matching)",
    durationMs: 14000,
  },
  {
    id: 2,
    title: "Raporty RAG – Diagnoza i Wskaźniki",
    badge: "Krok 2 / 5",
    screenName: "Raporty (/knowledge)",
    durationMs: 14000,
  },
  {
    id: 3,
    title: "Kreator Innowacji – Projekt i Wizualizacja",
    badge: "Krok 3 / 5",
    screenName: "Kreator (/propose)",
    durationMs: 24000,
  },
  {
    id: 4,
    title: "Middleman Innowacji – Adaptacja i Grant",
    badge: "Krok 4 / 5",
    screenName: "Innowacje (/middleman)",
    durationMs: 13000,
  },
  {
    id: 5,
    title: "Czat z Ekspertem ROPS – Decyzja i Finansowanie",
    badge: "Krok 5 / 5",
    screenName: "Czat (/chat)",
    durationMs: 13000,
  },
  {
    id: 6,
    title: "MiNNO – Podsumowanie Ścieżki",
    badge: "Koniec",
    screenName: "Finał",
    durationMs: 5500,
  },
];

// =============================================================================
// SUBTELNA ANIMACJA TAPNIĘCIA (BEZ SZTUCZNEGO KURSORA I BEZ NAPISÓW)
// Wyłącznie naturalne fale uderzeniowe (ripple/ping) na klikanym elemencie
// =============================================================================
function TapRippleEffect({
  isActive,
  variant = "amber",
}: {
  isActive: boolean;
  variant?: "amber" | "emerald";
}) {
  if (!isActive) return null;

  const pingColor = variant === "emerald" ? "bg-emerald-500/40" : "bg-amber-500/40";
  const dotColor = variant === "emerald" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
      <span className={`w-14 h-14 rounded-full ${pingColor} animate-ping absolute`} />
      <span
        className={`w-6 h-6 rounded-full ${dotColor} border-2 border-white shadow-lg animate-pulse`}
      />
    </div>
  );
}

// =============================================================================
// IZOLOWANY KOMPONENT PASKA POSTĘPU (ZAPOBIEGA ZBĘDNYM PRZERENDEROWANIOM STRONY)
// =============================================================================
function ShowcaseProgressBar({
  currentStep,
  isPlaying,
  playbackSpeed,
  durationMs,
}: {
  currentStep: ShowcaseStepId;
  isPlaying: boolean;
  playbackSpeed: number;
  durationMs: number;
}) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    setPercent(0);
    const totalDuration = durationMs / playbackSpeed;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / totalDuration) * 100);
      setPercent(p);
      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentStep, isPlaying, playbackSpeed, durationMs]);

  return (
    <div className="w-full bg-stone-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
      <div
        className="bg-amber-500 h-full rounded-full transition-all duration-75"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// =============================================================================
// GŁÓWNA STRONA SHOWCASE (ODTWARZACZ + SYMULACJA APLIKACJI)
// Przełączanie etapów: ZWYKŁE CIĘCIE (BEZ PRZEJŚĆ I ZANIKANIA)
// =============================================================================
export default function ShowcasePage() {
  const [currentStep, setCurrentStep] = useState<ShowcaseStepId>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // DETERMINISTYCZNY I NIEZAWODNY ZEGAR ODTWARZANIA KROKÓW (BRAK POMIJANIA ETAPÓW)
  // Przechodzi płynnie 0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 0
  useEffect(() => {
    if (!isPlaying) return;

    const stepMeta = SHOWCASE_STEPS.find((s) => s.id === currentStep) || SHOWCASE_STEPS[0];
    const totalDuration = stepMeta.durationMs / playbackSpeed;

    const timer = setTimeout(() => {
      setCurrentStep((curr) => (curr < 6 ? ((curr + 1) as ShowcaseStepId) : 0));
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, playbackSpeed]);

  const handleSelectStep = (step: ShowcaseStepId) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    setCurrentStep((prev) => (prev < 6 ? ((prev + 1) as ShowcaseStepId) : 0));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev > 0 ? ((prev - 1) as ShowcaseStepId) : 6));
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentMeta = SHOWCASE_STEPS.find((s) => s.id === currentStep) || SHOWCASE_STEPS[0];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-[#F6F5F0] dark:bg-[#141518] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-300 ${
        isFullscreen ? "p-3 sm:p-6" : "py-4 px-3 sm:px-6 max-w-7xl mx-auto"
      }`}
    >
      {/* ========================================================================= */}
      {/* GÓRNY PASEK STEROWANIA SHOWCASE (TIMELINE & PLAYER CONTROLS) */}
      {/* ========================================================================= */}
      <div className="bg-white/95 dark:bg-[#1C1E23]/95 backdrop-blur-md rounded-2xl border border-stone-200/90 dark:border-white/10 shadow-xs p-3 sm:p-4 mb-4 select-none shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Informacja o kroku */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold font-ubuntu shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                  {currentMeta.badge}
                </span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Ekran: {currentMeta.screenName}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white truncate">
                {currentMeta.title}
              </h1>
            </div>
          </div>

          {/* Kontrolki odtwarzacza */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handlePrev}
              title="Poprzedni krok"
              className="p-2 rounded-xl bg-stone-100 dark:bg-white/10 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer transition-all"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-2xs cursor-pointer transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Zatrzymaj" : "Odtwarzaj"}</span>
            </button>

            <button
              onClick={handleNext}
              title="Następny krok"
              className="p-2 rounded-xl bg-stone-100 dark:bg-white/10 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                setPlaybackSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 0.75 : 1))
              }
              title="Zmień tempo animacji"
              className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-white/10 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-mono font-bold cursor-pointer"
            >
              {playbackSpeed}x
            </button>

            <button
              onClick={handleToggleFullscreen}
              title="Pełny ekran"
              className="p-2 rounded-xl bg-stone-100 dark:bg-white/10 hover:bg-stone-200 text-stone-700 dark:text-stone-300 cursor-pointer transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Linia postępu dla aktywnego kroku */}
        <ShowcaseProgressBar
          key={currentStep}
          currentStep={currentStep}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          durationMs={currentMeta.durationMs}
        />

        {/* Przyciski skoków do kroków */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mt-3 pt-2 border-t border-stone-100 dark:border-white/5">
          {SHOWCASE_STEPS.map((s) => {
            const isActive = s.id === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStep(s.id)}
                className={`text-left px-2 py-1.5 rounded-xl text-[10px] sm:text-xs transition-all cursor-pointer truncate ${
                  isActive
                    ? "bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-300 font-bold"
                    : "bg-stone-50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 border border-transparent"
                }`}
              >
                <span className="block opacity-60 text-[9px]">
                  {s.id === 0 ? "START" : s.id === 6 ? "FINAŁ" : `0${s.id}`}
                </span>
                <span className="truncate block font-semibold">{s.screenName.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GŁÓWNA RAMKA APARATU / SYMULATOR APLIKACJI MINNO */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col rounded-3xl border border-stone-200/90 dark:border-white/15 bg-white dark:bg-[#18191E] shadow-xl overflow-hidden relative min-h-[640px]">
        {/* Atrapowy pasek nagłówka aplikacji */}
        <div className="px-5 py-3 border-b border-stone-100 dark:border-white/10 flex items-center justify-between bg-stone-50/80 dark:bg-[#1C1E23]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0">
              <img
                src="/logo.svg"
                alt="Logo MiNNO"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:via-stone-200 dark:to-stone-400 bg-clip-text text-transparent tracking-tight"
              style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
            >
              MiNNO
            </span>
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest ml-2 border-l border-stone-300 dark:border-white/15 pl-2.5 hidden sm:inline-block">
              Małopolskie Innowacje Społeczne
            </span>
          </div>

          {/* Zakładki nawigacji */}
          <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-white/10 p-0.5 rounded-xl text-xs font-semibold">
            {[
              { id: 1, label: "Asystent" },
              { id: 2, label: "Raporty" },
              { id: 3, label: "Zaproponuj" },
              { id: 4, label: "Innowacje" },
              { id: 5, label: "Czat" },
            ].map((tab) => {
              const isActive = currentStep === tab.id;
              return (
                <span
                  key={tab.id}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isActive
                      ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-bold shadow-2xs"
                      : "text-stone-500 opacity-60"
                  }`}
                >
                  {tab.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* GŁÓWNA PRZESTRZEŃ SCENY – ZWYKŁE CIĘCIE (BEZ PRZEJŚĆ I ZANIKANIA) */}
        <div className="flex-1 relative overflow-y-auto min-h-0 flex flex-col">
          {currentStep === 0 && <ShowcaseIntroStep />}
          {currentStep === 1 && <ShowcaseMatchingStep />}
          {currentStep === 2 && <ShowcaseRagKnowledgeStep />}
          {currentStep === 3 && <ShowcaseProposeCreatorStep />}
          {currentStep === 4 && <ShowcaseMiddlemanStep />}
          {currentStep === 5 && <ShowcaseChatStep />}
          {currentStep === 6 && <ShowcaseOutroStep />}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// KROK 0: EKRAN STARTOWY (INTRO)
// =============================================================================
function ShowcaseIntroStep() {
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSubtitle(true);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 40%, #FAF4E5 0%, #FFFFFF 55%, #FAFAF8 80%, #F5F5F0 100%)",
      }}
    >
      <div className="space-y-6 max-w-xl mx-auto flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-lg border border-black/5">
          <img
            src="/logo.svg"
            alt="Logo MiNNO"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <span
            className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:via-stone-200 dark:to-stone-400 bg-clip-text text-transparent tracking-tight"
            style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
          >
            MiNNO
          </span>
        </div>

        {showSubtitle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-200">
              Małopolskie Innowacje Społeczne
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-md mx-auto">
              Prezentacja kompletnej ścieżki rozwoju innowacji
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// KROK 1: ASYSTENT AI (/matching)
// =============================================================================
function ShowcaseMatchingStep() {
  const [subStage, setSubStage] = useState<"idle" | "typing" | "sent" | "searching" | "result">(
    "idle"
  );
  const promptText = "mam pomysl zeby konradowi podarowac krzeslo bo jest mu zimno i twardo";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const t1 = setTimeout(() => {
      setSubStage("typing");
    }, 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (subStage !== "typing") return;

    let index = 0;
    const interval = setInterval(() => {
      index++;
      setTypedText(promptText.slice(0, index));
      if (index >= promptText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setSubStage("sent");
          setTimeout(() => {
            setSubStage("searching");
            setTimeout(() => {
              setSubStage("result");
            }, 2600);
          }, 1000);
        }, 800);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [subStage]);

  return (
    <div
      className="flex-1 flex flex-col h-full p-4 sm:p-7 relative select-none"
      style={{
        background:
          "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
      }}
    >
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full space-y-6">
        {subStage === "idle" || subStage === "typing" ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-7 h-7 text-[#EFE5C6]" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[0.98]">
              <span className="block text-stone-900">Sprawdź, czy Twój pomysł</span>
              <span className="block text-stone-300">już istnieje</span>
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
              Wpisz lub podyktuj poniżej swój pomysł na innowację społeczną. Asystent przeszuka bazę
              sprawdzonych innowacji ROPS.
            </p>
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto max-h-[460px] pr-2">
            <div className="flex justify-end">
              <div className="bg-stone-900 text-white rounded-3xl rounded-tr-md px-5 py-3.5 text-sm sm:text-base leading-relaxed max-w-[85%] shadow-xs">
                <p>{promptText}</p>
                <span className="block text-[10px] text-stone-400 mt-1 text-right">Teraz</span>
              </div>
            </div>

            {subStage === "searching" && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-ubuntu font-bold text-xs shrink-0 mt-1">
                  m
                </div>
                <div className="p-4 bg-white/95 rounded-2xl border border-stone-200 shadow-2xs flex items-center gap-3 text-stone-700 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="font-semibold animate-pulse">
                    przeszukiwanie bazy rops... (482 rekordy)
                  </span>
                </div>
              </div>
            )}

            {subStage === "result" && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-ubuntu font-bold text-xs shrink-0 mt-1">
                  m
                </div>

                <div className="space-y-3.5 flex-1 max-w-2xl">
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-600 text-white">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Weryfikacja zakończona
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-emerald-950 tracking-tight">
                      to jest świeży pomysł! mozesz go wdrozyc
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                      W repozytorium ROPS Kraków nie znaleziono zbieżnego projektu chroniącego
                      Konrada przed twardym i zimnym podłożem. Twój pomysł ma znamiona autentycznej
                      innowacji społecznej.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/90 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-stone-700">
                        Zalecenie: pobierz dane demograficzne i zdrowotne z Bazy RAG
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0">
                      <span>RAG</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="bg-white/95 rounded-2xl border-2 border-stone-200/80 focus-within:border-stone-900 p-3 shadow-sm flex flex-col gap-2">
          <div className="min-h-[44px] flex items-center px-2 text-stone-900 font-medium text-sm sm:text-base">
            {subStage === "typing" || subStage === "idle" ? (
              <span>
                {typedText}
                <span className="inline-block w-2 h-4 bg-stone-900 ml-0.5 animate-pulse" />
              </span>
            ) : (
              <span className="text-stone-400">Wpisz kolejny pomysł lub pytanie...</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 font-medium">
              Model wektorowy ROPS Kraków
            </span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                subStage === "typing"
                  ? "bg-amber-500 text-white scale-105"
                  : "bg-stone-900 text-white opacity-80"
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// KROK 2: WYSZUKIWARKA RAG (/knowledge)
// =============================================================================
function ShowcaseRagKnowledgeStep() {
  const [stage, setStage] = useState<"typing" | "loading" | "chart" | "conclusion">("typing");
  const ragQuery = "daj mi dane nt konrada";
  const [typedQuery, setTypedQuery] = useState("");
  const [visiblePoints, setVisiblePoints] = useState<number>(0);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setTypedQuery(ragQuery.slice(0, idx));
      if (idx >= ragQuery.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStage("loading");
          setTimeout(() => {
            setStage("chart");
            setTimeout(() => setVisiblePoints(1), 250);
            setTimeout(() => setVisiblePoints(2), 900);
            setTimeout(() => setVisiblePoints(3), 1700);
            setTimeout(() => setVisiblePoints(4), 2500);
            setTimeout(() => setVisiblePoints(5), 3300);

            setTimeout(() => {
              setStage("conclusion");
            }, 3900);
          }, 1300);
        }, 600);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 space-y-6 relative select-none">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
              Wyszukiwarka Analityczna RAG (ROPS)
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              Oficjalne wskaźniki diagnoz regionalnych i monitoring dobrostanu
            </p>
          </div>
        </div>

        <div className="mt-4 relative flex items-center bg-white dark:bg-[#141518] rounded-2xl border-2 border-stone-200 dark:border-white/15 p-3.5 shadow-xs">
          <Search className="w-5 h-5 text-stone-400 mr-3 shrink-0" />
          <span className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white flex-1">
            {typedQuery}
            {stage === "typing" && (
              <span className="inline-block w-2 h-4 bg-amber-600 ml-1 animate-pulse" />
            )}
          </span>
          <span className="px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generuj raport</span>
          </span>
        </div>
      </div>

      {stage === "loading" && (
        <div className="max-w-4xl mx-auto w-full p-8 rounded-3xl bg-white dark:bg-[#1C1E23] border border-stone-200 dark:border-white/10 shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-stone-600 uppercase tracking-widest animate-pulse">
            Pobieranie szeregów czasowych z bazy ROPS...
          </p>
        </div>
      )}

      {(stage === "chart" || stage === "conclusion") && (
        <div className="max-w-4xl mx-auto w-full rounded-3xl bg-white dark:bg-[#1C1E23] border border-stone-200/90 dark:border-white/10 p-5 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-white/10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Podmiot analizy: Konrad (Praca stacjonarna / Małopolska)</span>
            </div>
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 font-mono font-bold">
              <TrendingDown className="w-4 h-4" />
              <span>Spadek dobrostanu: -87.5%</span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                Wskaźnik komfortu termicznego i ergonomii Konrada (2020–2024)
              </h3>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Punktacja ROPS (0-100)
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#141518] border border-stone-200/70 dark:border-white/10 relative overflow-hidden">
              <svg viewBox="0 0 500 180" className="w-full h-44 overflow-visible">
                <line x1="40" y1="20" x2="480" y2="20" stroke="#E5E5E5" strokeDasharray="3 3" />
                <line x1="40" y1="65" x2="480" y2="65" stroke="#E5E5E5" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="480" y2="110" stroke="#E5E5E5" strokeDasharray="3 3" />
                <line x1="40" y1="155" x2="480" y2="155" stroke="#E5E5E5" />

                <text x="25" y="24" fontSize="10" fill="#999" textAnchor="end">100</text>
                <text x="25" y="69" fontSize="10" fill="#999" textAnchor="end">60</text>
                <text x="25" y="114" fontSize="10" fill="#999" textAnchor="end">30</text>
                <text x="25" y="158" fontSize="10" fill="#999" textAnchor="end">0</text>

                <defs>
                  <linearGradient id="slowChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 60 30 L 160 55 L 260 95 L 360 135 L 460 162 L 460 165 L 60 165 Z"
                  fill="url(#slowChartGradient)"
                />

                <motion.path
                  d="M 60 30 L 160 55 L 260 95 L 360 135 L 460 162"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3.5, ease: "easeInOut" }}
                />

                {[
                  { cx: 60, cy: 30, year: "2020", val: "88 pkt" },
                  { cx: 160, cy: 55, year: "2021", val: "74 pkt" },
                  { cx: 260, cy: 95, year: "2022", val: "52 pkt" },
                  { cx: 360, cy: 135, year: "2023", val: "31 pkt" },
                  { cx: 460, cy: 162, year: "2024", val: "11 pkt" },
                ].map((pt, i) => {
                  const isVisible = visiblePoints > i;
                  return (
                    <g key={i}>
                      {isVisible && (
                        <motion.g
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <circle cx={pt.cx} cy={pt.cy} r="5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2.5" />
                          <text x={pt.cx} y={175} fontSize="10" fill="#666" textAnchor="middle" fontWeight="bold">
                            {pt.year}
                          </text>
                          <text x={pt.cx} y={pt.cy - 10} fontSize="10" fill="#DC2626" textAnchor="middle" fontWeight="bold">
                            {pt.val}
                          </text>
                        </motion.g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {stage === "conclusion" && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="p-5 sm:p-6 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-950 dark:text-amber-200 space-y-2.5 shadow-sm"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>Kluczowa Konkluzja Analityczna RAG</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                wniosek: konrad naprawde potrzebuje krzesla
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                Dane jednoznacznie potwierdzają postępujący spadek komfortu termicznego (z 88 do 11 pkt).
                Lodowata podłoga i brak ergonomicznego podparcia stanowią pilne wyzwanie społeczne.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// KROK 3: KREATOR INNOWACJI (/propose)
// - Zwykłe cięcie między etapami (brak przejścia i zanikania)
// - Etap 1 i 2 zaczynają się od animacji pisania w inputach
// - Wyłącznie naturalne tapnięcie (ripple) BEZ sztucznego kursora i BEZ napisów
// - Czyste zdjęcie chair.jpg BEZ zbędnych etykiet
// =============================================================================
function ShowcaseProposeCreatorStep() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeTapTarget, setActiveTapTarget] = useState<string | null>(null);
  const [isTapping, setIsTapping] = useState(false);
  const [selectedStageOption, setSelectedStageOption] = useState<"prototype" | "none">("prototype");
  const [aiAssistantSpoke, setAiAssistantSpoke] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Stany pisania dla etapu 1
  const fullTitle = "Ergonomiczne Krzesło Termiczne dla Konrada";
  const [typedTitle, setTypedTitle] = useState("");
  const [isTypingTitle, setIsTypingTitle] = useState(false);

  const fullDescription =
    "Konrad spędza wiele godzin dziennie przy pracy stacjonarnej. Z powodu chłodu od podłoża i twardego siedziska odczuwa ból i dyskomfort. Mebel ma to rozwiązać.";
  const [typedDescription, setTypedDescription] = useState("");
  const [isTypingDescription, setIsTypingDescription] = useState(false);

  // Stany pisania dla etapu 2
  const fullInnovation =
    "Połączenie konstrukcji dębowej z termoizolacyjną pianką pamięciową oraz barierą blokującą mostki termiczne z posadzki.";
  const [typedInnovation, setTypedInnovation] = useState("");
  const [isTypingInnovation, setIsTypingInnovation] = useState(false);

  const fullTarget =
    "Konrad oraz osoby pracujące i przebywające w chłodnych przestrzeniach Małopolski.";
  const [typedTarget, setTypedTarget] = useState("");
  const [isTypingTarget, setIsTypingTarget] = useState(false);

  useEffect(() => {
    // -------------------------------------------------------------
    // ETAP 1 (0.0s - 4.6s): Pisanie w inputach + Tapnięcie
    // -------------------------------------------------------------
    // 1. Start wpisywania tytułu
    const t1_title_start = setTimeout(() => {
      setIsTypingTitle(true);
      let idx = 0;
      const titleInterval = setInterval(() => {
        idx += 2;
        setTypedTitle(fullTitle.slice(0, idx));
        if (idx >= fullTitle.length) {
          clearInterval(titleInterval);
          setIsTypingTitle(false);
        }
      }, 30);
    }, 300);

    // 2. Start wpisywania opisu
    const t1_desc_start = setTimeout(() => {
      setIsTypingDescription(true);
      let idx = 0;
      const descInterval = setInterval(() => {
        idx += 4;
        setTypedDescription(fullDescription.slice(0, idx));
        if (idx >= fullDescription.length) {
          clearInterval(descInterval);
          setIsTypingDescription(false);
        }
      }, 25);
    }, 1200);

    // 3. Tapnięcie na "Dalej: Innowacja i odbiorcy" po zakończeniu pisania (3.7s)
    const t1_tap = setTimeout(() => {
      setActiveTapTarget("step1-next");
      setIsTapping(true);
    }, 3700);

    // 4. Przejście do etapu 2 – ZWYKŁE CIĘCIE (4.5s)
    const t1_next = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
      setStep(2);
    }, 4500);

    // -------------------------------------------------------------
    // ETAP 2 (4.5s - 9.3s): Pisanie w inputach + Tapnięcie
    // -------------------------------------------------------------
    // 5. Start wpisywania innowacji (4.8s)
    const t2_inno_start = setTimeout(() => {
      setIsTypingInnovation(true);
      let idx = 0;
      const innoInterval = setInterval(() => {
        idx += 3;
        setTypedInnovation(fullInnovation.slice(0, idx));
        if (idx >= fullInnovation.length) {
          clearInterval(innoInterval);
          setIsTypingInnovation(false);
        }
      }, 25);
    }, 4800);

    // 6. Start wpisywania grupy docelowej (6.0s)
    const t2_target_start = setTimeout(() => {
      setIsTypingTarget(true);
      let idx = 0;
      const targetInterval = setInterval(() => {
        idx += 3;
        setTypedTarget(fullTarget.slice(0, idx));
        if (idx >= fullTarget.length) {
          clearInterval(targetInterval);
          setIsTypingTarget(false);
        }
      }, 25);
    }, 6000);

    // 7. Tapnięcie na "Dalej: Kategoria i etap" (8.4s)
    const t2_tap = setTimeout(() => {
      setActiveTapTarget("step2-next");
      setIsTapping(true);
    }, 8400);

    // 8. Przejście do etapu 3 – ZWYKŁE CIĘCIE (9.2s)
    const t2_next = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
      setStep(3);
    }, 9200);

    // -------------------------------------------------------------
    // ETAP 3 (9.2s - 13.0s): Wybór etapu + Tapnięcie
    // -------------------------------------------------------------
    // 9. Tapnięcie na opcję "Prototyp" po 10.4s
    const t3_tap_pick = setTimeout(() => {
      setActiveTapTarget("pick-prototype");
      setIsTapping(true);
      setSelectedStageOption("prototype");
    }, 10400);

    const t3_untap_pick = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
    }, 11200);

    // 10. Tapnięcie na "Dalej: Podsumowanie" po 12.0s
    const t3_tap_next = setTimeout(() => {
      setActiveTapTarget("step3-next");
      setIsTapping(true);
    }, 12000);

    // 11. Przejście do etapu 4 – ZWYKŁE CIĘCIE (12.8s)
    const t3_next = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
      setStep(4);
    }, 12800);

    // -------------------------------------------------------------
    // ETAP 4 (12.8s - 24.0s): Podsumowanie, AI Photo & Asystent
    // -------------------------------------------------------------
    // 12. Asystent treści AI zabiera głos po 14.0s
    const t4_ai = setTimeout(() => {
      setAiAssistantSpoke(true);
    }, 14000);

    // 13. Tapnięcie na "Zaakceptuj zmianę" po 16.4s
    const t4_tap_accept = setTimeout(() => {
      setActiveTapTarget("accept-suggestion");
      setIsTapping(true);
      setSuggestionApplied(true);
    }, 16400);

    const t4_untap_accept = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
    }, 17200);

    // 14. Tapnięcie na "Opublikuj pomysł w MiNNO" po 18.8s
    const t4_tap_pub = setTimeout(() => {
      setActiveTapTarget("publish-idea");
      setIsTapping(true);
      setIsPublished(true);
    }, 18800);

    const t4_finish = setTimeout(() => {
      setIsTapping(false);
      setActiveTapTarget(null);
    }, 19800);

    return () => {
      clearTimeout(t1_title_start);
      clearTimeout(t1_desc_start);
      clearTimeout(t1_tap);
      clearTimeout(t1_next);
      clearTimeout(t2_inno_start);
      clearTimeout(t2_target_start);
      clearTimeout(t2_tap);
      clearTimeout(t2_next);
      clearTimeout(t3_tap_pick);
      clearTimeout(t3_untap_pick);
      clearTimeout(t3_tap_next);
      clearTimeout(t3_next);
      clearTimeout(t4_ai);
      clearTimeout(t4_tap_accept);
      clearTimeout(t4_untap_accept);
      clearTimeout(t4_tap_pub);
      clearTimeout(t4_finish);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-7 space-y-6 relative select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-[0.95] select-none">
              <span className="block text-stone-900 dark:text-white">Zaproponuj Pomysł</span>
              <span className="block text-stone-400">Stwórz Innowację</span>
            </div>
          </div>
        </div>

        {/* Pasek postępu 4 kroków kreatora */}
        <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            { id: 1, label: "Tytuł i opis" },
            { id: 2, label: "Innowacja i odbiorcy" },
            { id: 3, label: "Kategoria i etap" },
            { id: 4, label: "Podsumowanie" },
          ].map((s, idx) => {
            const done = idx < step - 1;
            const active = idx === step - 1;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      active
                        ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs ring-2 ring-amber-500/50"
                        : done
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 dark:bg-white/10 text-stone-500"
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </span>
                  <span
                    className={
                      active
                        ? "font-bold text-stone-900 dark:text-white"
                        : "text-stone-500 font-medium"
                    }
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && <span className="w-5 h-px bg-stone-300 dark:bg-white/10 mx-1" />}
              </li>
            );
          })}
        </ol>

        {/* =================================================================== */}
        {/* KROK 1 KREATORA: Tytuł i opis (Zwykłe cięcie, bez tranzycji) */}
        {/* =================================================================== */}
        {step === 1 && (
          <div className="rounded-[28px] bg-[#d8e2f2] dark:bg-[#0b1524]/20 p-6 sm:p-8 border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-5 transition-all">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                Podstawowe informacje o pomyśle
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                Podaj zwięzły tytuł oraz opis problemu, który chcesz rozwiązać w swojej okolicy.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-stone-500" />
                  <span>Tytuł pomysłu <span className="text-rose-600">*</span></span>
                </label>
                <span className="text-[11px] text-stone-500 font-mono">
                  {typedTitle.length} / 80 znaków
                </span>
              </div>
              <div className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 text-sm font-semibold shadow-2xs min-h-[46px] flex items-center">
                {typedTitle ? (
                  <span>
                    {typedTitle}
                    {isTypingTitle && (
                      <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : isTypingTitle ? (
                  <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse" />
                ) : (
                  <span className="text-stone-300 font-normal">Wpisz tytuł pomysłu...</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span>Opis pomysłu <span className="text-rose-600">*</span></span>
                </label>
                <span className="text-[11px] text-stone-500 font-mono">min. 10 znaków</span>
              </div>
              <div className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-800 text-xs sm:text-sm leading-relaxed shadow-2xs min-h-[72px]">
                {typedDescription ? (
                  <span>
                    {typedDescription}
                    {isTypingDescription && (
                      <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : isTypingDescription ? (
                  <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse" />
                ) : (
                  <span className="text-stone-300 font-normal">Opisz szczegółowo swój pomysł...</span>
                )}
              </div>
            </div>

            {/* PRZYCISK DALEJ Z CZYSTĄ ANIMACJĄ TAPNIĘCIA (RIPPLE) */}
            <div className="flex justify-end pt-2 border-t border-black/5 relative">
              <div className="relative">
                <TapRippleEffect
                  isActive={activeTapTarget === "step1-next" && isTapping}
                  variant="amber"
                />
                <div
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all ${
                    activeTapTarget === "step1-next" && isTapping
                      ? "bg-amber-600 text-white scale-95 ring-4 ring-amber-400/50 shadow-md"
                      : "bg-stone-900 text-white"
                  }`}
                >
                  <span>Dalej: Innowacja i odbiorcy</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* KROK 2 KREATORA: Innowacja i odbiorcy (Zwykłe cięcie, bez tranzycji) */}
        {/* =================================================================== */}
        {step === 2 && (
          <div className="rounded-[28px] bg-[#d8e2f2] dark:bg-[#0b1524]/20 p-6 sm:p-8 border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-5 transition-all">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                Innowacyjność i odbiorcy
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                Wyjaśnij, co wyróżnia Twój pomysł oraz dla kogo jest on przeznaczony.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <span>Na czym polega innowacja? <span className="text-rose-600">*</span></span>
              </label>
              <div className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm font-medium leading-relaxed min-h-[58px]">
                {typedInnovation ? (
                  <span>
                    {typedInnovation}
                    {isTypingInnovation && (
                      <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : isTypingInnovation ? (
                  <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse" />
                ) : (
                  <span className="text-stone-300">Opisz nowatorski charakter rozwiązania...</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-stone-500" />
                <span>Dla kogo jest ten projekt? (Grupa docelowa) <span className="text-rose-600">*</span></span>
              </label>
              <div className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs sm:text-sm font-medium leading-relaxed min-h-[58px]">
                {typedTarget ? (
                  <span>
                    {typedTarget}
                    {isTypingTarget && (
                      <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
                    )}
                  </span>
                ) : isTypingTarget ? (
                  <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse" />
                ) : (
                  <span className="text-stone-300">Wskaż grupę odbiorców projektu...</span>
                )}
              </div>
            </div>

            {/* PRZYCISK DALEJ Z CZYSTĄ ANIMACJĄ TAPNIĘCIA (RIPPLE) */}
            <div className="flex justify-end pt-2 border-t border-black/5 relative">
              <div className="relative">
                <TapRippleEffect
                  isActive={activeTapTarget === "step2-next" && isTapping}
                  variant="amber"
                />
                <div
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all ${
                    activeTapTarget === "step2-next" && isTapping
                      ? "bg-amber-600 text-white scale-95 ring-4 ring-amber-400/50 shadow-md"
                      : "bg-stone-900 text-white"
                  }`}
                >
                  <span>Dalej: Kategoria i etap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* KROK 3 KREATORA: Etap rozwoju i kategoria (Zwykłe cięcie) */}
        {/* =================================================================== */}
        {step === 3 && (
          <div className="rounded-[28px] bg-[#d8e2f2] dark:bg-[#0b1524]/20 p-6 sm:p-8 border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-5 transition-all">
            <div className="border-b border-black/5 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                Etap rozwoju i kategoria
              </h2>
              <p className="text-stone-600 dark:text-stone-400 text-xs mt-0.5">
                Określ stopień zaawansowania oraz główną dziedzinę projektu społecznego.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-stone-500" />
                <span>Etap pomysłu</span>
              </label>

              <div className="grid grid-cols-2 gap-3 relative">
                {/* KARTA PROTOTYP Z TAPNIĘCIEM */}
                <div className="relative">
                  <TapRippleEffect
                    isActive={activeTapTarget === "pick-prototype" && isTapping}
                    variant="amber"
                  />
                  <div
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all ${
                      selectedStageOption === "prototype"
                        ? "border-stone-900 bg-white shadow-xs"
                        : "border-stone-300 bg-white/70"
                    } ${
                      activeTapTarget === "pick-prototype" && isTapping
                        ? "ring-4 ring-amber-400/50 scale-95"
                        : ""
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-stone-900 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-stone-900" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">Prototyp</span>
                      <span className="text-[10px] text-stone-500">Koncepcja gotowa do testu</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-stone-200 bg-white opacity-60 flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-stone-300" />
                  <div>
                    <span className="text-xs font-bold text-stone-700 block">Wdrożenie</span>
                    <span className="text-[10px] text-stone-500">Gotowy wyrób</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-stone-500" />
                <span>Kategoria projektu</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs shadow-2xs">
                  Społeczność & Życie
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white text-stone-600 text-xs">
                  Zdrowie i Bezpieczeństwo
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-white text-stone-600 text-xs">
                  Praca i Finanse
                </span>
              </div>
            </div>

            {/* PRZYCISK DALEJ Z CZYSTĄ ANIMACJĄ TAPNIĘCIA (RIPPLE) */}
            <div className="flex justify-end pt-2 border-t border-black/5 relative">
              <div className="relative">
                <TapRippleEffect
                  isActive={activeTapTarget === "step3-next" && isTapping}
                  variant="amber"
                />
                <div
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all ${
                    activeTapTarget === "step3-next" && isTapping
                      ? "bg-amber-600 text-white scale-95 ring-4 ring-amber-400/50 shadow-md"
                      : "bg-stone-900 text-white"
                  }`}
                >
                  <span>Dalej: Podsumowanie i opcje</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* KROK 4 KREATORA: Podsumowanie, Wizualizacja AI i Asystent Treści */}
        {/* =================================================================== */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-[28px] bg-[#d8e2f2] dark:bg-[#0b1524]/20 p-5 sm:p-7 border border-stone-200/80 dark:border-white/10 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-black/5 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">
                  Podsumowanie danych projektu
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/90 border border-black/5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Tytuł</span>
                  <p className="font-bold text-stone-900">Ergonomiczne Krzesło Termiczne dla Konrada</p>
                </div>
                <div className="p-3 rounded-xl bg-white/90 border border-black/5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Kategoria & Etap</span>
                  <p className="font-semibold text-stone-800">Społeczność & Życie · Prototyp</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CZYSTE ZDJĘCIE BEZ LABELA */}
              <div className="rounded-[28px] p-5 bg-white dark:bg-[#1C1E23] border border-black/5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Wizualizacja AI
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Gotowe
                  </span>
                </div>

                <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs bg-stone-100">
                  <Image
                    src="/chair.jpg"
                    alt="Ergonomiczne Krzesło dla Konrada"
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* ASYSTENT TREŚCI AI */}
              <div className="rounded-[28px] p-5 bg-white dark:bg-[#1C1E23] border border-black/5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                    <div className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-xs font-ubuntu">
                      m
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">Asystent Treści AI</h4>
                      <span className="text-[10px] text-stone-400">Optymalizacja wniosku</span>
                    </div>
                  </div>

                  {aiAssistantSpoke && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 space-y-2"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sugestia Asystenta:</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold leading-snug">
                        „zaznacz w opisie że podłoga jest zimna”
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                        <div className="p-2 rounded-lg bg-stone-100 border border-stone-200 text-stone-600">
                          <span className="font-bold block text-stone-400">Przed:</span>
                          Zimno i twardo
                        </div>
                        <div
                          className={`p-2 rounded-lg border font-semibold transition-all ${
                            suggestionApplied
                              ? "bg-emerald-100 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/30"
                              : "bg-stone-50 border-stone-200 text-stone-600"
                          }`}
                        >
                          <span className="font-bold block text-emerald-700">Po:</span>
                          + podłoga jest zimna (izolacja)
                        </div>
                      </div>

                      {/* PRZYCISK ZAAKCEPTUJ ZMIANĘ Z ANIMACJĄ TAPNIĘCIA */}
                      <div className="pt-1 relative">
                        <div className="relative inline-block">
                          <TapRippleEffect
                            isActive={activeTapTarget === "accept-suggestion" && isTapping}
                            variant="amber"
                          />
                          <button
                            type="button"
                            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-all shadow-xs ${
                              suggestionApplied
                                ? "bg-emerald-600 text-white"
                                : activeTapTarget === "accept-suggestion" && isTapping
                                ? "bg-amber-600 text-white scale-95 ring-4 ring-amber-400/50"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {suggestionApplied ? "Zaakceptowano zmianę!" : "Zaakceptuj zmianę"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* PRZYCISK PUBLIKACJI Z ANIMACJĄ TAPNIĘCIA */}
                <div className="pt-2 border-t border-stone-100 relative">
                  <div className="relative">
                    <TapRippleEffect
                      isActive={activeTapTarget === "publish-idea" && isTapping}
                      variant="emerald"
                    />
                    <motion.div
                      animate={
                        isPublished
                          ? { scale: [1, 1.02, 1], backgroundColor: "#059669" }
                          : activeTapTarget === "publish-idea" && isTapping
                          ? { scale: 0.95 }
                          : { scale: 1 }
                      }
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isPublished
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-400/40"
                          : "bg-stone-900 text-white"
                      }`}
                    >
                      {isPublished ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Opublikowano pomysł w MiNNO!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Opublikuj pomysł w MiNNO</span>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// KROK 4: EKRAN MIDDLEMAN (/middleman) – IDENTYCZNY Z ORYGINAŁEM
// =============================================================================
function ShowcaseMiddlemanStep() {
  const [hasTappedGrant, setHasTappedGrant] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [expertResponded, setExpertResponded] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setShowRipple(true);
      const t2 = setTimeout(() => {
        setHasTappedGrant(true);
        const t3 = setTimeout(() => {
          setExpertResponded(true);
        }, 2500);
        return () => clearTimeout(t3);
      }, 700);
      return () => clearTimeout(t2);
    }, 2400);

    return () => {
      clearTimeout(t1);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-7 space-y-6 relative select-none">
      <div className="max-w-4xl mx-auto w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-[0.95] select-none">
              <span className="block text-stone-900 dark:text-white">Middleman Innowacji</span>
              <span className="block text-stone-400">Adaptacja dla instytucji</span>
            </div>
            <p className="mt-2 text-stone-500 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              Dostosuj sprawdzoną innowację społeczną do budżetu, kadry i potrzeb mieszkańców w Twojej gminie.
            </p>
          </div>
        </div>

        <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          {[
            { id: "pick", label: "Wybierz innowację", done: true },
            { id: "view", label: "Szczegóły innowacji", active: true },
            { id: "profile", label: "Opisz instytucję", done: false },
            { id: "result", label: "Dostosowana usługa", done: false },
          ].map((s, idx) => (
            <li key={s.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    s.done
                      ? "bg-emerald-600 text-white"
                      : s.active
                      ? "bg-stone-900 text-white shadow-2xs"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {s.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span
                  className={
                    s.active
                      ? "font-semibold text-stone-900 dark:text-white"
                      : "text-stone-500 font-medium"
                  }
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && <span className="w-5 h-px bg-stone-300 mx-1" />}
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF5EC] dark:bg-[#26231A] border border-[#EFE4CC] dark:border-amber-500/25">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-950 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>Społeczność & Życie</span>
            </span>
            <p className="text-base font-bold text-stone-900 dark:text-white pt-0.5">
              Ergonomiczne Krzesło Termiczne dla Konrada
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 shrink-0 text-stone-500" />
              <span>Konrad oraz osoby przebywające na wychłodzonych posadzkach</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-black/10 text-stone-700 shadow-2xs">
              Wybrana innowacja
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
            Katalog Bazy Innowacji ROPS (Oryginalna paleta barw kategorii):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#EFE4CC] shadow-2xs space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-950 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                <span>Społeczność & Życie</span>
              </span>
              <h4 className="font-bold text-xs text-stone-900 leading-snug">
                Krzesło Termiczne dla Konrada
              </h4>
              <p className="text-[11px] text-stone-600 line-clamp-2">
                Izolacja od zimnej posadzki, dąb i pianka visco.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F1F4FB] border border-[#D7E0F5] shadow-2xs space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <span>Zdrowie & Dostępność</span>
              </span>
              <h4 className="font-bold text-xs text-stone-900 leading-snug">
                Mobilna Opieka Senioralna
              </h4>
              <p className="text-[11px] text-stone-600 line-clamp-2">
                Dojazd fizjoterapeutów do oddalonych sołectw.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF1F3] border border-[#F2D6DC] shadow-2xs space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-950 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                <span>Rynek Pracy & Finanse</span>
              </span>
              <h4 className="font-bold text-xs text-stone-900 leading-snug">
                Sąsiedzka Spółdzielnia Pracy
              </h4>
              <p className="text-[11px] text-stone-600 line-clamp-2">
                Mikro-usługi rzemieślnicze dla mieszkańców gminy.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F1FB] border border-[#E3D6F3] shadow-2xs space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-950 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                <span>Kultura & Rzemiosło</span>
              </span>
              <h4 className="font-bold text-xs text-stone-900 leading-snug">
                Kawiarenka Naprawcza
              </h4>
              <p className="text-[11px] text-stone-600 line-clamp-2">
                Międzypokoleniowe warsztaty naprawcze w gminie.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
            Dedykowane Pakiety Wdrożeniowe Middlemana:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div
              className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                hasTappedGrant
                  ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-4 ring-emerald-500/20"
                  : "border-amber-500/80 bg-white shadow-xs"
              }`}
            >
              {showRipple && !hasTappedGrant && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-amber-500/35 animate-ping absolute" />
                  <div className="w-9 h-9 rounded-full bg-amber-500/80 border-2 border-white shadow-lg animate-pulse" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 uppercase">
                  Wsparcie Finansowe ROPS
                </span>
                <span className="font-mono font-bold text-sm text-stone-900">15 000 zł</span>
              </div>
              <h4 className="font-bold text-sm text-stone-900 mt-1.5 leading-snug">
                grant na prototypowanie
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Bezpośrednie finansowanie zakupu drewna dębowego i pianek dla fotela Konrada.
              </p>

              <div className="mt-3 pt-2 border-t border-stone-200">
                <span
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    hasTappedGrant
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-900 text-white"
                  }`}
                >
                  {hasTappedGrant ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Wybrano pakiet! Wysłano wniosek</span>
                    </>
                  ) : (
                    <span>Aplikuj o grant</span>
                  )}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-white opacity-70 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase">
                Mentoring
              </span>
              <h4 className="font-bold text-sm text-stone-900">Inkubator ROPS</h4>
              <p className="text-xs text-stone-500">
                Opieka merytoryczna doradcy ds. innowacji społecznych.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-white opacity-70 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase">
                Wdrożenie
              </span>
              <h4 className="font-bold text-sm text-stone-900">Partnerstwo Samorządowe</h4>
              <p className="text-xs text-stone-500">
                Pilotaż i certyfikacja w placówkach regionalnych.
              </p>
            </div>
          </div>
        </div>

        {expertResponded && (
          <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0">
                AW
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-white">
                    dr Anna Wiśniewska (Ekspert ROPS)
                  </span>
                  <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                    Wniosek przyjęty
                  </span>
                </div>
                <p className="text-xs text-stone-300 mt-0.5">
                  Wstępnie zatwierdziliśmy grant 15 000 zł na fotel Konrada. Zapraszam do czatu!
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Czat</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// KROK 5: CZAT Z EKSPERTEM (/chat)
// - Ostatnia wiadomość w czacie to zwięzłe "Wspaniała wiadomość!"
// - Animacja pisania dla OBU osób (kropki 'pisze...')
// - Jedna osoba pisze DOPIERO KIEDY druga skończy (sekwencyjnie)
// - Zwykłe cięcie (brak tranzycji ekranu)
// =============================================================================
function ShowcaseChatStep() {
  const [expertTyping, setExpertTyping] = useState(false);
  const [expertMessageSent, setExpertMessageSent] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [userMessageSent, setUserMessageSent] = useState(false);
  const [inputLiveText, setInputLiveText] = useState("");

  const userReplyContent = "Wspaniała wiadomość!";

  useEffect(() => {
    // 1. dr Anna Wiśniewska zaczyna pisać po 1.0s
    const t1 = setTimeout(() => {
      setExpertTyping(true);
    }, 1000);

    // 2. dr Anna Wiśniewska kończy pisać po 3.6s i wysyła wiadomość
    const t2 = setTimeout(() => {
      setExpertTyping(false);
      setExpertMessageSent(true);
    }, 3600);

    // 3. Użytkownik zaczyna pisać DOPIERO PO PRZECZYTANIU (po 5.6s)
    const t3 = setTimeout(() => {
      setUserTyping(true);
    }, 5600);

    // Symulacja pisania tekstu w dolnym inpucie przez użytkownika (od 5.8s)
    const t3_type = setTimeout(() => {
      let charIdx = 0;
      const typeInterval = setInterval(() => {
        charIdx += 1;
        setInputLiveText(userReplyContent.slice(0, charIdx));
        if (charIdx >= userReplyContent.length) {
          clearInterval(typeInterval);
        }
      }, 55);
    }, 5800);

    // 4. Użytkownik kończy pisać po 7.6s i wysyła wiadomość "Wspaniała wiadomość!"
    const t4 = setTimeout(() => {
      setUserTyping(false);
      setUserMessageSent(true);
      setInputLiveText("");
    }, 7600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t3_type);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-8 space-y-4 relative select-none">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col space-y-4">
        {/* NAGŁÓWEK CZATU */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1E23] border border-stone-200 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 flex items-center justify-center font-bold text-sm">
              AW
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  dr Anna Wiśniewska
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ekspert Regionalny ROPS
                </span>
              </div>
              <p className="text-xs text-stone-500">Temat: Prototyp Krzesła Termicznego dla Konrada</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-600">Online</span>
          </div>
        </div>

        {/* OKNO ROZMOWY Z KOLEJNOŚCIĄ PISANIA DLA OBU OSÓB */}
        <div className="flex-1 p-5 rounded-3xl bg-stone-50 dark:bg-[#141518] border border-stone-200/80 dark:border-white/10 space-y-4 min-h-[380px] flex flex-col justify-end">
          {/* 1. ANIMACJA PISANIA PRZEZ EKSPERTA */}
          {expertTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                AW
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-[#1C1E23] border border-stone-200 dark:border-white/10 shadow-2xs flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">
                  dr Anna Wiśniewska pisze
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          {/* 2. WIADOMOŚĆ OD EKSPERTA PO ZAKOŃCZENIU PISANIA */}
          {expertMessageSent && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                AW
              </div>
              <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-[#1C1E23] border border-stone-200 dark:border-white/10 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  dr Anna Wiśniewska · Ekspert ds. Innowacji
                </span>
                <p className="text-sm sm:text-base text-stone-900 dark:text-white font-medium leading-relaxed">
                  Dzień dobry! Przeanalizowałam wniosek oraz wykres spadku zdrowia z RAG.{" "}
                  <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded">
                    ten pomysl jest warty uwagi
                  </strong>
                  .
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Decyzja komisji jest pozytywna. Przyznajemy grant 15 000 zł na budowę pierwszego
                  egzemplarza fotela termicznego. Kiedy Konrad może rozpocząć testy?
                </p>
                <span className="text-[10px] text-stone-400 block text-right font-mono">11:42</span>
              </div>
            </div>
          )}

          {/* 3. ANIMACJA PISANIA PRZEZ UŻYTKOWNIKA (DOPIERO GDY EKSPERT SKOŃCZYŁ) */}
          {userTyping && (
            <div className="flex justify-end items-center gap-3">
              <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-stone-200 dark:bg-white/10 border border-stone-300 dark:border-white/15 shadow-2xs flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Użytkownik pisze odpowiedź
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700 dark:bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700 dark:bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700 dark:bg-white animate-bounce" />
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-bold shrink-0">
                U
              </div>
            </div>
          )}

          {/* 4. ODPOWIEDŹ UŻYTKOWNIKA: "Wspaniała wiadomość!" */}
          {userMessageSent && (
            <div className="flex justify-end items-start gap-3">
              <div className="p-4 rounded-2xl rounded-tr-sm bg-stone-900 text-white max-w-[80%] shadow-xs space-y-1">
                <p className="text-sm sm:text-base font-bold leading-relaxed text-emerald-400">
                  {userReplyContent}
                </p>
                <span className="text-[10px] text-stone-400 block text-right font-mono">11:43</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                U
              </div>
            </div>
          )}
        </div>

        {/* DOLNY PASEK WPISYWANIA WIADOMOŚCI */}
        <div className="p-3 bg-white dark:bg-[#1C1E23] rounded-2xl border border-stone-200 dark:border-white/10 shadow-xs flex items-center gap-3">
          <div className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-800 dark:text-stone-200 text-xs sm:text-sm min-h-[40px] flex items-center">
            {inputLiveText ? (
              <span className="font-semibold text-stone-900 dark:text-white">
                {inputLiveText}
                <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
              </span>
            ) : (
              <span className="text-stone-400">Napisz wiadomość do eksperta...</span>
            )}
          </div>
          <button
            type="button"
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              userTyping || inputLiveText
                ? "bg-amber-500 text-white shadow-xs scale-105"
                : "bg-stone-900 dark:bg-white text-white dark:text-stone-950"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// KROK 6: EKRAN KOŃCOWY (OUTRO)
// =============================================================================
function ShowcaseOutroStep() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, #FAF4E5 0%, #FFFFFF 55%, #FAFAF8 80%, #F5F5F0 100%)",
      }}
    >
      <div className="space-y-6 max-w-xl mx-auto flex flex-col items-center">
        {/* LOGO MINNO JAK W NAVBAR */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-lg border border-black/5">
          <img
            src="/logo.svg"
            alt="Logo MiNNO"
            className="w-full h-full object-cover"
          />
        </div>

        {/* NAZWA MINNO IDENTYCZNA JAK W NAVBAR */}
        <div>
          <span
            className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:via-stone-200 dark:to-stone-400 bg-clip-text text-transparent tracking-tight"
            style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
          >
            MiNNO
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-sm sm:text-base font-semibold text-stone-700 dark:text-stone-300">
            Małopolskie Innowacje Społeczne
          </p>
        </div>
      </div>
    </div>
  );
}
