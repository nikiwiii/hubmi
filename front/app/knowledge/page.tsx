"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResearches } from "../lib/researchData";
import { KnowledgeRagSection } from "../components/knowledge/KnowledgeRagSection";
import {
  Users,
  Briefcase,
  Banknote,
  Heart,
  Activity,
  ArrowRight,
  Search,
  X,
  Filter,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  "Wszystkie",
  "Niepełnosprawność",
  "Pomoc Społeczna",
  "Rynek Pracy",
  "Zdrowie",
  "Piecza Zastępcza",
  "Demografia",
  "Finanse",
  "Edukacja",
  "Kultura",
];

function KnowledgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { researches, isLoading } = useResearches();
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [catalogSearch, setCatalogSearch] = useState("");

  const filteredResearches = useMemo(() => {
    return researches.filter((r) => {
      // Filtr kategorii
      if (selectedCategory !== "Wszystkie" && r.category !== selectedCategory) {
        return false;
      }
      // Filtr wyszukiwania tekstowego w katalogu
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase();
      return (
        r.titlePl.toLowerCase().includes(q) ||
        r.descriptionPl.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    });
  }, [researches, selectedCategory, catalogSearch]);

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
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* NAGŁÓWEK STRONY */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Katalog Badań</span>
            <span className="block text-stone-400">i Raportów Społecznych</span>
          </div>
          <p className="mt-2.5 text-stone-500 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
            Oficjalne dane i wskaźniki ROPS Kraków – inteligentny RAG analityczny, interaktywne kartogramy oraz szeregi czasowe 2014–2024 dla 22 powiatów Małopolski.
          </p>
        </div>
      </div>

      {/* FLAGOWA SEKCJA: INTELIGENTNY RAG RAPORTÓW I WSKAŹNIKÓW */}
      <KnowledgeRagSection initialQuery={initialQuery} />

      {/* KATALOG WSZYSTKICH BADAŃ I KARTOGRAMÓW ROPS */}
      <div className="space-y-6 pt-4 border-t border-stone-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Katalog Diagnoz i Kartogramów
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              Przeglądaj wszystkie {researches.length} diagnoz z podziałem na dziedziny polityki społecznej.
            </p>
          </div>

          {/* Szybki filtr tekstowy kart katalogu */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Filtruj karty katalogu..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => setCatalogSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* PILLS KATEGORII */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* SIATKA KART DIAGNOZ REGIONALNYCH */}
        {filteredResearches.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-stone-50 rounded-2xl border border-stone-100">
            Nie znaleziono badań odpowiadających wybranym kryteriom.
          </p>
        ) : (
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

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-stone-400">
          Ładowanie bazy wiedzy i raportów...
        </div>
      }
    >
      <KnowledgeContent />
    </Suspense>
  );
}
