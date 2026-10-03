'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getResearchById,
  getAllResearches,
  ResearchInfo
} from '../../lib/researchData';
import { ResearchChoroplethMap } from '../../components/knowledge/ResearchChoroplethMap';
import { AllYearsMapGallery } from '../../components/knowledge/AllYearsMapGallery';
import { PowiatLineChart } from '../../components/knowledge/PowiatLineChart';
import { PowiatChartsGrid } from '../../components/knowledge/PowiatChartsGrid';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  Award,
  Sparkles,
  BarChart2,
  ChevronRight,
  Info
} from 'lucide-react';

export default function ResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const researchId = params?.id as string;

  const research = useMemo(() => {
    return getResearchById(researchId);
  }, [researchId]);

  const allResearches = useMemo(() => {
    return getAllResearches();
  }, []);

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
  }, [researchId]);

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
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Pasek nawigacyjny i powrót */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
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
          <span className="text-[11px] font-semibold text-stone-400 mr-1 hidden lg:inline">
            Inne badania:
          </span>
          {allResearches.map((r) => {
            const isCurrent = r.id === research.id;
            return (
              <button
                key={r.id}
                onClick={() => router.push(`/knowledge/${r.id}`)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isCurrent
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-stone-100 text-stone-800 border border-stone-200/70">
            {research.category}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 font-mono">
            Jednostka: {research.unit}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200/60">
            Lata: {research.summary.startYear} – {research.summary.endYear} ({research.years.length} lat)
          </span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
            {research.titlePl}
          </h1>
          <p className="text-sm font-semibold text-stone-400 mt-1 font-mono">
            {research.titleEn}
          </p>
          <p className="text-stone-600 text-sm sm:text-base mt-2.5 max-w-4xl leading-relaxed font-medium">
            {research.descriptionPl}
          </p>
        </div>

        {/* Kafelki z kluczowymi metrykami regionalnymi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Średnia {research.summary.startYear}
            </span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
              {research.summary.startAvg} {research.unit}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              Poziom bazowy
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Średnia {research.summary.endYear}
            </span>
            <span className="text-2xl font-black text-stone-900 font-mono mt-1 block">
              {research.summary.endAvg} {research.unit}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              Najnowszy odczyt
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Zmiana Regionalna
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {isPositiveDelta ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-rose-600" />
              )}
              <span
                className={`text-2xl font-black font-mono ${
                  isPositiveDelta ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {research.summary.deltaAvg > 0
                  ? `+${research.summary.deltaAvg}`
                  : research.summary.deltaAvg}{' '}
                {research.unit}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              Przez 11 lat obserwacji
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-500 block uppercase tracking-wider">
              Lider Województwa
            </span>
            <span className="text-lg font-black text-stone-900 truncate block mt-1">
              {research.summary.topCounty.name.replace('Powiat ', '')}
            </span>
            <span className="text-xs font-mono font-bold text-stone-600 block mt-0.5">
              {research.summary.topCounty.value} {research.unit} ({research.summary.endYear})
            </span>
          </div>
        </div>
      </div>

      {/* SEKCJA 1: Interaktywna Mapa Kartogramu z Osią Czasu */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-stone-700" />
            <span>1. Interaktywny Kartogram Małopolski (Oś Czasu)</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Przesuwaj lata lub kliknij &quot;Odtwórz w czasie&quot;
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

      {/* SEKCJA 2: Galeria Map dla Każdego Roku */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-stone-700" />
            <span>2. Zestawienie Map dla Każdego Roku ({research.years[0]} – {research.years[research.years.length - 1]})</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Bezpośrednie porównanie przestrzenne rok po roku
          </span>
        </div>

        <AllYearsMapGallery
          research={research}
          selectedYear={activeYear}
          onSelectYear={(y) => setSelectedYear(y)}
        />
      </section>

      {/* SEKCJA 3: Szczegółowy Wykres Liniowy Wybranego Powiatu vs Średnia */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-stone-700" />
            <span>3. Wykres Liniowy Wybranego Powiatu & Porównanie ze Średnią</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Kliknij powiat na mapie lub wybierz z listy
          </span>
        </div>

        <PowiatLineChart
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => setSelectedPowiatId(pid)}
        />
      </section>

      {/* SEKCJA 4: Wykres Liniowy dla Każdego z 22 Powiatów */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-stone-700" />
            <span>4. Wykresy Liniowe dla Wszystkich Powiatów (22 jednostki)</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            Wyszukuj, filtruj subregiony i sortuj trajektorie
          </span>
        </div>

        <PowiatChartsGrid
          research={research}
          selectedPowiatId={selectedPowiatId}
          onSelectPowiat={(pid) => {
            setSelectedPowiatId(pid);
            // Płynne przewinięcie do mapy lub głównego wykresu
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        />
      </section>
    </div>
  );
}
