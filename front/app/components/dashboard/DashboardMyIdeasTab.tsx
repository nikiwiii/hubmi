"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Lightbulb, Users } from "lucide-react";
import { Idea } from "../../lib/types";
import { IdeaCard } from "../shared/IdeaCard";
import { GrantCallsPanel } from "../grants/GrantCallsPanel";

interface DashboardMyIdeasTabProps {
  myCreatedIdeas: Idea[];
  myTestingIdeas: Idea[];
  selectIdea: (idea: Idea) => void;
  userEmail: string;
}

export function DashboardMyIdeasTab({
  myCreatedIdeas,
  myTestingIdeas,
  selectIdea,
  userEmail,
}: DashboardMyIdeasTabProps) {
  const router = useRouter();
  const [myIdeasFilter, setMyIdeasFilter] = useState<
    "all" | "created" | "testing"
  >("all");
  const [searchMyIdeasQuery, setSearchMyIdeasQuery] = useState("");

  const filteredMyCreatedIdeas = myCreatedIdeas.filter((idea) => {
    if (searchMyIdeasQuery.trim()) {
      const q = searchMyIdeasQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  const filteredMyTestingIdeas = myTestingIdeas.filter((idea) => {
    if (searchMyIdeasQuery.trim()) {
      const q = searchMyIdeasQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Pasek filtrów i narzędzi – zsynchronizowany z pozostałymi zakładkami */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            {
              id: "all",
              label: "Wszystkie moje",
              count: myCreatedIdeas.length + myTestingIdeas.length,
            },
            {
              id: "created",
              label: "Moje pomysły",
              count: myCreatedIdeas.length,
            },
            {
              id: "testing",
              label: "Udział w testach",
              count: myTestingIdeas.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setMyIdeasFilter(tab.id as typeof myIdeasFilter)
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                myIdeasFilter === tab.id
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  myIdeasFilter === tab.id ? "opacity-80" : "opacity-60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Prawa strona: Szukajka + Dodaj pomysł */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchMyIdeasQuery}
              onChange={(e) => setSearchMyIdeasQuery(e.target.value)}
              placeholder="Szukaj w moich..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
            {searchMyIdeasQuery && (
              <button
                onClick={() => setSearchMyIdeasQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => router.push("/propose")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy pomysł</span>
          </button>
        </div>
      </div>

      {/* Sekcja: Moje Zgłoszone Pomysły */}
      {(myIdeasFilter === "all" || myIdeasFilter === "created") && (
        <div className="space-y-3">
          {myIdeasFilter === "all" && (
            <div className="p-3.5 px-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  Moje Zgłoszone Pomysły
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400">
                  {filteredMyCreatedIdeas.length}
                </span>
              </div>
            </div>
          )}

          <GrantCallsPanel myIdeas={myCreatedIdeas} />

          {filteredMyCreatedIdeas.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
              {searchMyIdeasQuery
                ? "Brak zgłoszonych pomysłów pasujących do wyszukiwania."
                : "Brak zgłoszonych pomysłów przez to konto."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyCreatedIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => selectIdea(idea)}
                  isTester={idea.testersList?.includes(userEmail)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sekcja: Udział w testach */}
      {(myIdeasFilter === "all" || myIdeasFilter === "testing") && (
        <div className="space-y-3 pt-2">
          {myIdeasFilter === "all" && (
            <div className="p-3.5 px-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  Mój Udział w Testach
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-400">
                  {filteredMyTestingIdeas.length}
                </span>
              </div>
            </div>
          )}

          {filteredMyTestingIdeas.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
              {searchMyIdeasQuery
                ? "Brak testowanych projektów pasujących do wyszukiwania."
                : "Nie bierzesz udziału w żadnych testach prototypów."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyTestingIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => selectIdea(idea)}
                  isTester={true}
                  onChat={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/chat?topic=${encodeURIComponent(`Testy projektu: ${idea.title}`)}`,
                    );
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
