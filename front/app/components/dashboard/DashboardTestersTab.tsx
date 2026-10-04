"use client";

import React, { useState } from "react";
import { TesterApplication } from "../../lib/types";
import {
  Clock,
  CheckCircle2,
  X,
  Check,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  FlaskConical,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface DashboardTestersTabProps {
  testerApps: TesterApplication[];
  isLoadingTesterApps: boolean;
  pendingTesterAppsCount: number;
  approvedTesterAppsCount: number;
  onReload: () => void;
  onApproveTester: (
    appId: string,
    userName: string,
    ideaTitle: string,
  ) => Promise<void>;
  onRejectTester: (appId: string, userName: string) => Promise<void>;
  onViewIdea: (ideaId: string) => void;
}

export function DashboardTestersTab({
  testerApps,
  isLoadingTesterApps,
  pendingTesterAppsCount,
  approvedTesterAppsCount,
  onReload,
  onApproveTester,
  onRejectTester,
  onViewIdea,
}: DashboardTestersTabProps) {
  const [testerAppFilter, setTesterAppFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [searchTesterQuery, setSearchTesterQuery] = useState("");

  const getTesterInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2)
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "TE";
  };

  const getTesterAvatarBg = (str?: string | null) => {
    const s = str || "tester";
    const colors = [
      "#D2D8EE",
      "#CAD7CE",
      "#EFE5C6",
      "#FAD4D8",
      "#E0D7F5",
      "#D7E9F7",
    ];
    let hash = 0;
    for (let i = 0; i < s.length; i++)
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const filteredApps = testerApps.filter((app) => {
    if (testerAppFilter !== "all" && app.status !== testerAppFilter)
      return false;
    if (searchTesterQuery.trim()) {
      const q = searchTesterQuery.toLowerCase();
      const matchName = (app.user_name || "").toLowerCase().includes(q);
      const matchEmail = (app.user_email || "").toLowerCase().includes(q);
      const matchTitle = (app.idea_title || "").toLowerCase().includes(q);
      const matchMotivation = (app.motivation || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchTitle || matchMotivation;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Pasek filtrów - ta sama struktura co tab ideas */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "Wszystkie", count: testerApps.length },
              {
                id: "pending",
                label: "Oczekujące",
                count: pendingTesterAppsCount,
              },
              {
                id: "approved",
                label: "Zaakceptowane",
                count: approvedTesterAppsCount,
              },
              {
                id: "rejected",
                label: "Odrzucone",
                count: testerApps.filter((a) => a.status === "rejected").length,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setTesterAppFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                testerAppFilter === f.id
                  ? f.id === "pending" && pendingTesterAppsCount > 0
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  testerAppFilter === f.id ? "opacity-80" : "opacity-60"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Szukajka i Odśwież */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchTesterQuery}
              onChange={(e) => setSearchTesterQuery(e.target.value)}
              placeholder="Szukaj testera..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
            {searchTesterQuery && (
              <button
                onClick={() => setSearchTesterQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={onReload}
            className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl cursor-pointer shrink-0 transition-colors"
            title="Odśwież zgłoszenia"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingTesterApps ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Lista kart zgłoszeń testerów */}
      {isLoadingTesterApps && testerApps.length === 0 ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10">
          <RefreshCw className="w-4 h-4 animate-spin text-stone-500" />
          <span>Wczytywanie zgłoszeń testerów...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const isAppPending = app.status === "pending";

            return (
              <div
                key={app.id}
                className={`rounded-2xl p-5 sm:p-6 border transition-all space-y-4 ${
                  isAppPending
                    ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-300/90 dark:border-amber-500/40 shadow-xs ring-1 ring-amber-400/20"
                    : "bg-white dark:bg-[#1C1E23] border-stone-200/80 dark:border-white/10 shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* 1. Górny pasek: Kandydat po lewej, Status i Decyzja po prawej */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-white/10">
                  {/* Kandydat */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-stone-900 text-xs shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: getTesterAvatarBg(
                          app.user_name || app.user_email || "tester",
                        ),
                      }}
                    >
                      {getTesterInitials(app.user_name, app.user_email)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                          {app.user_name || "Anonimowy Kandydat"}
                        </h4>
                        {isAppPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            Oczekuje na akceptację
                          </span>
                        ) : app.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                            Zaakceptowany tester
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                            <X className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                            Odrzucony
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                        {app.user_email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span>{app.user_email}</span>
                          </span>
                        )}
                        {app.created_at && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            <span>
                              Data zgłoszenia: {app.created_at.split("T")[0]}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Przyciski decyzyjne po prawej */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                    {isAppPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onApproveTester(
                              app.id,
                              app.user_name || "Kandydat",
                              app.idea_title || "Pomysł",
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Zaakceptuj testera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onRejectTester(
                              app.id,
                              app.user_name || "Kandydat",
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 bg-stone-100 dark:bg-white/10 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Odrzuć</span>
                        </button>
                      </div>
                    ) : app.status === "approved" ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Tester ma dostęp do testów</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/40">
                        <span>Wniosek odrzucony</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Dolny pas: Siatka 2-kolumnowa (Projekt po lewej, Motywacja po prawej) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Box Projektu testowego */}
                  <div className="bg-stone-50/90 dark:bg-white/5 rounded-xl p-3.5 sm:p-4 border border-stone-200/70 dark:border-white/10 flex items-center">
                    <button
                      type="button"
                      onClick={() => onViewIdea(app.idea_id)}
                      className="font-bold text-stone-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-xs sm:text-sm text-left flex items-center justify-between gap-3 w-full group cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2.5 line-clamp-2">
                        <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{app.idea_title}</span>
                      </span>
                      <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-amber-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                  {/* Box Motywacji */}
                  <div className="bg-stone-50/90 dark:bg-white/5 rounded-xl p-3.5 sm:p-4 border border-stone-200/70 dark:border-white/10 flex items-center">
                    {app.motivation ? (
                      <div className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 italic leading-relaxed">
                        <MessageSquare className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5 not-italic" />
                        <span>&ldquo;{app.motivation}&rdquo;</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-xs text-stone-400 italic">
                        <MessageSquare className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0 not-italic" />
                        <span>
                          Brak dodatkowej wiadomości od kandydata.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="py-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10">
              {searchTesterQuery || testerAppFilter !== "all"
                ? "Brak zgłoszeń testerów pasujących do wyszukiwania."
                : "Brak zgłoszeń testerów w systemie."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
