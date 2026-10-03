"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IdeaCard } from "../components/shared/IdeaCard";
import { Lightbulb, Users, Plus, RefreshCw, LogOut, Shield } from "lucide-react";
import { useApp } from "../context/AppContext";

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
    isLoadingUser,
  } = useApp();
  const router = useRouter();

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
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-stone-800 shrink-0"
            style={{ backgroundColor: user.avatarBg || '#A4B3F6' }}
          >
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900 leading-tight">
                {user.name || user.email || 'Użytkownik'}
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === "admin" && (
            <button
              onClick={() => navigate("admin")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EFE5C6] hover:bg-[#E7DAC0] text-stone-900 border border-stone-300/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Przejdź do panelu administratora"
            >
              <Shield className="w-3.5 h-3.5 text-stone-800" />
              <span>Panel Admina</span>
            </button>
          )}

          <button
            onClick={() => navigate("propose")}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy pomysł</span>
          </button>
        </div>
      </div>

      {/* Accessibility Font Toggle Bar */}
      <div className="bg-stone-50 rounded-2xl px-5 py-3 border border-stone-200/60 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-700">
          Wielkość czcionki w aplikacji:
        </span>
        <button
          onClick={toggleFontSize}
          className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 hover:bg-stone-100 cursor-pointer"
        >
          {isLargeFont ? "Powiększona (A+)" : "Standardowa (A)"}
        </button>
      </div>

      {/* SECTION 1: MY CREATED IDEAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-stone-600" />
            <span>Moje Pomysły ({myCreatedIdeas.length})</span>
          </h2>
        </div>

        {myCreatedIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center text-xs text-stone-500">
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
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MY TESTING PARTICIPATIONS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-stone-600" />
          <span>Moje Testy ({myTestingIdeas.length})</span>
        </h2>

        {myTestingIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center text-xs text-stone-500">
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Logout Action Bar */}
      <div className="pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/70 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Wyloguj się</span>
        </button>
      </div>
    </div>
  );
}
