"use client";

import React, { useState } from "react";
import { Idea } from "../../lib/types";
import {
  Clock,
  CheckCircle2,
  Users,
  X,
  ExternalLink,
  Trash2,
  Search,
} from "lucide-react";
import { CustomSelect } from "../shared/CustomSelect";

interface DashboardIdeasTabProps {
  ideas: Idea[];
  pendingIdeasCount: number;
  onApproveIdea: (ideaId: string, ideaTitle: string) => Promise<void>;
  onRejectIdea: (ideaId: string, ideaTitle: string) => Promise<void>;
  onUpdateIdeaStatus: (
    ideaId: string,
    status: "active" | "pending" | "testing" | "rejected" | "archived",
  ) => Promise<void>;
  onDeleteIdea: (ideaId: string, ideaTitle: string) => void;
  onViewIdea: (ideaId: string) => void;
}

export function DashboardIdeasTab({
  ideas,
  pendingIdeasCount,
  onApproveIdea,
  onRejectIdea,
  onUpdateIdeaStatus,
  onDeleteIdea,
  onViewIdea,
}: DashboardIdeasTabProps) {
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<
    "all" | "pending" | "active" | "testing"
  >("all");
  const [searchIdeaQuery, setSearchIdeaQuery] = useState("");

  const filteredIdeas = ideas.filter((idea) => {
    if (ideaStatusFilter !== "all" && idea.status !== ideaStatusFilter)
      return false;
    if (searchIdeaQuery.trim()) {
      const q = searchIdeaQuery.toLowerCase();
      const matchTitle = (idea.title || "").toLowerCase().includes(q);
      const matchAuthor = (idea.authorName || "").toLowerCase().includes(q);
      const matchDesc = (idea.description || "").toLowerCase().includes(q);
      const matchCat = (idea.category || "").toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchDesc || matchCat;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Pasek filtrów - zsynchronizowany z pozostałymi zakładkami */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: `Wszystkie`, count: ideas.length },
              {
                id: "pending",
                label: `Oczekujące`,
                count: pendingIdeasCount,
              },
              {
                id: "active",
                label: `Aktywne`,
                count: ideas.filter((i) => i.status === "active").length,
              },
              {
                id: "testing",
                label: `W testach`,
                count: ideas.filter((i) => i.status === "testing").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setIdeaStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                ideaStatusFilter === tab.id
                  ? tab.id === "pending" && pendingIdeasCount > 0
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  ideaStatusFilter === tab.id ? "opacity-80" : "opacity-60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Prawa strona: Szukajka + Wskaźnik decyzji */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchIdeaQuery}
              onChange={(e) => setSearchIdeaQuery(e.target.value)}
              placeholder="Szukaj pomysłu..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
            {searchIdeaQuery && (
              <button
                onClick={() => setSearchIdeaQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs shrink-0">
            {pendingIdeasCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <Clock className="w-3.5 h-3.5" />
                Wymaga decyzji: {pendingIdeasCount}
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zweryfikowane
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Karty pomysłów */}
      <div className="space-y-3 sm:space-y-4">
        {filteredIdeas.map((idea) => {
          const isPending = idea.status === "pending";

          return (
            <div
              key={idea.id}
              className={`rounded-2xl border transition-all space-y-0 ${
                isPending
                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-500/40 shadow-xs ring-1 ring-amber-400/20"
                  : "bg-white dark:bg-[#1C1E23] border-stone-200/80 dark:border-white/10 shadow-2xs hover:shadow-sm"
              }`}
            >
              {/* Górna sekcja: meta + tytuł */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Meta-row: kategoria, autor, data, status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-white/10">
                    {idea.category}
                  </span>

                  {/* Status Pill */}
                  {isPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                      Oczekuje na akceptację
                    </span>
                  ) : idea.status === "active" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3" />
                      Aktywny
                    </span>
                  ) : idea.status === "testing" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200/60">
                      <Users className="w-3 h-3" />W testach (
                      {idea.testersCount} testerów)
                    </span>
                  ) : idea.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60">
                      <X className="w-3 h-3" />
                      Odrzucony
                    </span>
                  ) : null}

                  <span className="ml-auto text-[11px] text-stone-400 dark:text-stone-500">
                    {idea.createdAt}
                  </span>
                </div>

                {/* Tytuł + opis */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white flex items-start gap-2">
                    <span className="flex-1">{idea.title}</span>
                    <button
                      type="button"
                      onClick={() => onViewIdea(idea.id)}
                      className="text-stone-400 hover:text-stone-900 dark:hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
                      title="Zobacz podgląd pomysłu"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Autor:{" "}
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {idea.authorName}
                    </span>
                  </p>
                  {idea.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mt-1.5">
                      {idea.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Dolna sekcja: akcje moderacji */}
              <div
                className={`px-4 sm:px-5 py-3 border-t flex flex-wrap items-center gap-2 ${
                  isPending
                    ? "border-amber-200/60 dark:border-amber-700/30 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-white/2"
                }`}
              >
                {isPending && (
                  <>
                    <button
                      onClick={() => onApproveIdea(idea.id, idea.title)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Zaakceptuj
                    </button>
                    <button
                      onClick={() => onRejectIdea(idea.id, idea.title)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Odrzuć
                    </button>
                  </>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <CustomSelect
                    value={idea.status}
                    onChange={(val) =>
                      onUpdateIdeaStatus(
                        idea.id,
                        val as
                          | "active"
                          | "pending"
                          | "testing"
                          | "rejected"
                          | "archived",
                      )
                    }
                    options={[
                      { value: "active", label: "Aktywny" },
                      { value: "pending", label: "Oczekujący" },
                      { value: "testing", label: "Testy" },
                      { value: "rejected", label: "Odrzucony" },
                      { value: "archived", label: "Archiwum" },
                    ]}
                    className="text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteIdea(idea.id, idea.title)}
                    className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 dark:text-rose-400 rounded-xl cursor-pointer transition-colors"
                    title="Usuń całkowicie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredIdeas.length === 0 && (
          <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
            {searchIdeaQuery || ideaStatusFilter !== "all"
              ? "Brak pomysłów spełniających kryteria wyszukiwania."
              : "Brak pomysłów do wyświetlenia."}
          </div>
        )}
      </div>
    </div>
  );
}
