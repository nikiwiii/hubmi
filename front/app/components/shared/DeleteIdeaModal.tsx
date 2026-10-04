"use client";

import React, { useEffect, useState } from "react";
import { Idea, User } from "../../lib/types";
import { isUserAdmin, isUserIdeaAuthor } from "../../lib/ideasStore";
import {
  Trash2,
  X,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from "lucide-react";

interface DeleteIdeaModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idea: Idea) => Promise<void> | void;
  currentUser: User | null;
}

export const DeleteIdeaModal: React.FC<DeleteIdeaModalProps> = ({
  idea,
  isOpen,
  onClose,
  onConfirm,
  currentUser,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !idea) return null;

  const isAdmin = isUserAdmin(currentUser);
  const isAuthor = isUserIdeaAuthor(idea, currentUser);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(idea);
      onClose();
    } catch (err) {
      console.error("Błąd podczas usuwania propozycji:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-idea-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => !isDeleting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1E23] border border-stone-200/90 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 z-10 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/70 dark:border-rose-900/40">
              <Trash2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                  Potwierdzenie usunięcia
                </span>
                {isAdmin && !isAuthor ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40">
                    <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    Panel Administratora
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/40">
                    <UserCheck className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                    Twoja propozycja
                  </span>
                )}
              </div>
              <h3
                id="delete-idea-title"
                className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-1"
              >
                Czy na pewno chcesz usunąć tę propozycję?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Zamknij okno potwierdzenia"
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Informative text about permissions and impact */}
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          {isAdmin && !isAuthor ? (
            <>
              Działasz z uprawnieniami <strong>Administratora platformy</strong>.
              Posiadasz uprawnienia do usunięcia propozycji zgłoszonej przez
              innego użytkownika. Ta operacja jest trwała i usunie projekt ze
              wszystkich katalogów.
            </>
          ) : (
            <>
              Jako <strong>autor</strong> masz pełne prawo do wycofania swojej
              propozycji. Po usunięciu projekt zniknie z bazy platformy MiNNO i
              nie będzie już widoczny dla testerów ani ekspertów.
            </>
          )}
        </p>

        {/* Selected Idea Preview Box */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200/80 dark:border-white/10 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Kategoria: {idea.category}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Autor: <strong className="text-stone-800 dark:text-stone-200">{idea.authorName}</strong>
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-snug">
            {idea.title}
          </h4>
          {idea.subtitle && (
            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-1">
              {idea.subtitle}
            </p>
          )}
        </div>

        {/* Warning callout */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <span>Operacji tej nie można cofnąć. Wszystkie powiązane głosy i zgłoszenia testerów zostaną skasowane.</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="min-h-[38px] px-4 py-2 rounded-xl border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-h-[38px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Usuwanie...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Usuń trwale propozycję</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
