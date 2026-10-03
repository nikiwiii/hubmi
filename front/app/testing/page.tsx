"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Star,
  Users,
  Lightbulb,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronDown,
  Layers,
  HeartHandshake,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Idea } from "../lib/types";
import { InnovationTestPanel } from "../components/testing/InnovationTestPanel";
import { GeometricIllustration } from "../components/shared/GeometricIllustration";
import { getThemeStyles } from "../components/shared/IdeaCard";

export default function TestingPage() {
  const router = useRouter();
  const { ideas, currentUser, toggleTesting, isLoadingIdeas } = useApp();
  const isAdmin = currentUser?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "testing_only" | "my_tests">("all");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // Filtered list
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === "testing_only") {
        return idea.status === "testing" || idea.testersCount > 0;
      }

      if (selectedFilter === "my_tests") {
        return currentUser ? idea.testersList?.includes(currentUser.email) : false;
      }

      return true;
    });
  }, [ideas, searchQuery, selectedFilter, currentUser]);

  // Active selected idea for detailed testing
  const activeIdea = useMemo(() => {
    if (selectedIdeaId) {
      const found = ideas.find((i) => i.id === selectedIdeaId);
      if (found) return found;
    }
    return filteredIdeas.length > 0 ? filteredIdeas[0] : null;
  }, [selectedIdeaId, ideas, filteredIdeas]);

  const totalTestersCount = ideas.reduce((acc, i) => acc + (i.testersCount || 0), 0);
  const myTestingCount = currentUser
    ? ideas.filter((i) => i.testersList?.includes(currentUser.email)).length
    : 0;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4 text-stone-500 py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold text-stone-900">Dostęp zastrzeżony</h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Zakładka testerów oraz podgląd zgłoszonych osób i testowanych prototypów są dostępne wyłącznie dla administratorów platformy.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Wróć do strony głównej
        </button>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back to Admin Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Wróć do Panelu Admina</span>
        </button>
      </div>

      {/* Hero Banner: Tester Innowacji */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <FlaskConical className="w-3.5 h-3.5 text-amber-700" />
            <span>Moduł IV Wyzwania ROPS</span>
          </div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Tester Innowacji</span>
            <span className="block text-stone-300">Walidacja & Użyteczność</span>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm font-medium max-w-2xl pt-1">
            Testuj prototypy w mikroskali, oceniaj dostępność dla seniorów (WCAG), przekazuj ustrukturyzowany feedback i proponuj usprawnienia przed skalowaniem rozwiązań w Małopolsce.
          </p>
        </div>

        {/* Global Statistics Badges */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Projekty w testach
            </span>
            <span className="text-xl font-bold text-stone-900">
              {ideas.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Zgłoszenia testerów
            </span>
            <span className="text-xl font-bold text-emerald-700">
              {totalTestersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
              Moje testy
            </span>
            <span className="text-xl font-bold text-amber-600">
              {myTestingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj innowacji do przetestowania (np. seniorzy, dostępność, ogród)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === "all"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            Wszystkie ({ideas.length})
          </button>

          <button
            onClick={() => setSelectedFilter("testing_only")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === "testing_only"
                ? "bg-stone-900 text-white shadow-2xs"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            Faza testowa ({ideas.filter((i) => i.status === "testing" || i.testersCount > 0).length})
          </button>

          {currentUser && (
            <button
              onClick={() => setSelectedFilter("my_tests")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === "my_tests"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              Moje testy ({myTestingCount})
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Projects List / Right Active Test Panel */}
      <div className="space-y-6">
        {/* Horizontal projects selector carousel / strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Wybierz innowację do ewaluacji ({filteredIdeas.length})
            </h3>
            <span className="text-[11px] text-stone-400">
              Kliknij projekt, aby otworzyć panel oceniania
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredIdeas.map((idea) => {
              const isSelected = activeIdea?.id === idea.id;
              const isUserTester = currentUser
                ? idea.testersList?.includes(currentUser.email)
                : false;
              const styles = getThemeStyles(idea.colorTheme || "yellow");

              return (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none space-y-3 relative overflow-hidden ${
                    isSelected
                      ? "bg-white border-stone-900 shadow-md ring-2 ring-stone-900/10"
                      : "bg-white/80 hover:bg-white border-stone-200/80 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}
                    >
                      {idea.category}
                    </span>

                    {isUserTester && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Testujesz</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">
                      {idea.title}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">
                      {idea.summary || idea.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-1 text-stone-600 font-semibold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span>{idea.testersCount} testerów</span>
                    </div>

                    <span
                      className={`font-bold text-[11px] flex items-center gap-1 ${
                        isSelected ? "text-stone-900" : "text-stone-500"
                      }`}
                    >
                      <span>{isSelected ? "Wybrany" : "Oceń projekt"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Project Full Test & Feedback Center */}
        {activeIdea ? (
          <div className="pt-4">
            <InnovationTestPanel
              ideaId={activeIdea.id}
              ideaTitle={activeIdea.title}
              currentUser={currentUser}
              isTester={
                currentUser
                  ? Boolean(activeIdea.testersList?.includes(currentUser.email))
                  : false
              }
              onToggleTesting={toggleTesting}
            />
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
            <FlaskConical className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">
              Nie znaleziono innowacji spełniających kryteria
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Zmień zapytanie w wyszukiwarce lub przełącz filtr na &quot;Wszystkie&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
