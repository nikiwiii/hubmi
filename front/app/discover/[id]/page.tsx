"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Idea, getCategoryThemeAndShape } from "../../lib/types";
import { GeometricIllustration } from "../../components/shared/GeometricIllustration";
import { getThemeStyles } from "../../components/shared/IdeaCard";
import { InnovationTestPanel } from "../../components/testing/InnovationTestPanel";
import { DeleteIdeaModal } from "../../components/shared/DeleteIdeaModal";
import { useApp } from "../../context/AppContext";
import { startExpertConversation, fetchIdeaById } from "../../lib/api";
import { canUserDeleteIdea, isUserAdmin } from "../../lib/ideasStore";
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
  Maximize2,
  X,
  ExternalLink,
  Sparkles,
  Eye,
  Clock,
  Trash2,
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
    deleteIdea,
    openChatWithAuthor,
    isLoadingIdeas,
  } = useApp();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [directIdea, setDirectIdea] = useState<Idea | null>(null);
  const [isDirectLoading, setIsDirectLoading] = useState(false);

  const currentIndex = ideas.findIndex((i) => i.id === id);
  const listIdea = currentIndex >= 0 ? ideas[currentIndex] : null;

  useEffect(() => {
    if (!listIdea && id && !isLoadingIdeas) {
      let cancelled = false;
      setIsDirectLoading(true);
      fetchIdeaById(id)
        .then((res) => {
          if (!cancelled && res) setDirectIdea(res);
        })
        .finally(() => {
          if (!cancelled) setIsDirectLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [listIdea, id, isLoadingIdeas]);

  const currentIdea = listIdea || directIdea;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsImageModalOpen(false);
      }
    };
    if (isImageModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageModalOpen]);

  if (isLoadingIdeas || isDirectLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-stone-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-stone-500" />
        <p className="text-sm font-medium">Wczytywanie szczegółów pomysłu...</p>
      </div>
    );
  }

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
    if (currentIndex >= 0 && ideas.length > 1) {
      const nextIdx = (currentIndex - 1 + ideas.length) % ideas.length;
      router.push(`/discover/${ideas[nextIdx].id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && ideas.length > 1) {
      const nextIdx = (currentIndex + 1) % ideas.length;
      router.push(`/discover/${ideas[nextIdx].id}`);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/discover")}
            className="min-h-[38px] px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Wróć do listy pomysłów"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Wróć do listy</span>
          </button>
        </div>

        {/* Carousel Prev/Next */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Poprzedni pomysł"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Następny pomysł"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center p-2 rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
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

            {currentIdea.status === "pending" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                <span>Oczekuje na akceptację moderatora ROPS Kraków</span>
              </div>
            )}

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
            <div className="space-y-2 shrink-0 w-full md:w-96">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                aria-label={`Powiększ wizualizację prototypu: ${currentIdea.title}`}
                className="w-full text-left group relative cursor-pointer overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.01] block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage / data URLs */}
                <img
                  src={currentIdea.visualMockupUrl}
                  alt={`Wizualizacja prototypu innowacji: ${currentIdea.title}`}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover overlay with button */}
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-stone-900 text-xs font-semibold shadow-md">
                    <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Powiększ zdjęcie</span>
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div className="shrink-0 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs rounded-2xl border border-white/50">
              <GeometricIllustration shape={shape} theme={theme} size={120} />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#1C1E23] border-b border-stone-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
          {/* Like / Dislike */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => vote(currentIdea.id, "like")}
              aria-label={`Polub pomysł (${currentIdea.likes} polubień)`}
              className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentIdea.userVote === "like"
                ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950"
                : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200"
                }`}
            >
              <ThumbsUp
                aria-hidden="true"
                className={`w-4 h-4 ${currentIdea.userVote === "like" ? "fill-current" : ""}`}
              />
              <span>{currentIdea.likes}</span>
            </button>

            <button
              type="button"
              onClick={() => vote(currentIdea.id, "dislike")}
              aria-label={`Nie podoba mi się (${currentIdea.dislikes} ocen)`}
              className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${currentIdea.userVote === "dislike"
                ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900"
                : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-700 dark:text-stone-300"
                }`}
            >
              <ThumbsDown
                aria-hidden="true"
                className={`w-4 h-4 ${currentIdea.userVote === "dislike" ? "fill-current" : ""}`}
              />
              <span>{currentIdea.dislikes}</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canUserDeleteIdea(currentIdea, currentUser) && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                title={
                  isUserAdmin(currentUser) && currentUser?.email !== currentIdea.authorEmail
                    ? "Usuń tę propozycję (uprawnienia Administratora)"
                    : "Usuń swoją propozycję"
                }
                aria-label="Usuń tę propozycję"
                className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                <span>
                  {isUserAdmin(currentUser) && currentUser?.email !== currentIdea.authorEmail
                    ? "Usuń propozycję (Admin)"
                    : "Usuń swoją propozycję"}
                </span>
              </button>
            )}

            <button
              onClick={async () => {
                if (!currentUser) {
                  router.push(
                    `/auth?redirect=${encodeURIComponent(`/discover/${currentIdea.id}`)}`,
                  );
                  return;
                }
                setIsOpeningChat(true);
                try {
                  const conv = await startExpertConversation({
                    idea_id: currentIdea.id,
                    idea_title: currentIdea.title,
                    topic: `Konsultacja pomysłu: ${currentIdea.title}`,
                    initial_message: `Dzień dobry, chciałbym skonsultować pomysł „${currentIdea.title}” w obszarze: ${currentIdea.category}.`,
                  });
                  router.push(`/chat?recipient=${encodeURIComponent(conv.id)}`);
                } catch (err) {
                  console.warn("Błąd startExpertConversation:", err);
                  router.push(
                    `/chat?topic=${encodeURIComponent(`Konsultacja: ${currentIdea.title}`)}`,
                  );
                } finally {
                  setIsOpeningChat(false);
                }
              }}
              disabled={isOpeningChat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-white/10 hover:bg-stone-50 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {isOpeningChat ? (
                <RefreshCw className="w-4 h-4 animate-spin text-stone-500" />
              ) : (
                <MessageSquare className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              )}
              <span>Zapytaj eksperta</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("test-panel");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${isTester
                ? "bg-emerald-700 text-white"
                : "bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-950"
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Opis pomysłu
            </h2>
            <p className="text-stone-800 text-base leading-relaxed whitespace-pre-line">
              {currentIdea.description}
            </p>
          </div>

          {currentIdea.targetAudience && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Dla kogo
              </p>
              <p className="text-sm font-semibold text-stone-900">
                {currentIdea.targetAudience}
              </p>
            </div>
          )}

          {currentIdea.keyBenefits && currentIdea.keyBenefits.length > 0 && (
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
                Kluczowe korzyści
              </p>
              <div className="flex flex-wrap gap-2">
                {currentIdea.keyBenefits.map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-medium text-stone-700"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lightbox / Pełny podgląd zdjęcia */}
      {isImageModalOpen && currentIdea.visualMockupUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImageModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-stone-900/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {currentIdea.title}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Wizualizacja AI • {currentIdea.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={currentIdea.visualMockupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-xs inline-flex items-center gap-1.5 font-medium"
                  title="Otwórz oryginalny plik w nowej karcie"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Nowe okno</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  aria-label="Zamknij podgląd zdjęcia"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 bg-stone-950/60 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentIdea.visualMockupUrl}
                alt={`Powiększona wizualizacja prototypu innowacji: ${currentIdea.title}`}
                className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-stone-900 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-400">
              <span className="italic">
                Autor pomysłu: <strong className="text-stone-200">{currentIdea.authorName}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer self-end sm:self-auto"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Moduł IV: Tester innowacji - Usability rating, feedback & comments */}
      <div id="test-panel">
        <InnovationTestPanel
          ideaId={currentIdea.id}
          ideaTitle={currentIdea.title}
          currentUser={currentUser}
          isTester={isTester}
          onToggleTesting={toggleTesting}
        />
      </div>

      {/* Modal potwierdzenia usunięcia propozycji */}
      <DeleteIdeaModal
        idea={currentIdea}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        currentUser={currentUser}
        onConfirm={async (idea) => {
          await deleteIdea(idea.id);
          router.push("/discover");
        }}
      />
    </div>
  );
}
