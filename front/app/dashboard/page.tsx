"use client";

import React from "react";
import { IdeaCard } from "../components/shared/IdeaCard";
import { Lightbulb, Users, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function DashboardPage() {
  const {
    currentUser,
    ideas,
    selectIdea,
    openChatWithAuthor,
    navigate,
    isLargeFont,
    toggleFontSize,
  } = useApp();

  const user = currentUser || {
    id: "user-anna-2",
    name: "Anna Kowalska",
    email: "anna.kowalska@hubmi.pl",
    role: "creator" as const,
    avatarBg: "#D2D8EE",
    createdAt: "2026-02-10",
    status: "active" as const,
    bio: "Twórczyni projektów.",
  };

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
            style={{ backgroundColor: user.avatarBg }}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900 leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                  openChatWithAuthor(idea.authorId);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
