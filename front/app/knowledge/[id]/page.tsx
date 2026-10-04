'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useResearch,
  useResearches,
  formatResearchValue
} from '../../lib/researchData';
import { ResearchChoroplethMap } from '../../components/knowledge/ResearchChoroplethMap';
import { AllYearsMapGallery } from '../../components/knowledge/AllYearsMapGallery';
import { PowiatLineChart } from '../../components/knowledge/PowiatLineChart';
import { PowiatChartsGrid } from '../../components/knowledge/PowiatChartsGrid';
import { CustomSelect, SelectOption } from '../../components/shared/CustomSelect';
import {
  ArrowLeft,
  Calendar,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Award
} from 'lucide-react';

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const researchId = params?.id as string;

  const { research } = useResearch(researchId);
  const { researches: allResearches } = useResearches();

  // Stan wybranego roku na mapie
  const [selectedYear, setSelectedYear] = useState<string>('');
  // Stan wybranego powiatu (do mapy i wykresów)
  const [selectedPowiatId, setSelectedPowiatId] = useState<string | null>(null);

  // Inicjalizacja ostatniego roku
  useEffect(() => {
    if (research && research.years.length > 0 && !selectedYear) {
      setSelectedYear(research.years[research.years.length - 1]);
    }
  }, [research, selectedYear]);

  // Gdy id badania się zmieni, zresetuj rok na najnowszy
  useEffect(() => {
    if (research && research.years.length > 0) {
      setSelectedYear(research.years[research.years.length - 1]);
      setSelectedPowiatId(null);
    }
  }, [researchId, research]);

  // Znajdź indeks bieżącego badania oraz poprzednie / następne do płynnej nawigacji
  const currentIndex = useMemo(() => {
    if (!research || !allResearches.length) return -1;
    return allResearches.findIndex((r) => r.id === research.id);
  }, [research, allResearches]);

  const prevResearch = currentIndex > 0 ? allResearches[currentIndex - 1] : null;
  const nextResearch =
    currentIndex >= 0 && currentIndex < allResearches.length - 1
      ? allResearches[currentIndex + 1]
      : null;

  // Opcje do eleganckiego selectora badań
  const researchSelectOptions: SelectOption[] = useMemo(() => {
    return allResearches.map((r) => ({
      value: r.id,
      label: `${r.category}: ${r.titlePl}`
    }));
  }, [allResearches]);

  if (!research) {
    return (
      <div className="py-16 px-4 max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Nie znaleziono badania</h1>
        <p className="text-sm text-stone-600">
          Wybrany identyfikator badania &quot;{researchId}&quot; nie istnieje w bazie danych.
        </p>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do katalogu badań</span>
        </Link>
      </div>
    );
  }

  const activeYear = selectedYear || research.years[research.years.length - 1];
  const isPositiveDelta = research.summary.deltaAvg >= 0;

  // Procentowa zmiana średniej
  const percentChange =
    research.summary.startAvg && research.summary.startAvg !== 0
      ? (((research.summary.endAvg - research.summary.startAvg) / research.summary.startAvg) * 100).toFixed(1)
      : null;

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Pasek nawigacyjny i przełącznik badania */}
      <nav
        aria-label="Nawigacja badania"
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-stone-200/80"
      >
        {/* Lewa strona: Powrót do katalogu oraz ścieżka okruszków */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 hover:bg-stone-50 hover:border-stone-300 text-stone-700 hover:text-stone-950 font-semibold transition-all shadow-2xs group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-stone-500 group-hover:text-stone-900" />
            <span>Katalog Badań</span>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" aria-hidden="true" />

          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
            {research.category}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" aria-hidden="true" />

          <span className="text-stone-900 font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
            {research.titlePl}
          </span>
        </div>

        {/* Prawa strona: Przełącznik poprzednie/następne i rozwijane menu */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              disabled={!prevResearch}
              onClick={() => prevResearch && router.push(`/knowledge/${prevResearch.id}`)}
              className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={prevResearch ? `Poprzednie badanie: ${prevResearch.titlePl}` : 'Brak poprzedniego badania'}
              aria-label="Poprzednie badanie"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-stone-200" aria-hidden="true" />
            <button
              type="button"
              disabled={!nextResearch}
              onClick={() => nextResearch && router.push(`/knowledge/${nextResearch.id}`)}
              className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title={nextResearch ? `Następne badanie: ${nextResearch.titlePl}` : 'Brak następnego badania'}
              aria-label="Następne badanie"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-64 sm:w-80 md:w-96">
            <CustomSelect
              value={research.id}
              onChange={(val) => router.push(`/knowledge/${val}`)}
              options={researchSelectOptions}
              placeholder="Zmień badanie..."
              size="sm"
            />
          </div>
        </div>
      </nav>

      {/* Nagłówek Badania */}
      <header className="space-y-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Kategoria z barwnym wskaźnikiem motywu */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white border border-stone-200/80 text-stone-800 shadow-2xs">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-2xs"
              style={{ backgroundColor: research.theme.accent }}
              aria-hidden="true"
            />
            {research.category}
          </span>

          {/* Przedział lat */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200/60">
            <Calendar className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
            <span>Lata {research.summary.startYear} – {research.summary.endYear} ({research.years.length} lat)</span>
          </span>

          {/* Jednostka pomiaru */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200/60">
            <span className="text-stone-500">Jednostka:</span>
            <strong className="font-bold text-stone-900">{research.unit}</strong>
          </span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
            {research.titlePl}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2.5 max-w-3xl leading-relaxed font-normal">
            {research.descriptionPl}
          </p>
        </div>

        {/* Kafelki z kluczowymi metrykami regionalnymi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {/* Karta 1: Średnia bazowa */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Średnia {research.summary.startYear}
              </span>
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
                {formatResearchValue(research.summary.startAvg)}
              </div>
              <div className="text-xs font-medium text-stone-500 mt-2 truncate" title={research.unit}>
                {research.unit}
              </div>
            </div>
          </div>

          {/* Karta 2: Średnia aktualna */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Średnia {research.summary.endYear}
              </span>
              <Activity className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
                {formatResearchValue(research.summary.endAvg)}
              </div>
              <div className="text-xs font-medium text-stone-500 mt-2 truncate" title={research.unit}>
                {research.unit}
              </div>
            </div>
          </div>

          {/* Karta 3: Zmiana trendu */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Zmiana ({research.years.length} lat)
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isPositiveDelta
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                }`}
              >
                {isPositiveDelta ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {percentChange ? `${research.summary.deltaAvg > 0 ? '+' : ''}${percentChange}%` : ''}
              </span>
            </div>
            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${
                  isPositiveDelta ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {research.summary.deltaAvg > 0 ? `+${formatResearchValue(research.summary.deltaAvg)}` : formatResearchValue(research.summary.deltaAvg)}
              </div>
              <div className="text-xs font-medium text-stone-500 mt-2 truncate" title={research.unit}>
                {research.unit}
              </div>
            </div>
          </div>

          {/* Karta 4: Lider regionalny */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500">
              <span
                className="text-[11px] font-bold uppercase tracking-wider text-stone-500 truncate"
                title={`Lider (${research.summary.endYear}): ${research.summary.topCounty.name}`}
              >
                Lider ({research.summary.endYear})
              </span>
              <Award className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
                {formatResearchValue(research.summary.topCounty.value)}
              </div>
              <div
                className="text-xs font-bold text-stone-800 mt-2 truncate"
                title={research.summary.topCounty.name}
              >
                {research.summary.topCounty.name.replace(/^powiat\s+/i, 'Powiat ')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Szybka nawigacja po sekcjach */}
      <nav
        aria-label="Nawigacja po sekcjach raportu"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200/70 pt-1 scrollbar-none"
      >
        <a
          href="#kartogram"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
          <span>Kartogram z osią czasu</span>
        </a>
        <a
          href="#zestawienie"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
          <span>Zestawienie roczne</span>
        </a>
        <a
          href="#trend"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
          <span>Analiza trendu</span>
        </a>
        <a
          href="#porownanie"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
          <span>Porównanie powiatów</span>
        </a>
      </nav>

      {/* SEKCJA 1: Interaktywny Kartogram z Osią Czasu */}
      <section id="kartogram" className="space-y-3 pt-2 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-stone-700" aria-hidden="true" />
            <span>Kartogram z osią czasu</span>
          </h2>
          <span className="text-xs text-stone-500">
            Animacja zmian wskaźnika w latach {research.summary.startYear} – {research.summary.endYear}
          </span>
        </div>

        <ResearchChoroplethMap
          research={research}
          selectedYear={activeYear}
          onSelectYear={(y) => setSelectedYear(y)}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => setSelectedPowiatId(pid)}
        />
      </section>

      {/* SEKCJA 2: Zestawienie Map dla Każdego Roku */}
      <section id="zestawienie" className="space-y-3 pt-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stone-700" aria-hidden="true" />
            <span>Zestawienie roczne ({research.years[0]} – {research.years[research.years.length - 1]})</span>
          </h2>
          <span className="text-xs text-stone-500">
            Kliknij rok, aby zsynchronizować kartogram główny
          </span>
        </div>

        <AllYearsMapGallery
          research={research}
          selectedYear={activeYear}
          onSelectYear={(y) => setSelectedYear(y)}
        />
      </section>

      {/* SEKCJA 3: Wykres Liniowy Wybranego Powiatu vs Średnia */}
      <section id="trend" className="space-y-3 pt-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-stone-700" aria-hidden="true" />
            <span>Analiza trendu w czasie</span>
          </h2>
          <span className="text-xs text-stone-500">
            Dynamika powiatu w zestawieniu ze średnią Małopolski
          </span>
        </div>

        <PowiatLineChart
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => setSelectedPowiatId(pid)}
        />
      </section>

      {/* SEKCJA 4: Wykresy Liniowe dla Wszystkich Powiatów */}
      <section id="porownanie" className="space-y-3 pt-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-stone-700" aria-hidden="true" />
            <span>Porównanie powiatów</span>
          </h2>
          <span className="text-xs text-stone-500">
            Wykresy i ranking dla wszystkich 22 powiatów Małopolski
          </span>
        </div>

        <PowiatChartsGrid
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => {
            setSelectedPowiatId(pid);
            const el = document.getElementById('trend');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      </section>
    </div>
  );
}
