import React from "react";
import { ColorTheme, ShapeType } from "../../lib/types";
import { GeometricIllustration } from "../shared/GeometricIllustration";
import { Check } from "lucide-react";

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
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E8F0FA] via-[#F3F7FC] to-[#FAFBFD] dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
      {/* Phone Screen Mockup Preview */}
      <div className="relative w-full max-w-70 aspect-9/18 bg-stone-900 rounded-[42px] p-2.5 shadow-xl border border-stone-800">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20" />

        {/* Screen Content */}
        <div className="relative w-full h-full bg-gradient-to-b from-[#F7FAFD] to-[#EDF3FA] dark:bg-[#1C1E23] rounded-[34px] overflow-hidden flex flex-col p-4 pt-8 select-none">
          <div className="mb-3">
            <h4 className="text-xl font-bold tracking-tight text-stone-900 leading-tight">
              {title.split(" ").slice(0, 2).join(" ")}
            </h4>
            <p className="text-base font-semibold tracking-tight text-stone-400 leading-tight">
              {title.split(" ").slice(2).join(" ") || "Rozwiązanie"}
            </p>
          </div>

          <div className="flex-1 rounded-2xl bg-white p-3 shadow-2xs border border-stone-200/60 flex flex-col justify-between overflow-hidden">
            <div className="space-y-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {category}
              </span>
              <p className="text-xs font-semibold text-stone-800 line-clamp-2 mt-1">
                {subtitle}
              </p>
            </div>

            <div className="flex items-center justify-center my-auto py-2">
              <GeometricIllustration shape={shape} theme={theme} size={75} />
            </div>

            <div className="pt-2 border-t border-stone-100">
              <p className="text-[11px] font-medium text-stone-700 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {keyBenefits[0] || "Prosty interfejs"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3">
            <button className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold">
              Rozpocznij
            </button>
          </div>

          <div className="w-20 h-1 bg-stone-400 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </div>
  );
};
