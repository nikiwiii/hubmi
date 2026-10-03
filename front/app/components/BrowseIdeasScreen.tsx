import React, { useState } from 'react';
import { Idea, User, ScreenId, getCategoryThemeAndShape } from '../lib/types';
import { GeometricIllustration } from './GeometricIllustration';
import { getThemeStyles } from './IdeaCard';
import {
  ThumbsUp,
  ThumbsDown,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  Send
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
  onOpenChatWithAuthor
}) => {
  const currentIndex = ideas.findIndex(i => i.id === selectedIdeaId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentIdea = ideas[activeIndex] || ideas[0];

  // Collapsible states - hidden by default
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; date: string }>>([
    {
      id: 'c1',
      author: 'Tadeusz M.',
      text: 'Dobre, przejrzyste podejście. Zgłosiłem się na testy.',
      date: 'Wczoraj'
    },
    {
      id: 'c2',
      author: 'Barbara W.',
      text: 'Chętnie sprawdzę wersję próbną w praktyce.',
      date: '09:40'
    }
  ]);

  if (!currentIdea) {
    return (
      <div className="py-12 text-center text-stone-500 font-medium">
        Brak pomysłów do wyświetlenia.
      </div>
    );
  }

  const isTester = currentUser ? currentIdea.testersList.includes(currentUser.email) : false;
  // Category-driven theme and shape
  const { theme, shape } = getCategoryThemeAndShape(currentIdea.category);
  const styles = getThemeStyles(theme);

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
      author: currentUser?.name || 'Użytkownik',
      text: commentText.trim(),
      date: 'Teraz'
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Navigation Header (Clean, without redundant Back button) */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Pomysł {activeIndex + 1} z {ideas.length}
        </span>

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
      <div className="bg-white rounded-[32px] border border-black/[0.05] shadow-2xs overflow-hidden">
        {/* Banner with category-bound subtle color palette */}
        <div className={`p-6 sm:p-10 ${styles.bg} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="space-y-2 max-w-xl">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${styles.badge}`}>
              {currentIdea.category}
            </span>

            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${styles.text}`}>
              {currentIdea.title}
            </h2>

            <p className={`text-base font-medium ${styles.subtext}`}>
              {currentIdea.subtitle}
            </p>

            <p className={`text-xs font-semibold pt-1 ${styles.subtext}`}>
              Autor: {currentIdea.authorName}
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center p-4 bg-white/40 backdrop-blur-xs rounded-2xl border border-white/50">
            <GeometricIllustration
              shape={shape}
              theme={theme}
              size={120}
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 sm:p-8 bg-white border-b border-stone-100 flex flex-wrap items-center justify-between gap-4">
          {/* Like / Dislike (No labels, clean icons + numbers) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(currentIdea.id, 'like')}
              title="Polub"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentIdea.userVote === 'like'
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${currentIdea.userVote === 'like' ? 'fill-white' : ''}`} />
              <span>{currentIdea.likes}</span>
            </button>

            <button
              onClick={() => onVote(currentIdea.id, 'dislike')}
              title="Nie podoba mi się"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentIdea.userVote === 'dislike'
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${currentIdea.userVote === 'dislike' ? 'fill-white' : ''}`} />
              <span>{currentIdea.dislikes}</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChatWithAuthor(currentIdea.authorId)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-stone-500" />
              <span>Napisz do eksperta</span>
            </button>

            <button
              onClick={() => onToggleTesting(currentIdea.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isTester
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white'
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

        {/* Collapsible Sections (Hidden by default, reveal on click) */}
        <div className="divide-y divide-stone-100">
          {/* Section 1: Details & Description */}
          <div>
            <button
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              className="w-full px-6 sm:px-8 py-4 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-stone-800">
                {isDetailsExpanded ? 'Ukryj opis pomysłu' : 'Rozwiń opis pomysłu'}
              </span>
              {isDetailsExpanded ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {isDetailsExpanded && (
              <div className="px-6 sm:px-8 pb-6 pt-2 space-y-4 animate-in fade-in duration-200">
                <p className="text-stone-700 text-base leading-relaxed">
                  {currentIdea.description}
                </p>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Dla kogo
                  </p>
                  <p className="text-sm font-medium text-stone-800">
                    {currentIdea.targetAudience}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Opinions / Comments */}
          <div>
            <button
              onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
              className="w-full px-6 sm:px-8 py-4 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-stone-800">
                {isCommentsExpanded ? 'Ukryj opinie' : `Pokaż opinie (${comments.length})`}
              </span>
              {isCommentsExpanded ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {isCommentsExpanded && (
              <div className="px-6 sm:px-8 pb-6 pt-2 space-y-4 animate-in fade-in duration-200">
                {/* Add comment */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Wpisz krótką opinię..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-stone-800 focus:outline-none text-sm text-stone-800"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2.5 bg-stone-900 disabled:opacity-40 text-white rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 pt-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 bg-stone-50 rounded-xl space-y-0.5">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span className="font-semibold text-stone-700">{c.author}</span>
                        <span>{c.date}</span>
                      </div>
                      <p className="text-stone-800 text-sm">{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
