'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllResearches, ResearchInfo } from '../lib/researchData';
import {
  Users,
  Briefcase,
  Banknote,
  Heart,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  BarChart3,
  CheckCircle2
} from 'lucide-react';

export default function KnowledgePage() {
  const router = useRouter();
  const researches = getAllResearches();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-6 h-6" />;
      case 'briefcase':
        return <Briefcase className="w-6 h-6" />;
      case 'banknote':
        return <Banknote className="w-6 h-6" />;
      case 'heart':
        return <Heart className="w-6 h-6" />;
      case 'activity':
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Nagłówek strony */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 text-xs font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Baza Danych & Kartografia Małopolski</span>
        </div>

        <div className="text-4xl sm:text-5xl font-black tracking-tight text-stone-900 leading-[1.05]">
          Katalog Badań Społecznych
        </div>

        <p className="text-stone-600 text-base sm:text-lg max-w-3xl font-medium leading-relaxed">
          Wybierz obszar badawczy, aby otworzyć interaktywną mapę kartogramu dla każdego roku (2014–2024) oraz szczegółowe wykresy zmian w czasie dla wszystkich 22 powiatów Małopolski.
        </p>
      </div>

      {/* Pasek statystyk zbiorczych */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Obszary Badań
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            {researches.length}
          </span>
          <span className="text-[11px] text-stone-400 block font-medium">
            Kluczowe diagnozy ROPS
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Zasięg Terytorialny
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            22
          </span>
          <span className="text-[11px] text-stone-400 block font-medium">
            Powiaty i miasta na prawach powiatu
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Horyzont Czasowy
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            11 Lat
          </span>
          <span className="text-[11px] text-stone-400 block font-medium">
            Szeregi czasowe 2014–2024
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Punkty Pomiarowe
          </span>
          <span className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
            1 200+
          </span>
          <span className="text-[11px] text-stone-400 block font-medium">
            Zweryfikowane dane statystyczne
          </span>
        </div>
      </div>

      {/* Grid typów badań */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-stone-700" />
            <span>Dostępne Typy Badań i Wskaźników</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Kliknij kartę, aby przejść do map i wykresów
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {researches.map((research) => {
            const isPositive = research.summary.deltaAvg >= 0;

            return (
              <div
                key={research.id}
                onClick={() => router.push(`/knowledge/${research.id}`)}
                className="group relative flex flex-col justify-between bg-white rounded-3xl p-6 border border-stone-200/90 shadow-xs hover:shadow-xl hover:border-stone-400 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Górny akcent kolorystyczny */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
                  style={{ backgroundColor: research.theme.accent }}
                />

                <div className="space-y-4">
                  {/* Nagłówek karty: Kategoria, Ikona, Jednostka */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: research.theme.accent }}
                    >
                      {getIcon(research.iconName)}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-stone-100 text-stone-700 border border-stone-200/60">
                        {research.category}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-stone-500">
                        Jednostka: {research.unit}
                      </span>
                    </div>
                  </div>

                  {/* Tytuł i opis */}
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug">
                      {research.titlePl}
                    </h3>
                    <p className="text-xs font-semibold text-stone-400 mt-0.5">
                      {research.titleEn}
                    </p>
                    <p className="text-xs text-stone-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {research.descriptionPl}
                    </p>
                  </div>

                  {/* Kluczowe wskaźniki podglądowe */}
                  <div className="bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Zakres lat:</span>
                      </span>
                      <span className="font-mono font-bold text-stone-800">
                        {research.summary.startYear} – {research.summary.endYear} ({research.years.length} lat)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Średnia Małopolski:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-extrabold text-stone-900 text-sm">
                          {research.summary.endAvg} {research.unit}
                        </span>
                        <span
                          className={`text-[11px] font-bold flex items-center ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {research.summary.deltaAvg}
                        </span>
                      </div>
                    </div>

                    {research.summary.topCounty.name && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                        <span className="text-stone-500 text-[11px] font-medium truncate max-w-[120px]">
                          Lider ({research.summary.endYear}):
                        </span>
                        <span className="font-medium text-stone-800 text-[11px] truncate max-w-[150px]">
                          {research.summary.topCounty.name.replace('Powiat ', '')} (
                          {research.summary.topCounty.value} {research.unit})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Przycisk przejścia do badania */}
                <div className="pt-5 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-900 group-hover:text-stone-950">
                  <span>Zobacz mapy roczne i wykresy</span>
                  <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center transition-all">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
