"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAllResearches } from "../lib/researchData";
import { ResearchAIChat } from "../components/knowledge/ResearchAIChat";
import {
  Users,
  Briefcase,
  Banknote,
  Heart,
  Activity,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function KnowledgePage() {
  const router = useRouter();
  const researches = getAllResearches();

  // Tryb skupienia na czacie (gdy czat jest otwarty, użytkownik skupia się wyłącznie na nim)
  const [isChatOpen, setIsChatOpen] = useState(true);

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
      {/* Górny przełącznik trybów (Separacja raportów od czatu) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">
              {isChatOpen ? "Doradca Projektów" : "Katalog Badań"}
            </span>
            <span className="block text-stone-300">
              {isChatOpen ? "AI" : "Społecznych"}
            </span>
          </div>
          <p className="mt-2.5 text-stone-500 text-xs sm:text-sm font-medium max-w-xl">
            {isChatOpen
              ? "Tryb skupienia: opisz swój pomysł, a doradca AI wskaże badania ROPS i powiaty o największym zapotrzebowaniu."
              : "Diagnozy ROPS Kraków – interaktywne kartogramy i szeregi czasowe 2014–2024 dla 22 powiatów."}
          </p>
        </div>

        {/* Zakładki wyboru: Czat AI vs Tradycyjny Katalog */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80 shadow-2xs self-start sm:self-auto shrink-0">
          <button
            onClick={() => setIsChatOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isChatOpen
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${isChatOpen ? "text-amber-400" : "text-stone-400"}`}
            />
            <span>Doradca AI</span>
          </button>

          <button
            onClick={() => setIsChatOpen(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !isChatOpen
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span>Katalog Badań ({researches.length})</span>
          </button>
        </div>
      </div>

      {/* WIDOK 1: Użytkownik jest w 100% skupiony tylko na czacie */}
      {isChatOpen ? (
        <section className="animate-in fade-in duration-200">
          <ResearchAIChat onClose={() => setIsChatOpen(false)} />
        </section>
      ) : (
        /* WIDOK 2: Tradycyjny katalog raportów i kartogramów */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Karta zachęcająca do otwarcia czatu AI */}
          <div
            onClick={() => setIsChatOpen(true)}
            className="p-5 sm:p-6 rounded-[28px] border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-white to-stone-50 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-950 transition-colors">
                  Masz w głowie plan nowego projektu społecznego?
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                  Skonsultuj go z doradcą AI. Asystent przeszuka bazę diagnoz
                  ROPS Kraków i wskaże raporty oraz powiaty, które najmocniej
                  uzasadniają Twoją inicjatywę.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 group-hover:bg-stone-800 text-white text-xs font-semibold transition-all shrink-0 shadow-2xs">
              <span>Uruchom Doradcę AI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Pasek podsumowania bazy danych */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-2xs">
              <span className="text-xs font-semibold text-stone-400 block uppercase tracking-wider">
                Obszary badań
              </span>
              <span className="text-2xl font-bold text-stone-900 mt-1 block">
                {researches.length} diagnozy
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

          {/* Siatka 4 kart diagnoz regionalnych */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {researches.map((research) => {
              const isPositive = research.summary.deltaAvg >= 0;

              return (
                <div
                  key={research.id}
                  onClick={() => router.push(`/knowledge/${research.id}`)}
                  className="group relative flex flex-col justify-between rounded-[28px] p-6 sm:p-7 border border-black/5 shadow-2xs hover:shadow-lg hover:border-black/10 transition-all duration-300 cursor-pointer min-h-[300px] overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at 14% 14%, ${research.theme.pastelBg} 0%, #ffffff 50%, #fafaf9 76%, #f5f5f4 100%)`,
                  }}
                >
                  <div className="space-y-4">
                    {/* Ikona i kategoria */}
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
                            color: research.theme.text,
                          }}
                        >
                          {research.category}
                        </span>
                      </div>
                    </div>

                    {/* Tytuł i opis */}
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug">
                        {research.titlePl}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed font-medium">
                        {research.descriptionPl}
                      </p>
                    </div>

                    {/* Kluczowe wskaźniki */}
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-stone-200/60 shadow-2xs space-y-1.5">
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
                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-200/50">
                          <span className="text-stone-500 font-medium">
                            Lider ({research.summary.endYear}):
                          </span>
                          <span className="font-semibold text-stone-800 truncate max-w-[170px]">
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
                        color: research.theme.text,
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
      )}
    </div>
  );
}
