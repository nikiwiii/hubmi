import React from "react";
import { Idea, ColorTheme, getCategoryThemeAndShape } from "../../lib/types";
import { GeometricIllustration } from "./GeometricIllustration";
import { ThumbsUp, Users, Check, MessageSquare, Handshake, GraduationCap, Clock } from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
  onVote?: (e: React.MouseEvent) => void;
  onToggleTesting?: (e: React.MouseEvent) => void;
  onChat?: (e: React.MouseEvent) => void;
  onPartner?: (e: React.MouseEvent) => void;
  onAssignExpert?: (e: React.MouseEvent) => void;
  isTester?: boolean;
  isAdminOrExpert?: boolean;
}

export const getThemeStyles = (theme: ColorTheme) => {
  switch (theme) {
    case "yellow":
      return {
        bg: "bg-[#EFE5C6]",
        text: "text-[#2A271E]",
        subtext: "text-[#5C5543]",
        badge: "bg-black/5 text-[#2A271E]",
        border: "border-[#DFD3AE]",
      };
    case "slate":
      return {
        bg: "bg-[#D7D8D1]",
        text: "text-[#242522]",
        subtext: "text-[#565752]",
        badge: "bg-black/5 text-[#242522]",
        border: "border-[#C6C7BD]",
      };
    case "lavender":
      return {
        bg: "bg-[#D2D8EE]",
        text: "text-[#1D2235]",
        subtext: "text-[#4A5270]",
        badge: "bg-black/5 text-[#1D2235]",
        border: "border-[#C1C9E4]",
      };
    case "sage":
      return {
        bg: "bg-[#CAD7CE]",
        text: "text-[#1B271F]",
        subtext: "text-[#435548]",
        badge: "bg-black/5 text-[#1B271F]",
        border: "border-[#B6C7BA]",
      };
    case "lilac":
      return {
        bg: "bg-[#DCD0E6]",
        text: "text-[#291D33]",
        subtext: "text-[#554563]",
        badge: "bg-black/5 text-[#291D33]",
        border: "border-[#CCBCDB]",
      };
    case "pink":
      return {
        bg: "bg-[#EAD4D9]",
        text: "text-[#311E22]",
        subtext: "text-[#64474D]",
        badge: "bg-black/5 text-[#311E22]",
        border: "border-[#DFC1C8]",
      };
    case "cyan":
    default:
      return {
        bg: "bg-[#CEE0E6]",
        text: "text-[#1A282E]",
        subtext: "text-[#425861]",
        badge: "bg-black/5 text-[#1A282E]",
        border: "border-[#B9D2DB]",
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
  isTester = false,
  isAdminOrExpert = false,
}) => {
  // Color theme and shape strictly depend on category
  const { theme, shape } = getCategoryThemeAndShape(idea.category);
  const styles = getThemeStyles(theme);

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${styles.bg} min-h-[290px] border border-black/[0.04] select-none`}
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
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                <Clock className="w-3 h-3" />
                <span>Oczekuje na akceptację</span>
              </span>
            )}

            {idea.lookingForPartner && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300/60 px-2 py-0.5 rounded-full shadow-2xs">
                <Handshake className="w-3 h-3 text-amber-700" />
                <span>Szuka partnera</span>
              </span>
            )}

            {idea.assignedExpertName && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-stone-900 text-white px-2 py-0.5 rounded-full shadow-2xs">
                <GraduationCap className="w-3 h-3 text-[#EFE5C6]" />
                <span>Mentor: {idea.assignedExpertName}</span>
              </span>
            )}

            {isTester && (
              <span className="flex items-center gap-1 text-[11px] font-bold bg-white/90 text-stone-800 px-2 py-0.5 rounded-full shadow-2xs">
                <Check className="w-3 h-3 text-emerald-600" />
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

        <p className={`text-xs font-medium line-clamp-1 ${styles.subtext}`}>
          {idea.subtitle}
        </p>

        {idea.lookingForPartner && idea.partnerTypes && idea.partnerTypes.length > 0 && (
          <p className="text-[10px] text-stone-600 font-semibold pt-0.5">
            Poszukiwany partner: <em>{idea.partnerTypes.join(", ")}</em>
          </p>
        )}
      </div>

      {/* Center: generated visualization or Geometric Illustration */}
      {idea.visualMockupUrl ? (
        <div className="my-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / data URLs */}
          <img
            src={idea.visualMockupUrl}
            alt={`Wizualizacja: ${idea.title}`}
            className="w-full aspect-4/3 object-cover transition-transform duration-300 group-hover:scale-103"
          />
        </div>
      ) : (
        <div className="my-auto flex items-center justify-center py-2 transition-transform duration-300 group-hover:scale-103">
          <GeometricIllustration shape={shape} theme={theme} size={90} />
        </div>
      )}

      {/* Bottom Footer with Author and Stats */}
      <div className="z-10 mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-black/[0.06]">
        <p className={`text-xs font-bold ${styles.text}`}>{idea.authorName}</p>

        {/* Action Counters & Buttons */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Przycisk Zgłoś partnerstwo */}
          {idea.lookingForPartner && onPartner && (
            <button
              onClick={onPartner}
              title="Zgłoś chęć partnerstwa jako NGO, samorząd lub firma"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition-all cursor-pointer border border-amber-300/60"
            >
              <Handshake className="w-3.5 h-3.5 text-amber-900" />
              <span>Partneruj</span>
            </button>
          )}

          {/* Przycisk Przypisz mentora */}
          {isAdminOrExpert && onAssignExpert && !idea.assignedExpertName && (
            <button
              onClick={onAssignExpert}
              title="Przypisz mentora ROPS Kraków"
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white/80 hover:bg-white text-stone-800 transition-all cursor-pointer border border-black/5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-stone-700" />
              <span>+ Mentor</span>
            </button>
          )}

          {onChat && (
            <button
              onClick={onChat}
              title="Czat z autorem"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/70 hover:bg-white text-stone-800 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Czat</span>
            </button>
          )}

          {onVote && (
            <button
              onClick={onVote}
              title="Polub"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                idea.userVote === "like"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-white/70 hover:bg-white text-stone-800"
              }`}
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 ${idea.userVote === "like" ? "fill-white" : ""}`}
              />
              <span>{idea.likes}</span>
            </button>
          )}

          {onToggleTesting && (
            <button
              onClick={onToggleTesting}
              title="Testerzy"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isTester
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white/70 hover:bg-white text-stone-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{idea.testersCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

