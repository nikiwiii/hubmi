"use client";

import React, { useState, useMemo } from "react";
import { IdeaCard } from "../components/shared/IdeaCard";
import { CustomSelect, SelectOption } from "../components/shared/CustomSelect";
import { Search, Plus, X, TrendingUp, Users, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";

const CATEGORIES = [
  "Wszystkie",
  "Dom i Ogród",
  "Zdrowie",
  "Społeczność",
  "Podróże",
  "Rzemiosło",
  "Praca",
];

const SORT_OPTIONS: SelectOption<"popular" | "testers" | "newest">[] = [
  {
    value: "popular",
    label: "Najpopularniejsze",
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  {
    value: "testers",
    label: "Najwięcej testerów",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    value: "newest",
    label: "Najnowsze",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
];

function IdeaCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/4 min-h-75 animate-pulse p-6 flex flex-col gap-4">
      <div className="h-3 w-20 bg-stone-200 rounded-full" />
      <div className="h-6 w-3/4 bg-stone-200 rounded-xl" />
      <div className="h-3 w-1/2 bg-stone-100 rounded-full" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-stone-100" />
      </div>
      <div className="pt-2 border-t border-stone-100 flex gap-2">
        <div className="h-7 flex-1 bg-stone-100 rounded-xl" />
        <div className="h-7 flex-1 bg-stone-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const {
    ideas,
    currentUser,
    selectIdea,
    vote,
    toggleTesting,
    navigate,
    isLoadingIdeas,
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "testers">(
    "popular",
  );

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        const matchesQuery =
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === "Wszystkie" ||
          idea.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase().slice(0, 4));

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return b.likes - a.likes;
        if (sortBy === "testers") return b.testersCount - a.testersCount;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [ideas, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Hero Section matching photo aesthetics (Subtle & Restrained) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Odkrywaj Pomysły</span>
            <span className="block text-stone-300">Inspiruj Zmiany</span>
          </div>
        </div>

        <button
          onClick={() => navigate("propose")}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Zaproponuj pomysł</span>
        </button>
      </div>

      {/* Minimal Search Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-2xs border border-black/4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj pomysłów..."
            className="w-full pl-10 pr-8 py-2 text-base font-medium text-stone-900 placeholder:text-stone-400 rounded-xl focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Grid of Idea Cards — Skeleton during loading */}
      {isLoadingIdeas ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <IdeaCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200">
          <p className="text-base font-semibold text-stone-800">Brak wyników</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Wszystkie");
            }}
            className="mt-3 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium"
          >
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => {
            const isUserTester = currentUser
              ? idea.testersList.includes(currentUser.email)
              : false;
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isTester={isUserTester}
                onClick={() => selectIdea(idea)}
                onVote={(e) => {
                  e.stopPropagation();
                  vote(idea.id, "like");
                }}
                onToggleTesting={(e) => {
                  e.stopPropagation();
                  toggleTesting(idea.id);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
