'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useResearch,
  useResearches
} from '../../lib/researchData';
import { ResearchChoroplethMap } from '../../components/knowledge/ResearchChoroplethMap';
import { AllYearsMapGallery } from '../../components/knowledge/AllYearsMapGallery';
import { PowiatLineChart } from '../../components/knowledge/PowiatLineChart';
import { PowiatChartsGrid } from '../../components/knowledge/PowiatChartsGrid';
import {
  ArrowLeft,
  Calendar,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ChevronRight
} from 'lucide-react';

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const researchId = params?.id as string;

  const { research, isLoading } = useResearch(researchId);
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

  if (!research) {
    return (
      <div className="py-16 px-4 max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Nie znaleziono badania</h1>
        <p className="text-sm text-stone-500">
          Wybrany identyfikator badania &quot;{researchId}&quot; nie istnieje w bazie.
        </p>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do katalogu badań</span>
        </Link>
      </div>
    );
  }

  const activeYear = selectedYear || research.years[research.years.length - 1];
  const isPositiveDelta = research.summary.deltaAvg >= 0;

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Pasek nawigacyjny i powrót */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 pb-4">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Link
            href="/knowledge"
            className="flex items-center gap-1.5 text-stone-700 hover:text-stone-950 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Katalog Badań</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-stone-900 font-bold truncate max-w-[280px] sm:max-w-none">
            {research.titlePl}
          </span>
        </div>

        {/* Szybkie przełączniki badań */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-stone-400 mr-1 hidden lg:inline">
            Inne badania:
          </span>
          {allResearches.map((r) => {
            const isCurrent = r.id === research.id;
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/knowledge/${r.id}`)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${isCurrent
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200/80'
                  }`}
                title={r.titlePl}
              >
                {r.titlePl.split(' ')[0]}...
              </button>
            );
          })}
        </div>
      </div>

      {/* Nagłówek Badania */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {research.category}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {research.summary.startYear} – {research.summary.endYear}
          </span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            {research.titlePl}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-4xl leading-relaxed font-medium">
            {research.descriptionPl}
          </p>
        </div>

        {/* Kafelki z kluczowymi metrykami regionalnymi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider truncate">
              Średnia {research.summary.startYear}
            </span>
            <div className="h-8 flex items-center mt-1.5">
              <span className="text-2xl font-bold text-stone-900">
                {research.summary.startAvg} {research.unit}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider truncate">
              Średnia {research.summary.endYear}
            </span>
            <div className="h-8 flex items-center mt-1.5">
              <span className="text-2xl font-bold text-stone-900">
                {research.summary.endAvg} {research.unit}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider truncate">
              Zmiana (11 lat)
            </span>
            <div className="h-8 flex items-center gap-1.5 mt-1.5">
              {isPositiveDelta ? (
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span
                className={`text-2xl font-bold ${isPositiveDelta ? 'text-emerald-700' : 'text-rose-700'
                  }`}
              >
                {research.summary.deltaAvg > 0
                  ? `+${research.summary.deltaAvg}`
                  : research.summary.deltaAvg}{' '}
                {research.unit}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-2xs flex flex-col justify-between">
            <span
              className="text-xs font-semibold text-stone-400 block uppercase tracking-wider truncate"
              title={`Lider (${research.summary.endYear}): ${research.summary.topCounty.name}`}
            >
              Lider: {research.summary.topCounty.name.replace('Powiat ', '')}
            </span>
            <div className="h-8 flex items-center mt-1.5">
              <span className="text-2xl font-bold text-stone-900">
                {research.summary.topCounty.value} {research.unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEKCJA 1: Interaktywny Kartogram z Osią Czasu */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-stone-700" />
          <span>Kartogram z osią czasu</span>
        </h2>

        <ResearchChoroplethMap
          research={research}
          selectedYear={activeYear}
          onSelectYear={(y) => setSelectedYear(y)}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => setSelectedPowiatId(pid)}
        />
      </section>

      {/* SEKCJA 2: Zestawienie Map dla Każdego Roku */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-stone-700" />
          <span>Zestawienie roczne ({research.years[0]} – {research.years[research.years.length - 1]})</span>
        </h2>

        <AllYearsMapGallery
          research={research}
          selectedYear={activeYear}
          onSelectYear={(y) => setSelectedYear(y)}
        />
      </section>

      {/* SEKCJA 3: Wykres Liniowy Wybranego Powiatu vs Średnia */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-stone-700" />
          <span>Analiza trendu w czasie</span>
        </h2>

        <PowiatLineChart
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => setSelectedPowiatId(pid)}
        />
      </section>

      {/* SEKCJA 4: Wykresy Liniowe dla Wszystkich Powiatów */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-stone-700" />
          <span>Porównanie powiatów</span>
        </h2>

        <PowiatChartsGrid
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => {
            setSelectedPowiatId(pid);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        />
      </section>
    </div>
  );
}
