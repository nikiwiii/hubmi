import React from 'react';
import { Idea, ColorTheme } from '../lib/types';
import { GeometricIllustration } from './GeometricIllustration';
import { ThumbsUp, Users, Check } from 'lucide-react';

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
        bg: 'bg-[#EFE5C6]',
        text: 'text-[#2A271E]',
        subtext: 'text-[#5C5543]',
        badge: 'bg-black/5 text-[#2A271E]',
        border: 'border-[#DFD3AE]'
      };
    case 'slate':
      return {
        bg: 'bg-[#D7D8D1]',
        text: 'text-[#242522]',
        subtext: 'text-[#565752]',
        badge: 'bg-black/5 text-[#242522]',
        border: 'border-[#C6C7BD]'
      };
    case 'lavender':
      return {
        bg: 'bg-[#D2D8EE]',
        text: 'text-[#1D2235]',
        subtext: 'text-[#4A5270]',
        badge: 'bg-black/5 text-[#1D2235]',
        border: 'border-[#C1C9E4]'
      };
    case 'sage':
      return {
        bg: 'bg-[#CAD7CE]',
        text: 'text-[#1B271F]',
        subtext: 'text-[#435548]',
        badge: 'bg-black/5 text-[#1B271F]',
        border: 'border-[#B6C7BA]'
      };
    case 'lilac':
      return {
        bg: 'bg-[#DCD0E6]',
        text: 'text-[#291D33]',
        subtext: 'text-[#554563]',
        badge: 'bg-black/5 text-[#291D33]',
        border: 'border-[#CCBCDB]'
      };
    case 'pink':
      return {
        bg: 'bg-[#EAD4D9]',
        text: 'text-[#311E22]',
        subtext: 'text-[#64474D]',
        badge: 'bg-black/5 text-[#311E22]',
        border: 'border-[#DFC1C8]'
      };
    case 'cyan':
    default:
      return {
        bg: 'bg-[#CEE0E6]',
        text: 'text-[#1A282E]',
        subtext: 'text-[#425861]',
        badge: 'bg-black/5 text-[#1A282E]',
        border: 'border-[#B9D2DB]'
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${styles.bg} min-h-[280px] border border-black/[0.04] select-none`}
    >
      {/* Top Header */}
      <div className="z-10 flex flex-col space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${styles.badge}`}>
            {idea.category}
          </span>
          {isTester && (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-white/90 text-stone-800 px-2 py-0.5 rounded-full shadow-2xs">
              <Check className="w-3 h-3 text-emerald-600" />
              Tester
            </span>
          )}
        </div>
        
        <h3 className={`text-xl font-bold leading-snug tracking-tight mt-1 ${styles.text}`}>
          {idea.title}
        </h3>
        
        <p className={`text-xs font-medium line-clamp-1 ${styles.subtext}`}>
          {idea.subtitle}
        </p>
      </div>

      {/* Center Geometric Illustration */}
      <div className="my-auto flex items-center justify-center py-2 transition-transform duration-300 group-hover:scale-103">
        <GeometricIllustration
          shape={idea.geometricShape}
          theme={idea.colorTheme}
          size={100}
        />
      </div>

      {/* Bottom Footer with Author and Stats */}
      <div className="z-10 mt-auto flex items-center justify-between pt-3 border-t border-black/[0.06]">
        <p className={`text-xs font-bold ${styles.text}`}>
          {idea.authorName}
        </p>

        {/* Minimal Action Counters (no labels, just clean icons + numbers) */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onVote && (
            <button
              onClick={onVote}
              title="Polub"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                idea.userVote === 'like'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white/70 hover:bg-white text-stone-800'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${idea.userVote === 'like' ? 'fill-white' : ''}`} />
              <span>{idea.likes}</span>
            </button>
          )}

          {onToggleTesting && (
            <button
              onClick={onToggleTesting}
              title="Testerzy"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isTester
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white/70 hover:bg-white text-stone-800'
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
