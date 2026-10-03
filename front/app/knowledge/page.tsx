"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useResearches } from "../lib/researchData";
import {
  Users,
  Briefcase,
  Banknote,
  Heart,
  Activity,
  ArrowRight,
  Search,
  X,
} from "lucide-react";

export default function KnowledgePage() {
  const router = useRouter();
  const { researches, isLoading } = useResearches();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResearches = researches.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.titlePl.toLowerCase().includes(q) ||
      r.descriptionPl.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "users":
        return <Users className="w-5 h-5" />;
      case "briefcase":
        return <Briefcase className="w-5 h-5" />;
      case "banknote":
        return <Banknote className="w-5 h-5" />;
      case "heart":
        return <Heart className="w-5 h-5" />;
      case "activity":
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek strony */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Katalog Badań</span>
            <span className="block text-stone-300">Społecznych</span>
          </div>
          <p className="mt-2.5 text-stone-500 text-xs sm:text-sm font-medium max-w-xl">
            Diagnozy ROPS Kraków – interaktywne kartogramy i szeregi czasowe 2014–2024 dla 22 powiatów.
          </p>
        </div>
      </div>

      {/* Input wyszukiwania wektorowego (stylizowany spójnie z resztą aplikacji) */}
      <div className="bg-white rounded-2xl border border-black/10 px-4 focus-within:ring-2 focus-within:ring-stone-900/10 shadow-2xs">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Wyszukaj w raportach i diagnozach społecznych (np. seniorzy, rynek pracy, ubóstwo)..."
            className="flex-1 py-3.5 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tradycyjny katalog raportów i kartogramów */}
      <div className="space-y-6 animate-in fade-in duration-200">
        {filteredResearches.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-stone-50 rounded-2xl border border-stone-100">
            Nie znaleziono badań odpowiadających frazie &bdquo;{searchQuery}&rdquo;.
          </p>
        ) : (
          /* Siatka kart diagnoz regionalnych (3 w rzędzie na desktopie) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResearches.map((research) => {
              const isPositive = research.summary.deltaAvg >= 0;

              return (
                <div
                  key={research.id}
                  onClick={() => router.push(`/knowledge/${research.id}`)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-black/4 select-none min-h-70"
                  style={{
                    background: `linear-gradient(145deg, ${research.theme.pastelBg} 0%, ${research.theme.colorScale[0]} 100%)`,
                  }}
                >
                  <div className="space-y-3.5">
                    {/* Ikona i kategoria */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ring-2 ring-white/60"
                          style={{ backgroundColor: research.theme.accent }}
                        >
                          {getIcon(research.iconName)}
                        </div>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-black/5"
                          style={{ color: research.theme.text }}
                        >
                          {research.category}
                        </span>
                      </div>
                    </div>

                    {/* Tytuł i opis */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug line-clamp-2">
                        {research.titlePl}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {research.descriptionPl}
                      </p>
                    </div>

                    {/* Kluczowe wskaźniki */}
                    <div className="bg-white/60 backdrop-blur-xs rounded-xl p-3 border border-black/5 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 font-medium">
                          Średnia Małopolski:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 text-sm">
                            {research.summary.endAvg} {research.unit}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${
                              isPositive ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {research.summary.deltaAvg}
                          </span>
                        </div>
                      </div>

                      {research.summary.topCounty.name && (
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-black/5">
                          <span className="text-stone-500 font-medium">
                            Lider ({research.summary.endYear}):
                          </span>
                          <span className="font-semibold text-stone-800 truncate max-w-[130px]">
                            {research.summary.topCounty.name.replace(
                              "Powiat ",
                              "",
                            )}{" "}
                            ({research.summary.topCounty.value} {research.unit})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Przejście do szczegółów */}
                  <div className="pt-3 mt-3 border-t border-black/6 flex items-center justify-between text-xs font-semibold text-stone-700 group-hover:text-stone-950 transition-colors">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-125 shadow-2xs"
                        style={{ backgroundColor: research.theme.accent }}
                      />
                      <span>Przeglądaj mapy</span>
                    </span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5 bg-black/5 group-hover:bg-black/10 text-stone-800">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
