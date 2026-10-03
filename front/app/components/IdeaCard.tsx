import React from 'react';
import { Idea, ColorTheme } from '../lib/types';
import { GeometricIllustration } from './GeometricIllustration';
import { ThumbsUp, Users, Sparkles } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
  onVote?: (e: React.MouseEvent) => void;
  onToggleTesting?: (e: React.MouseEvent) => void;
  isTester?: boolean;
}

export const getThemeStyles = (theme: ColorTheme) => {
  switch (theme) {
    case 'yellow':
      return {
        bg: 'bg-[#F5E85A]',
        text: 'text-stone-900',
        subtext: 'text-stone-700',
        badge: 'bg-stone-900/10 text-stone-900',
        border: 'border-yellow-300'
      };
    case 'slate':
      return {
        bg: 'bg-[#A4A79D]',
        text: 'text-stone-900',
        subtext: 'text-stone-700',
        badge: 'bg-stone-900/10 text-stone-900',
        border: 'border-stone-400'
      };
    case 'lavender':
      return {
        bg: 'bg-[#A4B3F6]',
        text: 'text-indigo-950',
        subtext: 'text-indigo-800',
        badge: 'bg-indigo-950/10 text-indigo-950',
        border: 'border-indigo-300'
      };
    case 'sage':
      return {
        bg: 'bg-[#98C5AE]',
        text: 'text-emerald-950',
        subtext: 'text-emerald-800',
        badge: 'bg-emerald-950/10 text-emerald-950',
        border: 'border-emerald-300'
      };
    case 'lilac':
      return {
        bg: 'bg-[#C58BFA]',
        text: 'text-purple-950',
        subtext: 'text-purple-900',
        badge: 'bg-purple-950/10 text-purple-950',
        border: 'border-purple-300'
      };
    case 'pink':
      return {
        bg: 'bg-[#FCA5C2]',
        text: 'text-rose-950',
        subtext: 'text-rose-900',
        badge: 'bg-rose-950/10 text-rose-950',
        border: 'border-rose-300'
      };
    case 'cyan':
    default:
      return {
        bg: 'bg-[#7DD3FC]',
        text: 'text-sky-950',
        subtext: 'text-sky-900',
        badge: 'bg-sky-950/10 text-sky-950',
        border: 'border-sky-300'
      };
  }
};

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onClick,
  onVote,
  onToggleTesting,
  isTester = false
}) => {
  const styles = getThemeStyles(idea.colorTheme);

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[32px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer ${styles.bg} min-h-[290px] border border-black/5 select-none`}
    >
      {/* Top Header */}
      <div className="z-10 flex flex-col space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${styles.badge}`}>
            {idea.category}
          </span>
          {isTester && (
            <span className="flex items-center gap-1 text-xs font-bold bg-white text-stone-900 px-2.5 py-1 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
              Tester
            </span>
          )}
        </div>
        
        <h3 className={`text-2xl font-black leading-tight tracking-tight mt-1 ${styles.text}`}>
          {idea.title}
        </h3>
        
        <p className={`text-sm font-medium line-clamp-2 ${styles.subtext}`}>
          {idea.subtitle}
        </p>
      </div>

      {/* Center Geometric Illustration */}
      <div className="my-auto flex items-center justify-center py-2 transition-transform duration-500 group-hover:scale-105">
        <GeometricIllustration
          shape={idea.geometricShape}
          theme={idea.colorTheme}
          size={110}
        />
      </div>

      {/* Bottom Footer with Author and Stats */}
      <div className="z-10 mt-auto flex items-end justify-between pt-3 border-t border-black/10">
        <div>
          <p className={`text-xs uppercase tracking-wider font-semibold opacity-75 ${styles.subtext}`}>
            Autor
          </p>
          <p className={`text-sm font-bold ${styles.text}`}>
            {idea.authorName}
          </p>
        </div>

        {/* Action Counters */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onVote && (
            <button
              onClick={onVote}
              title="Polub ten pomysł"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                idea.userVote === 'like'
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-stone-900'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${idea.userVote === 'like' ? 'fill-white' : ''}`} />
              <span>{idea.likes}</span>
            </button>
          )}

          {onToggleTesting && (
            <button
              onClick={onToggleTesting}
              title={isTester ? 'Jesteś na liście testerów' : 'Zapisz się na testy'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isTester
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{idea.testersCount}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
