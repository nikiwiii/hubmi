"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IdeaCard } from "../components/shared/IdeaCard";
import { DeleteIdeaModal } from "../components/shared/DeleteIdeaModal";
import { GrantCallsPanel } from "../components/grants/GrantCallsPanel";
import { Lightbulb, Users, Plus, RefreshCw, LogOut, Shield, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Idea } from "../lib/types";

export default function DashboardPage() {
  const {
    currentUser,
    setCurrentUser,
    ideas,
    selectIdea,
    openChatWithAuthor,
    navigate,
    isLargeFont,
    toggleFontSize,
    deleteIdea,
    isLoadingUser,
  } = useApp();
  const router = useRouter();

  const [deleteModalIdea, setDeleteModalIdea] = useState<Idea | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, isLoadingUser, router]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/auth");
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Wczytywanie profilu...</span>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const user = currentUser;

  const myCreatedIdeas = ideas.filter(
    (i) =>
      i.authorEmail.toLowerCase() === user.email.toLowerCase() ||
      i.authorId === user.id,
  );

  const myTestingIdeas = ideas.filter((i) =>
    i.testersList.includes(user.email),
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Powiadomienie o usunięciu propozycji */}
      {deleteNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-[#1C1E23] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-stone-800 shrink-0"
            style={{ backgroundColor: user.avatarBg || '#A4B3F6' }}
          >
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900 dark:text-white leading-tight">
                {user.name || user.email || 'Użytkownik'}
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === "admin" && (
            <button
              type="button"
              onClick={() => navigate("admin")}
              aria-label="Przejdź do panelu administratora"
              className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-2 bg-[#EFE5C6] dark:bg-amber-400/20 hover:bg-[#E7DAC0] dark:hover:bg-amber-400/30 text-stone-900 dark:text-amber-200 border border-stone-300/80 dark:border-amber-400/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Przejdź do panelu administratora"
            >
              <Shield className="w-3.5 h-3.5 text-stone-800 dark:text-amber-300" aria-hidden="true" />
              <span>Panel Admina</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("propose")}
            aria-label="Zaproponuj nowy pomysł"
            className="min-h-[38px] flex items-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nowy pomysł</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Wyloguj się z profilu"
            title="Wyloguj się z serwisu MiNNO"
            className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-300 border border-stone-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-800/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 group-hover:text-red-600" aria-hidden="true" />
            <span>Wyloguj</span>
          </button>
        </div>
      </div>

      {/* Accessibility Font Toggle Bar */}
      <div className="bg-stone-50 dark:bg-white/5 rounded-2xl px-5 py-3 border border-stone-200/60 dark:border-white/10 flex items-center justify-between text-xs">
        <span className="font-semibold text-stone-800 dark:text-stone-200">
          Wielkość czcionki w aplikacji (WCAG):
        </span>
        <button
          type="button"
          onClick={toggleFontSize}
          aria-label={isLargeFont ? "Zmień na czcionkę standardową" : "Włącz powiększoną czcionkę (A+)"}
          aria-pressed={isLargeFont}
          className="min-h-[34px] px-3.5 py-1.5 bg-white dark:bg-white/10 border border-stone-300 dark:border-white/15 rounded-lg text-xs font-bold text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/20 cursor-pointer shadow-2xs transition-colors"
        >
          {isLargeFont ? "Powiększona (A+)" : "Standardowa (A)"}
        </button>
      </div>

      {/* SECTION 1: MY CREATED IDEAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span>Moje Pomysły ({myCreatedIdeas.length})</span>
          </h2>
        </div>

        <GrantCallsPanel myIdeas={myCreatedIdeas} />

        {myCreatedIdeas.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-6 border border-stone-200 dark:border-white/10 text-center text-xs text-stone-500 dark:text-stone-400">
            Brak zgłoszonych pomysłów.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myCreatedIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => selectIdea(idea)}
                isTester={idea.testersList.includes(user.email)}
                onDelete={(target) => setDeleteModalIdea(target)}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MY TESTING PARTICIPATIONS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
          <Users className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          <span>Moje Testy ({myTestingIdeas.length})</span>
        </h2>

        {myTestingIdeas.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-6 border border-stone-200 dark:border-white/10 text-center text-xs text-stone-500 dark:text-stone-400">
            Nie bierzesz udziału w żadnych testach.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myTestingIdeas.map((idea) => (
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
                onDelete={(target) => setDeleteModalIdea(target)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Logout Action Bar */}
      <div className="pt-6 border-t border-stone-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Wyloguj się z platformy"
          className="min-h-[40px] flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-red-700 dark:text-rose-300 border border-red-300 dark:border-rose-900/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Wyloguj się</span>
        </button>
      </div>

      {/* Modal potwierdzenia usunięcia propozycji */}
      <DeleteIdeaModal
        idea={deleteModalIdea}
        isOpen={Boolean(deleteModalIdea)}
        onClose={() => setDeleteModalIdea(null)}
        currentUser={currentUser}
        onConfirm={async (idea) => {
          await deleteIdea(idea.id);
          setDeleteNotice(`Pomyślnie usunięto propozycję „${idea.title}”.`);
          setTimeout(() => setDeleteNotice(null), 4000);
        }}
      />
    </div>
  );
}
