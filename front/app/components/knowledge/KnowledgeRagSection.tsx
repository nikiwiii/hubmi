"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  Sparkles,
  Search,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  BarChart3,
  Layers,
  ExternalLink,
  CheckCircle2,
  Building2,
  X,
  Lightbulb,
  FileText,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Info
} from "lucide-react";
import { searchKnowledgeRag } from "../../lib/api";
import { executeClientKnowledgeRag } from "../../lib/knowledgeRagFallback";
import { KnowledgeRagResponse, KnowledgeRagMatchedReport } from "../../lib/types";

interface KnowledgeRagSectionProps {
  initialQuery?: string;
  onClearSearch?: () => void;
}

const SAMPLE_QUERIES = [
  "Osoby na wózkach w powiecie krakowskim",
  "Seniorzy i opieka w Nowym Sączu",
  "Długotrwałe bezrobocie w powiecie tarnowskim",
  "Dostępność szpitali i zdrowie w Zakopanem",
  "Piecza zastępcza w Oświęcimiu",
];

const POWIATY_DROPDOWN = [
  { id: "krakowski", label: "Powiat Krakowski" },
  { id: "krakow", label: "Kraków (miasto)" },
  { id: "bochenski", label: "Powiat Bocheński" },
  { id: "brzeski", label: "Powiat Brzeski" },
  { id: "chrzanowski", label: "Powiat Chrzanowski" },
  { id: "dabrowski", label: "Powiat Dąbrowski" },
  { id: "gorlicki", label: "Powiat Gorlicki" },
  { id: "limanowski", label: "Powiat Limanowski" },
  { id: "miechowski", label: "Powiat Miechowski" },
  { id: "myslenicki", label: "Powiat Myślenicki" },
  { id: "nowosadecki", label: "Powiat Nowosądecki" },
  { id: "nowy-sacz", label: "Nowy Sącz (miasto)" },
  { id: "nowotarski", label: "Powiat Nowotarski" },
  { id: "olkuski", label: "Powiat Olkuski" },
  { id: "oswiecimski", label: "Powiat Oświęcimski" },
  { id: "proszowicki", label: "Powiat Proszowicki" },
  { id: "suski", label: "Powiat Suski" },
  { id: "tarnowski", label: "Powiat Tarnowski" },
  { id: "tarnow", label: "Tarnów (miasto)" },
  { id: "tatrzanski", label: "Powiat Tatrzański" },
  { id: "wadowicki", label: "Powiat Wadowicki" },
  { id: "wielicki", label: "Powiat Wielicki" },
];

export const KnowledgeRagSection: React.FC<KnowledgeRagSectionProps> = ({
  initialQuery = "",
  onClearSearch,
}) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [selectedPowiatId, setSelectedPowiatId] = useState<string>("krakowski");
  const [isLoading, setIsLoading] = useState(false);
  const [ragResult, setRagResult] = useState<KnowledgeRagResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "charts" | "reports" | "innovations">("analysis");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = async (queryText?: string, explicitPowiatId?: string) => {
    const q = (queryText !== undefined ? queryText : query).trim();
    if (!q) return;

    if (queryText) setQuery(queryText);
    setIsLoading(true);
    setError(null);

    // Gdy explicitPowiatId nie jest przekazany, backend sam wykrywa powiat z zapytania
    const targetPowiat = explicitPowiatId || undefined;

    try {
      // 1. Próba wykonania przez API backendu
      const res = await searchKnowledgeRag(q, targetPowiat);
      setRagResult(res);
      if (res.detected_powiat?.id) {
        setSelectedPowiatId(res.detected_powiat.id);
      }
    } catch (err: any) {
      // 2. Automatyczny resilient fallback po stronie klienta (100% niezawodność)
      console.warn("Backend RAG fallback to local client engine:", err);
      try {
        const fallbackRes = executeClientKnowledgeRag(q, targetPowiat);
        setRagResult(fallbackRes);
        if (fallbackRes.detected_powiat?.id) {
          setSelectedPowiatId(fallbackRes.detected_powiat.id);
        }
      } catch {
        setError("Wystąpił błąd podczas analizy zapytania. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Automatyczne uruchomienie RAG przy wejściu z parametrem lub domyślnym zapytaniem
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handlePowiatChange = (newPowiatId: string) => {
    setSelectedPowiatId(newPowiatId);
    if (query.trim()) {
      handleSearch(query, newPowiatId);
    }
  };

  const handleReset = () => {
    setQuery("");
    setRagResult(null);
    setError(null);
    if (onClearSearch) onClearSearch();
  };

  const primaryReport = ragResult?.primary_report;
  const isPositiveDelta = (primaryReport?.delta || 0) >= 0;

  return (
    <div className="rounded-3xl border border-stone-200/90 dark:border-white/10 shadow-xs overflow-hidden transition-all duration-300 bg-[radial-gradient(circle_at_14%_14%,#FAF4E5_0%,#FFFFFF_48%,#FAFAF8_80%,#F5F5F0_100%)] dark:bg-[radial-gradient(circle_at_14%_14%,#2A2720_0%,#1C1E23_48%,#191B1F_80%,#141518_100%)]">
      {/* NAGŁÓWEK WYSZUKIWARKI RAG */}
      <div className="p-6 sm:p-8 border-b border-stone-200/60 dark:border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 flex items-center justify-center shadow-2xs font-bold shrink-0">
              <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                  Wyszukiwarka Analityczna RAG
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium mt-1">
                Zadaj pytanie naturalnym językiem – wyszukaj dane, wykresy i raporty dla dowolnego powiatu Małopolski.
              </p>
            </div>
          </div>

          {ragResult && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/20 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wyczyść analizę</span>
            </button>
          )}
        </div>

        {/* INPUT WYSZUKIWARKI */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="relative flex items-center bg-white dark:bg-[#141518] rounded-2xl border-2 border-stone-200 dark:border-white/15 focus-within:border-stone-900 dark:focus-within:border-white focus-within:ring-4 focus-within:ring-stone-900/5 dark:focus-within:ring-white/5 shadow-2xs transition-all">
            <Search className="absolute left-4.5 w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="np. szukam czegoś o osobach na wózkach w powiecie krakowskim..."
              className="w-full pl-12 pr-32 py-4 text-sm sm:text-base font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 bg-transparent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1.5 mr-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="mr-2 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-stone-100 dark:text-stone-950 disabled:opacity-40 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-stone-900/30 border-t-white dark:border-t-stone-900 rounded-full animate-spin" />
                  <span>Analizuję...</span>
                </>
              ) : (
                <>
                  <span>Generuj raport</span>
                </>
              )}
            </button>
          </div>

          {/* SZYBKIE PRZYKŁADY ZAPYTAŃ */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-stone-400 font-semibold text-[11px] uppercase tracking-wider">
              Przykłady pytań:
            </span>
            {SAMPLE_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(sq)}
                className="px-3 py-1 bg-stone-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-200 border border-transparent rounded-lg text-stone-700 text-xs font-medium transition-all cursor-pointer text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium">
          <Info className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STAN ŁADOWANIA */}
      {isLoading && (
        <div className="p-10 space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-400 animate-ping" />
            <div className="h-5 bg-stone-200 rounded-lg w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-stone-100 rounded-2xl"></div>
            <div className="h-24 bg-stone-100 rounded-2xl"></div>
            <div className="h-24 bg-stone-100 rounded-2xl"></div>
            <div className="h-24 bg-stone-100 rounded-2xl"></div>
          </div>
          <div className="h-64 bg-stone-100 rounded-2xl"></div>
        </div>
      )}

      {/* WYNIKI RAG */}
      {ragResult && !isLoading && (
        <>
          {ragResult.guardrail_status && ragResult.guardrail_status !== "PASSED" ? (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
              <div className="p-6 sm:p-7 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 space-y-5 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-200/90 text-amber-950 shrink-0 mt-0.5">
                    <ShieldAlert className="w-6 h-6 text-amber-900" aria-hidden="true" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900">
                        {ragResult.guardrail_status === "BLOCKED_GIBBERISH"
                          ? "Wpisz konkretne pytanie lub problem społeczny"
                          : "Pytanie spoza zakresu Bazy Wiedzy i Raportów ROPS"}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wide">
                        Filtr merytoryczny
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                      {ragResult.guardrail_message || ragResult.ai_synthesis}
                    </p>
                  </div>
                </div>

                {/* SUGEROWANE SENSOWNE PYTANIA */}
                <div className="pt-4 border-t border-amber-200/80 space-y-3">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    Przykładowe pytania, które możesz zadać w bazie analitycznej:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(ragResult.suggested_queries && ragResult.suggested_queries.length > 0
                      ? ragResult.suggested_queries
                      : SAMPLE_QUERIES
                    ).map((suggested, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          setQuery(suggested);
                          handleSearch(suggested);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-stone-900 border border-amber-300/80 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-stone-900"
                      >
                        <span>{suggested}</span>
                        <ArrowRight className="w-3 h-3 text-amber-800" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
              {/* PASEK ZIDENTYFIKOWANEGO OBSZARU I TEMATÓW */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/80">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 shadow-2xs">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-stone-500">Wykryty obszar:</span>
                    <span className="text-xs font-bold text-stone-900">
                      {ragResult.detected_powiat.display_name}
                    </span>
                  </div>

                  {ragResult.detected_topics.map((top, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-200/60 text-stone-800"
                    >
                      {top}
                    </span>
                  ))}
                </div>

                {/* SELEKTOR POWIATU DO PORÓWNANIA */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">
                    Zmień analizowany powiat:
                  </span>
                  <select
                    value={selectedPowiatId}
                    onChange={(e) => handlePowiatChange(e.target.value)}
                    className="text-xs font-bold text-stone-900 bg-white border border-stone-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-stone-900/10 cursor-pointer shadow-2xs"
                  >
                    {POWIATY_DROPDOWN.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KAFELKI Z KLUCZOWYMI METRYKAMI DLA WYKRYTEGO POWIATU */}
              {primaryReport && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Wartość w {ragResult.detected_powiat.display_name}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                        {primaryReport.latest_value}
                      </span>
                      <span className="text-sm font-bold text-stone-500">{primaryReport.unit}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 block">
                      Najnowsze dane ({primaryReport.latest_year})
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Średnia dla Małopolski
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                        {primaryReport.region_avg}
                      </span>
                      <span className="text-sm font-bold text-stone-500">{primaryReport.unit}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 block">
                      Dla całego regionu (22 powiaty)
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Zmiana w czasie (Trend)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl sm:text-3xl font-extrabold ${isPositiveDelta ? "text-emerald-700" : "text-rose-700"
                          }`}
                      >
                        {isPositiveDelta ? "+" : ""}
                        {primaryReport.delta}
                      </span>
                      <span className="text-sm font-bold text-stone-500">{primaryReport.unit}</span>
                    </div>
                    <span className="text-[11px] text-stone-400 block">
                      Od {primaryReport.time_series[0]?.year || "początku pomiarów"}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Pozycja w regionie
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                        {primaryReport.rank}.
                      </span>
                      <span className="text-sm font-bold text-stone-500">
                        / {primaryReport.total_powiats}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 block">
                      Wśród wszystkich powiatów
                    </span>
                  </div>
                </div>
              )}

              {/* GŁÓWNA SEKCJA ZAKŁADEK: SYNTEZA AI vs WYKRESY */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "analysis"
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/5"
                      }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Synteza Analityczna AI</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("charts")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "charts"
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/5"
                      }`}
                  >
                    <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Wykresy i Szeregi Czasowe</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "reports"
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/5"
                      }`}
                  >
                    <FileText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Raporty i Kartogramy ({ragResult.matched_reports.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("innovations")}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === "innovations"
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-white/5"
                      }`}
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span>Innowacje ROPS ({ragResult.matched_innovations.length})</span>
                  </button>
                </div>

                {/* TAB 1: SYNTEZA ANALITYCZNA AI */}
                {activeTab === "analysis" && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#FAF9F5] border border-stone-200/90 shadow-2xs space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span>Wnioski i Interpretacja Danych dla: {ragResult.detected_powiat.display_name}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Źródło: ROPS Kraków & GUS
                      </span>
                    </div>

                    <div className="prose prose-stone prose-sm max-w-none text-stone-800 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }) => <h3 className="text-base font-bold text-stone-900 mt-4 mb-2" {...props} />,
                          h2: ({ ...props }) => <h3 className="text-base font-bold text-stone-900 mt-4 mb-2" {...props} />,
                          h3: ({ ...props }) => <h4 className="text-sm font-bold text-stone-900 mt-3 mb-1.5" {...props} />,
                          p: ({ ...props }) => <p className="mb-2.5 leading-relaxed text-stone-800" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-stone-800" {...props} />,
                          li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
                          strong: ({ ...props }) => <strong className="font-semibold text-stone-950" {...props} />,
                        }}
                      >
                        {ragResult.ai_synthesis}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* TAB 2: INTERAKTYWNE WYKRESY */}
                {activeTab === "charts" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* WYKRES 1: LINIOWY SZEREG CZASOWY */}
                    {ragResult.chart_data.trend_series && ragResult.chart_data.trend_series.length > 0 && (
                      <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="text-base font-bold text-stone-900">
                              {ragResult.chart_data.report_title} – Trend wieloletni
                            </h4>
                            <p className="text-xs text-stone-500">
                              Porównanie wartości w {ragResult.detected_powiat.display_name} ze średnią regionalną Małopolski
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-stone-900">
                              <span className="w-3 h-3 rounded-full bg-stone-900" />
                              <span>{ragResult.detected_powiat.display_name}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-stone-400">
                              <span className="w-3 h-3 rounded-full bg-amber-500" />
                              <span>Średnia Małopolski</span>
                            </span>
                          </div>
                        </div>

                        <div className="h-72 w-full pt-2">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={ragResult.chart_data.trend_series}
                                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece1" vertical={false} />
                                <XAxis
                                  dataKey="year"
                                  tick={{ fill: "#78716c", fontSize: 12 }}
                                  tickLine={false}
                                  axisLine={{ stroke: "#e7e5e4" }}
                                />
                                <YAxis
                                  tick={{ fill: "#78716c", fontSize: 12 }}
                                  tickLine={false}
                                  axisLine={false}
                                  unit={` ${ragResult.chart_data.unit}`}
                                />
                                <Tooltip
                                  formatter={(value: any, name: any) => [
                                    `${value} ${ragResult.chart_data.unit}`,
                                    name === "powiatValue"
                                      ? ragResult.detected_powiat.display_name
                                      : "Średnia Małopolski",
                                  ]}
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e7e5e4",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    fontSize: "12px",
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="powiatValue"
                                  name="powiatValue"
                                  stroke="#1c1917"
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: "#1c1917", strokeWidth: 2, stroke: "#fff" }}
                                  activeDot={{ r: 6 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="regionAvg"
                                  name="regionAvg"
                                  stroke="#f59e0b"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  dot={{ r: 3, fill: "#f59e0b" }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    )}

                    {/* WYKRES 2: SŁUPKOWY PORÓWNAWCZY (POWIAT vs REGION) */}
                    {ragResult.chart_data.comparison_bars && ragResult.chart_data.comparison_bars.length > 0 && (
                      <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-4">
                        <div className="border-b border-stone-100 pb-3">
                          <h4 className="text-base font-bold text-stone-900">
                            Porównanie powiatów w {ragResult.chart_data.latest_year} r.
                          </h4>
                          <p className="text-xs text-stone-500">
                            Pozycja {ragResult.detected_powiat.display_name} na tle wybranych powiatów regionu ({ragResult.chart_data.unit})
                          </p>
                        </div>

                        <div className="h-64 w-full pt-2">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={ragResult.chart_data.comparison_bars}
                                margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0ece1" vertical={false} />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fill: "#78716c", fontSize: 11 }}
                                  tickLine={false}
                                  axisLine={{ stroke: "#e7e5e4" }}
                                  angle={-20}
                                  textAnchor="end"
                                />
                                <YAxis
                                  tick={{ fill: "#78716c", fontSize: 12 }}
                                  tickLine={false}
                                  axisLine={false}
                                  unit={` ${ragResult.chart_data.unit}`}
                                />
                                <Tooltip
                                  formatter={(value: any) => [`${value} ${ragResult.chart_data.unit}`, "Wartość wskaźnika"]}
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "12px",
                                    border: "1px solid #e7e5e4",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                    fontSize: "12px",
                                  }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                  {ragResult.chart_data.comparison_bars.map((entry, index) => {
                                    const isCurrent = entry.powiatId === ragResult.detected_powiat.id;
                                    return (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={isCurrent ? "#1c1917" : "#d6d3d1"}
                                      />
                                    );
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: DOPASOWANE RAPORTY I DIAGNOZY */}
                {activeTab === "reports" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ragResult.matched_reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-stone-900 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                                {report.category}
                              </span>
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                {report.rank}. miejsce w regionie
                              </span>
                            </div>

                            <h5 className="text-base font-bold text-stone-900 leading-snug">
                              {report.title}
                            </h5>

                            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                              {report.description}
                            </p>

                            <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-stone-500 font-medium">
                                  W {ragResult.detected_powiat.display_name}:
                                </span>
                                <span className="font-bold text-stone-900">
                                  {report.latest_value} {report.unit}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-stone-400">
                                <span>Średnia Małopolski:</span>
                                <span>{report.region_avg} {report.unit}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => router.push(`/knowledge/${report.id}`)}
                            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Otwórz kartogram i mapę 22 powiatów</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: GOTOWE INNOWACJE SPOŁECZNE ROPS */}
                {activeTab === "innovations" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ragResult.matched_innovations.map((inn) => (
                        <div
                          key={inn.id}
                          className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-amber-400 transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                Innowacja ROPS Kraków
                              </span>
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Dopasowano
                              </span>
                            </div>

                            <h5 className="text-base font-bold text-stone-900 leading-snug">
                              {inn.title}
                            </h5>

                            <p className="text-xs text-stone-600 leading-relaxed">
                              {inn.description}
                            </p>

                            {inn.funding_info && (
                              <div className="pt-2 text-[11px] text-stone-500 font-medium">
                                <strong className="text-stone-700">Dofinansowanie:</strong> {inn.funding_info}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                            <button
                              onClick={() => router.push(`/propose?problem=${encodeURIComponent(query)}`)}
                              className="text-xs font-semibold text-stone-700 hover:text-stone-950 underline cursor-pointer"
                            >
                              Zgłoś podobny projekt
                            </button>

                            {inn.url ? (
                              <a
                                href={inn.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <span>Zobacz źródło</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => router.push("/middleman")}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <span>Katalog innowacji</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

