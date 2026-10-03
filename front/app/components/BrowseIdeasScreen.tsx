import React, { useState } from 'react';
import { Idea, User, ScreenId } from '../lib/types';
import { GeometricIllustration } from './GeometricIllustration';
import { getThemeStyles } from './IdeaCard';
import {
  ThumbsUp,
  ThumbsDown,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Share2,
  Send,
  UserCheck
} from 'lucide-react';

interface BrowseIdeasScreenProps {
  ideas: Idea[];
  selectedIdeaId: string | null;
  currentUser: User | null;
  onVote: (id: string, type: 'like' | 'dislike') => void;
  onToggleTesting: (id: string) => void;
  onSelectIdea: (idea: Idea) => void;
  onOpenChatWithAuthor: (authorId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const BrowseIdeasScreen: React.FC<BrowseIdeasScreenProps> = ({
  ideas,
  selectedIdeaId,
  currentUser,
  onVote,
  onToggleTesting,
  onSelectIdea,
  onOpenChatWithAuthor,
  onNavigate
}) => {
  const currentIndex = ideas.findIndex(i => i.id === selectedIdeaId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentIdea = ideas[activeIndex] || ideas[0];

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; date: string }>>([
    {
      id: 'c1',
      author: 'Tadeusz M. (52 l.)',
      text: 'Bardzo podoba mi się to podejście! Szczególnie brak zbędnych ikonek i czytelne litery.',
      date: 'Wczoraj'
    },
    {
      id: 'c2',
      author: 'Barbara W. (46 l.)',
      text: 'Zgłosiłam się do testów. Chętnie sprawdzę wersję próbną w praktyce.',
      date: 'Dzisiaj, 09:40'
    }
  ]);

  if (!currentIdea) {
    return (
      <div className="py-12 text-center">
        <p className="text-xl font-bold">Brak pomysłów do wyświetlenia.</p>
      </div>
    );
  }

  const isTester = currentUser ? currentIdea.testersList.includes(currentUser.email) : false;
  const styles = getThemeStyles(currentIdea.colorTheme);

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + ideas.length) % ideas.length;
    onSelectIdea(ideas[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % ideas.length;
    onSelectIdea(ideas[nextIdx]);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser?.name || 'Gość Społeczności',
      text: commentText.trim(),
      date: 'Przed chwilą'
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Ekran Przeglądania i Oceny Pomysłów
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
            Oceniaj i Zostań Testerem
          </h1>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-bold text-stone-500 mr-2">
            {activeIndex + 1} z {ideas.length}
          </span>
          <button
            onClick={handlePrev}
            title="Poprzedni pomysł"
            className="p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 transition-colors shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            title="Następny pomysł"
            className="p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 transition-colors shadow-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Focus Card Container */}
      <div className="bg-white rounded-[36px] border border-stone-200 shadow-xl overflow-hidden">
        {/* Top Hero Banner matching photo color styling */}
        <div className={`p-6 sm:p-10 ${styles.bg} border-b border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full ${styles.badge}`}>
                {currentIdea.category}
              </span>
              <span className="text-xs font-bold text-stone-800/80">
                Dodano: {currentIdea.createdAt}
              </span>
            </div>

            <h2 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${styles.text}`}>
              {currentIdea.title}
            </h2>

            <p className={`text-lg sm:text-xl font-semibold ${styles.subtext}`}>
              {currentIdea.subtitle}
            </p>
          </div>

          {/* Geometric Art Motif */}
          <div className="shrink-0 flex items-center justify-center p-4 bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm">
            <GeometricIllustration
              shape={currentIdea.geometricShape}
              theme={currentIdea.colorTheme}
              size={130}
            />
          </div>
        </div>

        {/* Voting & Beta-Testing Action Bar (Crucial requirement) */}
        <div className="p-6 sm:p-8 bg-stone-50 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Like / Dislike Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onVote(currentIdea.id, 'like')}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-bold transition-all shadow-sm cursor-pointer ${
                currentIdea.userVote === 'like'
                  ? 'bg-stone-900 text-white ring-4 ring-stone-300'
                  : 'bg-white hover:bg-stone-100 text-stone-900 border border-stone-200'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${currentIdea.userVote === 'like' ? 'fill-white' : ''}`} />
              <span>Głosuję na TAK ({currentIdea.likes})</span>
            </button>

            <button
              onClick={() => onVote(currentIdea.id, 'dislike')}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-bold transition-all shadow-sm cursor-pointer ${
                currentIdea.userVote === 'dislike'
                  ? 'bg-rose-700 text-white ring-4 ring-rose-200'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <ThumbsDown className={`w-5 h-5 ${currentIdea.userVote === 'dislike' ? 'fill-white' : ''}`} />
              <span>Nie przekonuje mnie ({currentIdea.dislikes})</span>
            </button>
          </div>

          {/* Beta-Testing Sign-up Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onToggleTesting(currentIdea.id)}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black transition-all shadow-md cursor-pointer ${
                isTester
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-200'
                  : 'bg-[#F5E85A] hover:bg-[#ebd947] text-stone-900'
              }`}
            >
              {isTester ? (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>Jesteś na liście testerów! (Zrezygnuj)</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-stone-900" />
                  <span>Chcę brać udział w testach pomysłu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Content */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Author Badge & Chat Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-stone-100/70 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-lg">
                {currentIdea.authorName.charAt(0)}
              </div>
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-stone-500">Autor pomysłu</p>
                <p className="text-base font-bold text-stone-900">{currentIdea.authorName}</p>
                <p className="text-xs text-stone-600">{currentIdea.authorEmail}</p>
              </div>
            </div>

            <button
              onClick={() => onOpenChatWithAuthor(currentIdea.authorId)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-stone-700" />
              <span>Napisz do autora na czacie</span>
            </button>
          </div>

          {/* Description & Problem Solving */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-stone-900">
              O czym dokładnie jest ten projekt?
            </h3>
            <p className="text-lg text-stone-700 font-medium leading-relaxed">
              {currentIdea.description}
            </p>
          </div>

          {/* Target Audience & Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Dla kogo powstało to rozwiązanie:
              </h4>
              <p className="text-base font-semibold text-stone-900">
                {currentIdea.targetAudience}
              </p>
            </div>

            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Główne ułatwienia w codziennym życiu:
              </h4>
              <ul className="space-y-2">
                {currentIdea.keyBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-stone-900 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Comments and Opinions Section */}
          <div className="pt-8 border-t border-stone-200 space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-stone-700" />
              <h3 className="text-2xl font-black text-stone-900">
                Opinie społeczności i testerów ({comments.length})
              </h3>
            </div>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Napisz swoją opinię lub sugestię do tego pomysłu..."
                className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Wyślij opinię</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-bold text-stone-900 text-sm">{c.author}</span>
                    <span>{c.date}</span>
                  </div>
                  <p className="text-stone-800 text-sm font-medium">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
