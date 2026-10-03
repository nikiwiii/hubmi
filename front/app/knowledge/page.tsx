'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAllResearches } from '../lib/researchData';
import {
  Users,
  Briefcase,
  Banknote,
  Heart,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function KnowledgePage() {
  const router = useRouter();
  const researches = getAllResearches();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'banknote':
        return <Banknote className="w-5 h-5" />;
      case 'heart':
        return <Heart className="w-5 h-5" />;
      case 'activity':
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek spójny z resztą aplikacji Hubmi */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Katalog Badań</span>
            <span className="block text-stone-300">Społecznych</span>
          </div>
          <p className="mt-2 text-stone-500 text-sm font-medium">
            Diagnozy ROPS Kraków – kartogramy i szeregi czasowe 2014–2024 dla 22 powiatów.
          </p>
        </div>
      </div>

      {/* Zwięzły pasek podsumowania */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs">
          <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
            Obszary badań
          </span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            {researches.length} diagnoz
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs">
          <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
            Zasięg
          </span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            22 powiaty
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs">
          <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
            Okres analizy
          </span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">
            2014 – 2024
          </span>
        </div>
      </div>

      {/* Siatka kart badań w estetyce Hubmi – 2 kolumny z radialnym gradientem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {researches.map((research) => {
          const isPositive = research.summary.deltaAvg >= 0;

          return (
            <div
              key={research.id}
              onClick={() => router.push(`/knowledge/${research.id}`)}
              className="group relative flex flex-col justify-between rounded-[28px] p-6 sm:p-7 border border-black/5 shadow-2xs hover:shadow-lg hover:border-black/10 transition-all duration-300 cursor-pointer min-h-[300px] overflow-hidden"
              style={{
                background: `radial-gradient(circle at 14% 14%, ${research.theme.pastelBg} 0%, #ffffff 50%, #fafaf9 76%, #f5f5f4 100%)`
              }}
            >
              <div className="space-y-4">
                {/* Górny wiersz: Ikona, kategoria i jednostka */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ring-4 ring-white/95"
                      style={{ backgroundColor: research.theme.accent }}
                    >
                      {getIcon(research.iconName)}
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors shadow-2xs"
                      style={{
                        backgroundColor: research.theme.pastelBg,
                        borderColor: research.theme.border,
                        color: research.theme.text
                      }}
                    >
                      {research.category}
                    </span>
                  </div>
                </div>

                {/* Tytuł i zwięzły opis (wyłącznie po polsku) */}
                <div>
                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug">
                    {research.titlePl}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                    {research.descriptionPl}
                  </p>
                </div>

                {/* Kluczowe dane w boksie ze szklistym tłem */}
                <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-stone-200/60 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">Średnia Małopolski:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900 text-sm">
                        {research.summary.endAvg} {research.unit}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                      >
                        {isPositive ? '+' : ''}{research.summary.deltaAvg}
                      </span>
                    </div>
                  </div>

                  {research.summary.topCounty.name && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-200/50">
                      <span className="text-stone-500 font-medium">
                        Lider ({research.summary.endYear}):
                      </span>
                      <span className="font-semibold text-stone-800 truncate max-w-[170px]">
                        {research.summary.topCounty.name.replace('Powiat ', '')} ({research.summary.topCounty.value} {research.unit})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dolny pasek z przejściem dopasowany kolorystycznie */}
              <div className="pt-4 mt-3 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-stone-700 group-hover:text-stone-950 transition-colors">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-125 shadow-2xs"
                    style={{ backgroundColor: research.theme.accent }}
                  />
                  <span>Przeglądaj mapy i wykresy</span>
                </span>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:translate-x-1 group-hover:shadow-2xs border"
                  style={{
                    backgroundColor: research.theme.pastelBg,
                    borderColor: research.theme.border,
                    color: research.theme.text
                  }}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
