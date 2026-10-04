"use client";

import React from "react";
import { User } from "../../lib/types";
import {
  Shield,
  FlaskConical,
  Plus,
  LogOut,
  CheckCircle2,
} from "lucide-react";

interface DashboardHeaderProps {
  user: User;
  isLargeFont: boolean;
  toggleFontSize: () => void;
  onNavigatePropose: () => void;
  onNavigateTesting: () => void;
  onLogout: () => void;
  adminFeedback: string;
  onDismissFeedback: () => void;
}

export function DashboardHeader({
  user,
  isLargeFont,
  toggleFontSize,
  onNavigatePropose,
  onNavigateTesting,
  onLogout,
  adminFeedback,
  onDismissFeedback,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* KARTA PROFILU I SZYBKICH AKCJI */}
      <div className="bg-white dark:bg-[#1C1E23] rounded-3xl px-5 py-4 border border-black/5 dark:border-white/10 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Lewa: awatar + imię */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-stone-800 shrink-0 shadow-sm ring-2 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: user.avatarBg || "#A4B3F6" }}
          >
            {(user.name || user.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900 dark:text-white leading-tight truncate">
                {user.name || user.email || "Użytkownik"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 shrink-0">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Prawa: przyciski akcji */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onNavigateTesting}
            className="min-h-[34px] flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Przejdź do sekcji testera innowacji"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sekcja Testera</span>
          </button>

          <button
            type="button"
            onClick={onNavigatePropose}
            aria-label="Zaproponuj nowy pomysł"
            className="min-h-[34px] flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nowy pomysł</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Wyloguj się z platformy"
            className="min-h-[34px] p-2 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 rounded-xl transition-colors cursor-pointer"
            title="Wyloguj się"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* WCAG – dyskretny przycisk skali czcionki */}
          <button
            type="button"
            onClick={toggleFontSize}
            aria-label={
              isLargeFont
                ? "Czcionka powiększona (A+) – kliknij, aby przywrócić"
                : "Kliknij, aby włączyć czcionkę A+"
            }
            aria-pressed={isLargeFont}
            title={`WCAG 2.2 AA – czcionka ${isLargeFont ? "powiększona" : "standardowa"}`}
            className={`min-h-[34px] px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              isLargeFont
                ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent"
                : "bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10 hover:bg-stone-200 dark:hover:bg-white/15"
            }`}
          >
            {isLargeFont ? "A+" : "A"}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {adminFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminFeedback}</span>
          </div>
          <button
            type="button"
            onClick={onDismissFeedback}
            className="p-1 min-h-[26px] min-w-[26px] flex items-center justify-center text-emerald-800 dark:text-emerald-300 hover:opacity-70 font-bold text-xs rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
