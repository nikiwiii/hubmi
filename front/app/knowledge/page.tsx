"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useResearches } from "../lib/researchData";
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
  const { researches, isLoading } = useResearches();

  // Tryb skupienia na czacie (pamiętanie wyboru usera w localStorage)
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem("minno_knowledge_active_tab");
      if (savedTab === "catalog") {
        setIsChatOpen(false);
      } else if (savedTab === "chat") {
        setIsChatOpen(true);
      }
    } catch { }
  }, []);

  const handleTabChange = (openChat: boolean) => {
    setIsChatOpen(openChat);
    try {
      localStorage.setItem(
        "minno_knowledge_active_tab",
        openChat ? "chat" : "catalog"
      );
    } catch { }
  };

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
              {isChatOpen ? "Z Bazą Raportów" : "Społecznych"}
            </span>
          </div>
          <p className="mt-2.5 text-stone-500 text-xs sm:text-sm font-medium max-w-xl">
            {isChatOpen
              ? ""
              : "Diagnozy ROPS Kraków – interaktywne kartogramy i szeregi czasowe 2014–2024 dla 22 powiatów."}
          </p>
        </div>

        {/* Zakładki wyboru: Czat AI vs Tradycyjny Katalog */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200/80 shadow-2xs self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isChatOpen
              ? "bg-stone-900 text-white shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${isChatOpen ? "text-amber-400" : "text-stone-400"}`}
            />
            <span>Doradca AI</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${!isChatOpen
              ? "bg-stone-900 text-white shadow-2xs"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
              }`}
          >
            <BookOpen
              className={`w-3.5 h-3.5 ${!isChatOpen ? "text-stone-200" : "text-stone-500"}`}
            />
            <span>Katalog Badań</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${!isChatOpen
                ? "bg-white/20 text-white"
                : "bg-black/5 text-stone-500"
                }`}
            >
              {researches.length}
            </span>
          </button>
        </div>
      </div>

      {/* WIDOK 1: Użytkownik jest w 100% skupiony tylko na czacie */}
      {isChatOpen ? (
        <section className="animate-in fade-in duration-200">
          <ResearchAIChat onClose={() => handleTabChange(false)} />
        </section>
      ) : (
        /* WIDOK 2: Tradycyjny katalog raportów i kartogramów */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Siatka kart diagnoz regionalnych (3 w rzędzie na desktopie) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {researches.map((research) => {
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
                            className={`text-[11px] font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"
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
        </div>
      )}
    </div>
  );
}
