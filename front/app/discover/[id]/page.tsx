"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Idea, getCategoryThemeAndShape } from "../../lib/types";
import { GeometricIllustration } from "../../components/shared/GeometricIllustration";
import { getThemeStyles } from "../../components/shared/IdeaCard";
import { useApp } from "../../context/AppContext";
import {
  ThumbsUp,
  ThumbsDown,
  Users,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Check,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function DiscoverIdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const {
    ideas,
    currentUser,
    vote,
    toggleTesting,
    openChatWithAuthor,
    isLoadingIdeas,
  } = useApp();

  if (isLoadingIdeas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-stone-500" />
        <p className="text-sm font-medium">Wczytywanie szczegółów pomysłu...</p>
      </div>
    );
  }

  const currentIndex = ideas.findIndex((i) => i.id === id);
  const currentIdea = currentIndex >= 0 ? ideas[currentIndex] : null;

  if (!currentIdea) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">
          Nie znaleziono pomysłu
        </h2>
        <p className="text-sm text-stone-500">
          Pomysł o identyfikatorze &quot;{id}&quot; nie istnieje lub został
          usunięty.
        </p>
        <button
          onClick={() => router.push("/discover")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do odkrywania pomysłów</span>
        </button>
      </div>
    );
  }

  const isTester = currentUser
    ? currentIdea.testersList?.includes(currentUser.email)
    : false;

  const { theme, shape } = getCategoryThemeAndShape(currentIdea.category);
  const styles = getThemeStyles(theme);

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + ideas.length) % ideas.length;
    router.push(`/discover/${ideas[nextIdx].id}`);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % ideas.length;
    router.push(`/discover/${ideas[nextIdx].id}`);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/discover")}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium"
            title="Powrót do listy"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Wróć</span>
          </button>
        </div>

        {/* Carousel Prev/Next */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            aria-label="Poprzedni"
            className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Następny"
            className="p-2.5 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Card Container */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden">
        {/* Banner with category-bound subtle color palette */}
        <div
          className={`p-6 sm:p-10 ${styles.bg} flex flex-col md:flex-row md:items-center justify-between gap-6`}
        >
          <div className="space-y-2 max-w-xl">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${styles.badge}`}
            >
              {currentIdea.category}
            </span>

            <h1
              className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${styles.text}`}
            >
              {currentIdea.title}
            </h1>

            <p className={`text-base font-medium ${styles.subtext}`}>
              {currentIdea.subtitle}
            </p>

            <p className={`text-xs font-semibold pt-1 ${styles.subtext}`}>
              Autor: {currentIdea.authorName}
            </p>
          </div>

          {currentIdea.visualMockupUrl ? (
            <div className="shrink-0 w-full md:w-80 overflow-hidden rounded-2xl border border-white/50 bg-white/40">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / data URLs */}
              <img
                src={currentIdea.visualMockupUrl}
                alt={`Wizualizacja: ${currentIdea.title}`}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs rounded-2xl border border-white/50">
              <GeometricIllustration shape={shape} theme={theme} size={120} />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 sm:p-8 bg-white border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
          {/* Like / Dislike */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => vote(currentIdea.id, "like")}
              title="Polub"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentIdea.userVote === "like"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-800"
              }`}
            >
              <ThumbsUp
                className={`w-4 h-4 ${currentIdea.userVote === "like" ? "fill-white" : ""}`}
              />
              <span>{currentIdea.likes}</span>
            </button>

            <button
              onClick={() => vote(currentIdea.id, "dislike")}
              title="Nie podoba mi się"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentIdea.userVote === "dislike"
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              }`}
            >
              <ThumbsDown
                className={`w-4 h-4 ${currentIdea.userVote === "dislike" ? "fill-white" : ""}`}
              />
              <span>{currentIdea.dislikes}</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openChatWithAuthor(currentIdea.authorId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-stone-500" />
              <span>Zapytaj eksperta</span>
            </button>

            <button
              onClick={() => toggleTesting(currentIdea.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isTester
                  ? "bg-emerald-700 text-white"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              {isTester ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Biorę udział w testach</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Chcę testować ({currentIdea.testersCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Details & Description - Always visible */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Opis pomysłu
            </h2>
            <p className="text-stone-700 text-base leading-relaxed whitespace-pre-line">
              {currentIdea.description}
            </p>
          </div>

          {currentIdea.targetAudience && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                Dla kogo
              </p>
              <p className="text-sm font-medium text-stone-800">
                {currentIdea.targetAudience}
              </p>
            </div>
          )}

          {currentIdea.keyBenefits && currentIdea.keyBenefits.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Kluczowe korzyści
              </p>
              <div className="flex flex-wrap gap-2">
                {currentIdea.keyBenefits.map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-medium text-stone-700"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
