"use client";

import React from "react";
import { Idea, ColorTheme, User, getCategoryThemeAndShape } from "../../lib/types";
import { GeometricIllustration } from "./GeometricIllustration";
import {
  ThumbsUp,
  Users,
  Check,
  MessageSquare,
  Handshake,
  GraduationCap,
  Clock,
  Trash2,
} from "lucide-react";
import { canUserDeleteIdea, isUserAdmin, isUserIdeaAuthor } from "../../lib/ideasStore";
import { useApp } from "../../context/AppContext";

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
  onVote?: (e: React.MouseEvent) => void;
  onToggleTesting?: (e: React.MouseEvent) => void;
  onChat?: (e: React.MouseEvent) => void;
  onPartner?: (e: React.MouseEvent) => void;
  onAssignExpert?: (e: React.MouseEvent) => void;
  onDelete?: (idea: Idea) => void;
  currentUser?: User | null;
  isTester?: boolean;
  isAdminOrExpert?: boolean;
}

export const getThemeStyles = (theme: ColorTheme) => {
  switch (theme) {
    case "yellow":
      return {
        bg: "bg-[#EFE5C6] dark:bg-[#232018] dark:border-amber-500/25",
        text: "text-[#2A271E] dark:text-[#FEF9EE]",
        subtext: "text-[#5C5543] dark:text-[#D8D0BC]",
        badge: "bg-black/5 text-[#2A271E] dark:bg-amber-400/20 dark:text-amber-200",
        border: "border-[#DFD3AE] dark:border-amber-500/25",
      };
    case "slate":
      return {
        bg: "bg-[#D7D8D1] dark:bg-[#1E2021] dark:border-stone-500/25",
        text: "text-[#242522] dark:text-[#F5F5F3]",
        subtext: "text-[#565752] dark:text-[#CBD0CB]",
        badge: "bg-black/5 text-[#242522] dark:bg-white/10 dark:text-stone-200",
        border: "border-[#C6C7BD] dark:border-stone-500/25",
      };
    case "lavender":
      return {
        bg: "bg-[#D2D8EE] dark:bg-[#1C1F2E] dark:border-indigo-500/25",
        text: "text-[#1D2235] dark:text-[#EEF2FD]",
        subtext: "text-[#4A5270] dark:text-[#C5CCEA]",
        badge: "bg-black/5 text-[#1D2235] dark:bg-indigo-400/20 dark:text-indigo-200",
        border: "border-[#C1C9E4] dark:border-indigo-500/25",
      };
    case "sage":
      return {
        bg: "bg-[#CAD7CE] dark:bg-[#19221C] dark:border-emerald-500/25",
        text: "text-[#1B271F] dark:text-[#EDF7F0]",
        subtext: "text-[#435548] dark:text-[#BDD3C3]",
        badge: "bg-black/5 text-[#1B271F] dark:bg-emerald-400/20 dark:text-emerald-200",
        border: "border-[#B6C7BA] dark:border-emerald-500/25",
      };
    case "lilac":
      return {
        bg: "bg-[#DCD0E6] dark:bg-[#241A29] dark:border-purple-500/25",
        text: "text-[#291D33] dark:text-[#F8F1FD]",
        subtext: "text-[#554563] dark:text-[#DAC7E6]",
        badge: "bg-black/5 text-[#291D33] dark:bg-purple-400/20 dark:text-purple-200",
        border: "border-[#CCBCDB] dark:border-purple-500/25",
      };
    case "pink":
      return {
        bg: "bg-[#EAD4D9] dark:bg-[#28181D] dark:border-rose-500/25",
        text: "text-[#311E22] dark:text-[#FDF2F4]",
        subtext: "text-[#64474D] dark:text-[#E4BFC6]",
        badge: "bg-black/5 text-[#311E22] dark:bg-rose-400/20 dark:text-rose-200",
        border: "border-[#DFC1C8] dark:border-rose-500/25",
      };
    case "cyan":
    default:
      return {
        bg: "bg-[#CEE0E6] dark:bg-[#162329] dark:border-cyan-500/25",
        text: "text-[#1A282E] dark:text-[#EDF8FA]",
        subtext: "text-[#425861] dark:text-[#B6D9E3]",
        badge: "bg-black/5 text-[#1A282E] dark:bg-cyan-400/20 dark:text-cyan-200",
        border: "border-[#B9D2DB] dark:border-cyan-500/25",
      };
  }
};

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onClick,
  onVote,
  onToggleTesting,
  onChat,
  onPartner,
  onAssignExpert,
  onDelete,
  currentUser,
  isTester = false,
  isAdminOrExpert = false,
}) => {
  const appContext = useApp();
  const effectiveUser = currentUser !== undefined ? currentUser : appContext?.currentUser;

  // Color theme and shape strictly depend on category
  const { theme, shape } = getCategoryThemeAndShape(idea.category);
  const styles = getThemeStyles(theme);

  const canDelete = Boolean(effectiveUser && canUserDeleteIdea(idea, effectiveUser));
  const isAuthor = isUserIdeaAuthor(idea, effectiveUser);
  const isAdmin = isUserAdmin(effectiveUser);

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={`Karta projektu: ${idea.title}, kategoria ${idea.category}, autor ${idea.authorName}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 dark:focus-visible:ring-amber-400 focus-visible:outline-none ${styles.bg} min-h-[290px] border ${styles.border} select-none`}
    >
      {/* Top Header */}
      <div className="z-10 flex flex-col space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${styles.badge}`}
          >
            {idea.category}
          </span>

          <div className="flex flex-wrap items-center gap-1">
            {idea.status === "pending" && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>Oczekuje na akceptację</span>
              </span>
            )}

            {idea.lookingForPartner && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100/90 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60 px-2 py-0.5 rounded-full shadow-2xs">
                <Handshake className="w-3 h-3 text-amber-800 dark:text-amber-300" aria-hidden="true" />
                <span>Szuka partnera</span>
              </span>
            )}

            {idea.assignedExpertName && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-stone-900 dark:bg-white text-white dark:text-stone-950 px-2 py-0.5 rounded-full shadow-2xs">
                <GraduationCap className="w-3 h-3 text-[#EFE5C6] dark:text-amber-600" aria-hidden="true" />
                <span>Mentor: {idea.assignedExpertName}</span>
              </span>
            )}

            {isTester && (
              <span className="flex items-center gap-1 text-[11px] font-bold bg-white/95 dark:bg-white/15 text-stone-900 dark:text-stone-100 border border-black/5 dark:border-white/10 px-2 py-0.5 rounded-full shadow-2xs">
                <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                Tester
              </span>
            )}
          </div>
        </div>

        <h3
          className={`text-xl font-bold leading-snug tracking-tight mt-1 ${styles.text}`}
        >
          {idea.title}
        </h3>

        <p className={`text-xs font-semibold line-clamp-1 ${styles.subtext}`}>
          {idea.subtitle}
        </p>

        {idea.lookingForPartner && idea.partnerTypes && idea.partnerTypes.length > 0 && (
          <p className="text-[10px] text-stone-700 dark:text-stone-300 font-semibold pt-0.5">
            Poszukiwany partner: <em>{idea.partnerTypes.join(", ")}</em>
          </p>
        )}
      </div>

      {/* Center: generated visualization or Geometric Illustration */}
      {idea.visualMockupUrl ? (
        <div className="my-3 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / data URLs */}
          <img
            src={idea.visualMockupUrl}
            alt={`Wizualizacja projektu: ${idea.title}`}
            className="w-full aspect-4/3 object-cover transition-transform duration-300 group-hover:scale-103"
          />
        </div>
      ) : (
        <div
          className="my-auto flex items-center justify-center py-2 transition-transform duration-300 group-hover:scale-103"
          aria-hidden="true"
        >
          <GeometricIllustration shape={shape} theme={theme} size={90} />
        </div>
      )}

      {/* Bottom Footer with Author and Stats */}
      <div className="z-10 mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-black/[0.06] dark:border-white/10">
        <p className={`text-xs font-bold ${styles.text}`}>Autor: {idea.authorName}</p>

        {/* Action Counters & Buttons */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Przycisk Zgłoś partnerstwo */}
          {idea.lookingForPartner && onPartner && (
            <button
              type="button"
              onClick={onPartner}
              title="Zgłoś chęć partnerstwa jako NGO, samorząd lub firma"
              aria-label={`Zgłoś chęć partnerstwa do pomysłu: ${idea.title}`}
              className="min-h-[28px] flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200/90 hover:bg-amber-300 dark:bg-amber-400/20 dark:hover:bg-amber-400/30 text-amber-950 dark:text-amber-200 transition-all cursor-pointer border border-amber-300/80 dark:border-amber-500/30 focus-visible:ring-2 focus-visible:ring-stone-900"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-900 dark:text-amber-300" aria-hidden="true" />
              <span>Partneruj</span>
            </button>
          )}

          {/* Przycisk Przypisz mentora */}
          {isAdminOrExpert && onAssignExpert && !idea.assignedExpertName && (
            <button
              type="button"
              onClick={onAssignExpert}
              title="Przypisz mentora ROPS Kraków"
              aria-label={`Przypisz mentora ROPS do pomysłu: ${idea.title}`}
              className="min-h-[28px] flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-stone-900 dark:text-stone-100 transition-all cursor-pointer border border-black/10 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-stone-900"
            >
              <GraduationCap className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" aria-hidden="true" />
              <span>+ Mentor</span>
            </button>
          )}

          {onChat && (
            <button
              type="button"
              onClick={onChat}
              title="Czat z autorem"
              aria-label={`Rozpocznij czat z autorem: ${idea.authorName}`}
              className="min-h-[28px] flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-stone-900 dark:text-stone-100 transition-all cursor-pointer border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-stone-900"
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Czat</span>
            </button>
          )}

          {onVote && (
            <button
              type="button"
              onClick={onVote}
              title={idea.userVote === "like" ? "Cofnij polubienie" : "Polub ten pomysł"}
              aria-label={`Polub pomysł. Aktualna liczba polubień: ${idea.likes}`}
              aria-pressed={idea.userVote === "like"}
              className={`min-h-[28px] flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-stone-900 ${idea.userVote === "like"
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-xs"
                  : "bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-stone-900 dark:text-stone-100"
                }`}
            >
              <ThumbsUp
                aria-hidden="true"
                className={`w-3.5 h-3.5 ${idea.userVote === "like" ? "fill-current" : ""}`}
              />
              <span>{idea.likes}</span>
            </button>
          )}

          {onToggleTesting && (
            <button
              type="button"
              onClick={onToggleTesting}
              title={isTester ? "Rezygnuj z testowania" : "Dołącz jako tester"}
              aria-label={`Dołącz jako tester pomysłu. Aktualna liczba testerów: ${idea.testersCount}`}
              aria-pressed={isTester}
              className={`min-h-[28px] flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border border-black/5 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-stone-900 ${isTester
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-stone-900 dark:text-stone-100"
                }`}
            >
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{idea.testersCount}</span>
            </button>
          )}

          {/* Dedykowany, spójny przycisk usunięcia dla Autora lub Administratora */}
          {canDelete && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea);
              }}
              title={
                isAdmin && !isAuthor
                  ? "Usuń propozycję (uprawnienia Administratora)"
                  : "Usuń swoją propozycję"
              }
              aria-label={`Usuń propozycję: ${idea.title}`}
              className="min-h-[28px] min-w-[28px] flex items-center justify-center p-1.5 rounded-full text-xs font-semibold bg-white/80 hover:bg-rose-50 dark:bg-white/10 dark:hover:bg-rose-950/50 text-stone-600 hover:text-rose-600 dark:text-stone-300 dark:hover:text-rose-300 border border-black/5 hover:border-rose-300/80 dark:border-white/10 dark:hover:border-rose-800/80 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 shadow-2xs group/del"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" aria-hidden="true" />
              <span className="sr-only">Usuń propozycję</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
