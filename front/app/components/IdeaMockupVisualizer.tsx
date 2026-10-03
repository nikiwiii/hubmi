import React from 'react';
import { ColorTheme, ShapeType } from '../lib/types';
import { GeometricIllustration } from './GeometricIllustration';
import { Sparkles, CheckCircle2, Share2, Smartphone } from 'lucide-react';

interface IdeaMockupVisualizerProps {
  title: string;
  subtitle: string;
  theme: ColorTheme;
  shape: ShapeType;
  category: string;
  keyBenefits: string[];
  targetAudience: string;
}

export const IdeaMockupVisualizer: React.FC<IdeaMockupVisualizerProps> = ({
  title,
  subtitle,
  theme,
  shape,
  category,
  keyBenefits,
  targetAudience
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-100 to-stone-200 rounded-[36px] border border-stone-300 shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Wizualizacja wygenerowana przez AI
        </span>
        <span className="text-xs text-stone-500 font-medium">Model: Hubmi Vision 2.0</span>
      </div>

      {/* Realistic Smartphone Frame (as in user reference photo) */}
      <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-[#0E1118] rounded-[48px] p-3 shadow-2xl border-4 border-stone-800">
        {/* Dynamic Island / Speaker cutout */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950/60" />
        </div>

        {/* Screen Content */}
        <div className="relative w-full h-full bg-[#F4F4F0] rounded-[38px] overflow-hidden flex flex-col p-5 pt-10 select-none">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 mb-4 px-1">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-2 border border-stone-800 rounded-sm"></span>
            </div>
          </div>

          {/* Editorial Headline inside Phone */}
          <div className="mb-4">
            <h4 className="text-2xl font-black tracking-tight text-stone-900 leading-[1.05]">
              {title.split(' ').slice(0, 2).join(' ')}
            </h4>
            <p className="text-xl font-bold tracking-tight text-stone-400 leading-[1.05]">
              {title.split(' ').slice(2).join(' ') || 'Proste Rozwiązanie'}
            </p>
          </div>

          {/* Main Visual Card Mockup (matching reference photo) */}
          <div className="flex-1 rounded-[28px] bg-white p-4 shadow-sm border border-stone-200 flex flex-col justify-between overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {category}
              </span>
              <p className="text-xs font-semibold text-stone-800 line-clamp-2 mt-1">
                {subtitle}
              </p>
            </div>

            {/* Geometric illustration */}
            <div className="flex items-center justify-center my-auto py-2">
              <GeometricIllustration
                shape={shape}
                theme={theme}
                size={85}
              />
            </div>

            {/* Micro Feature highlights */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                Główne ułatwienie:
              </div>
              <p className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{keyBenefits[0] || 'Prosty interfejs dla 40+'}</span>
              </p>
            </div>
          </div>

          {/* Large Senior-friendly action button */}
          <div className="mt-3">
            <button className="w-full py-2.5 px-3 bg-stone-900 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5">
              <span>Zacznij korzystać</span>
            </button>
          </div>

          {/* Phone Home Bar */}
          <div className="w-24 h-1 bg-stone-400 rounded-full mx-auto mt-3"></div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-stone-600 font-medium">
          Dedykowana grupa odbiorców: <strong className="text-stone-900">{targetAudience}</strong>
        </p>
      </div>
    </div>
  );
};
