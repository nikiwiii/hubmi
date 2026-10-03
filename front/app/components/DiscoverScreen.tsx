import React, { useState, useMemo } from 'react';
import { Idea, ScreenId, User } from '../lib/types';
import { IdeaCard } from './IdeaCard';
import { Search, SlidersHorizontal, PlusCircle, Sparkles, Filter, X } from 'lucide-react';

interface DiscoverScreenProps {
  ideas: Idea[];
  currentUser: User | null;
  onSelectIdea: (idea: Idea) => void;
  onVote: (id: string, type: 'like' | 'dislike') => void;
  onToggleTesting: (id: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

const CATEGORIES = [
  'Wszystkie',
  'Dom i Ogród',
  'Zdrowie & Bezpieczeństwo',
  'Społeczność & Rozwój',
  'Podróże & Pasje',
  'Rzemiosło & Pasje',
  'Praca & Biznes'
];

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  ideas,
  currentUser,
  onSelectIdea,
  onVote,
  onToggleTesting,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'testers'>('popular');

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        const matchesQuery =
          idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'Wszystkie' || idea.category.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, 5));

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return b.likes - a.likes;
        if (sortBy === 'testers') return b.testersCount - a.testersCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [ideas, searchQuery, selectedCategory, sortBy]);

  const totalLikes = ideas.reduce((acc, i) => acc + i.likes, 0);
  const totalTesters = ideas.reduce((acc, i) => acc + i.testersCount, 0);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Top Hero Section matching photo aesthetics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div>
          {/* Editorial Swiss Typography from photo */}
          <div className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.92] select-none">
            <span className="block text-stone-900">Odkrywaj</span>
            <span className="block text-stone-900">Pomysły</span>
            <span className="block text-stone-300">Inspiruj</span>
            <span className="block text-stone-300">Zmiany</span>
          </div>

          <p className="mt-4 text-stone-600 text-lg sm:text-xl font-medium max-w-lg leading-relaxed">
            Społeczność dojrzałych twórców. Przeglądaj, opiniuj i decyduj, które inicjatywy wejdą w życie.
          </p>
        </div>

        {/* Quick action button to propose new idea */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => onNavigate('propose')}
            className="flex items-center justify-center gap-2.5 px-6 py-4 bg-stone-900 text-white rounded-2xl text-base font-bold shadow-lg hover:bg-stone-800 transition-all hover:scale-102 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#F5E85A]" />
            <span>Zaproponuj Pomysł z AI</span>
          </button>
        </div>
      </div>

      {/* Prominent Search Bar (Optimized for 40+ usability) */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border border-stone-200">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-6 h-6 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj pomysłów... (np. ogród, leki, podróże, majsterkowanie)"
            className="w-full pl-13 pr-10 py-3.5 text-lg sm:text-xl font-medium text-stone-900 placeholder:text-stone-400 rounded-2xl focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Horizontal Category Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Sortuj:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:outline-none cursor-pointer"
          >
            <option value="popular">Najpopularniejsze</option>
            <option value="testers">Najwięcej testerów</option>
            <option value="newest">Najnowsze</option>
          </select>
        </div>
      </div>

      {/* Counter bar (reminiscent of the superscripts 993, 712 in photo) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-sm text-stone-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="font-bold text-stone-900">
            Wyniki: <span className="text-stone-500 font-normal">{filteredIdeas.length} pomysłów</span>
          </span>
          <span className="hidden sm:inline-block text-stone-300">•</span>
          <span className="hidden sm:inline-block">
            Łącznie głosów: <strong className="text-stone-800">{totalLikes}</strong>
          </span>
          <span className="hidden sm:inline-block text-stone-300">•</span>
          <span className="hidden sm:inline-block">
            Zgłoszonych testerów: <strong className="text-stone-800">{totalTesters}</strong>
          </span>
        </div>
        <span className="text-xs text-stone-400">
          Kliknij kafelek, aby poznać szczegóły
        </span>
      </div>

      {/* Grid of Idea Cards (Photo-inspired aesthetic) */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <p className="text-xl font-bold text-stone-800">Nie znaleziono pomysłów spełniających kryteria.</p>
          <p className="text-stone-500 mt-2">Spróbuj wpisać inne słowo kluczowe lub wybierz kategorię &quot;Wszystkie&quot;.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('Wszystkie'); }}
            className="mt-4 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold"
          >
            Zresetuj filtry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map((idea) => {
            const isUserTester = currentUser ? idea.testersList.includes(currentUser.email) : false;
            return (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isTester={isUserTester}
                onClick={() => onSelectIdea(idea)}
                onVote={(e) => {
                  e.stopPropagation();
                  onVote(idea.id, 'like');
                }}
                onToggleTesting={(e) => {
                  e.stopPropagation();
                  onToggleTesting(idea.id);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
