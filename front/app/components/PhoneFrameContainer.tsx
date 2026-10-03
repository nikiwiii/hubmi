import React from 'react';
import { Smartphone, Sparkles, X } from 'lucide-react';

interface PhoneFrameContainerProps {
  children: React.ReactNode;
  onCloseFrame: () => void;
  title?: string;
}

export const PhoneFrameContainer: React.FC<PhoneFrameContainerProps> = ({
  children,
  onCloseFrame,
  title = 'Podgląd w Stylu Mockupu ze Zdjęcia'
}) => {
  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-[#E9E9E5]">
      {/* Studio Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-900" />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">{title}</span>
        </div>
        <button
          onClick={onCloseFrame}
          className="text-xs font-bold text-stone-500 hover:text-stone-900 bg-white/70 hover:bg-white px-3 py-1 rounded-full shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Wyłącz ramkę telefonu</span>
        </button>
      </div>

      {/* Realistic Curved Smartphone Body */}
      <div className="relative w-full max-w-[420px] aspect-[9/19] bg-[#0E1118] rounded-[56px] p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border-4 border-stone-800 ring-1 ring-white/20">
        {/* Dynamic Island Cutout */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-40 flex items-center justify-between px-3">
          <div className="w-3 h-3 rounded-full bg-[#1A1A1A]" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950/60" />
        </div>

        {/* Screen Bezel & Content */}
        <div className="relative w-full h-full bg-[#F4F4F0] rounded-[44px] overflow-hidden flex flex-col pt-10 select-none">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 px-6 py-2 shrink-0">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">5G</span>
              <div className="w-4 h-2.5 border-2 border-stone-800 rounded-sm p-0.5 flex items-center">
                <div className="h-full w-full bg-stone-800 rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* Inner Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-none pb-12">
            {children}
          </div>

          {/* Bottom Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.2 bg-stone-900/60 rounded-full z-30 pointer-events-none" />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-stone-500 text-center max-w-sm">
        Interfejs zoptymalizowany pod kątem proporcji, wielkości liter i stref dotyku dla osób 40+.
      </p>
    </div>
  );
};
