'use client';

import React, { useMemo } from 'react';
import {
  RAW_SVG_PATHS,
  PATH_TO_POWIAT_MAP,
  POWIATY_DATA
} from '../../lib/malopolskaMapData';
import {
  ResearchInfo,
  getYearPowiatValues,
  interpolateColor
} from '../../lib/researchData';
import { Calendar, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface AllYearsMapGalleryProps {
  research: ResearchInfo;
  selectedYear: string;
  onSelectYear: (year: string) => void;
}

export const AllYearsMapGallery: React.FC<AllYearsMapGalleryProps> = ({
  research,
  selectedYear,
  onSelectYear
}) => {
  // Przygotuj dane dla wszystkich lat naraz
  const yearsData = useMemo(() => {
    return research.years.map((year) => {
      const pValues = getYearPowiatValues(research.id, year);
      const numbers = pValues.map((p) => p.value);
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      const avg = Number((numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2));

      // Znajdź lidera i powiat z najniższym wynikiem
      const sorted = [...pValues].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const low = sorted[sorted.length - 1];

      return {
        year,
        values: pValues,
        min,
        max,
        avg,
        top,
        low
      };
    });
  }, [research]);

  return (
    <div className="bg-white rounded-[28px] border border-black/5 shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <span className="text-xs font-semibold text-stone-500">
          Kliknij rok, aby zaktualizować kartogram główny
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full">
          {research.years.length} lat
        </span>
      </div>

      {/* Grid map rocznych */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {yearsData.map((yData) => {
          const isSelected = yData.year === selectedYear;

          return (
            <div
              key={yData.year}
              onClick={() => onSelectYear(yData.year)}
              className={`group flex flex-col justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900 ring-offset-2'
                  : 'bg-stone-50/80 hover:bg-white text-stone-800 border-stone-200/70 hover:border-stone-400 hover:shadow-xs'
              }`}
            >
              {/* Górny pasek karty: Rok i wskaźnik aktywnego */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-sm font-extrabold tracking-tight">
                  {yData.year}
                </span>

                {isSelected ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-stone-900 px-1.5 py-0.2 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    Aktywny
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-semibold group-hover:text-stone-700">
                    Wybierz
                  </span>
                )}
              </div>

              {/* Mini mapa SVG dla tego roku */}
              <div className="aspect-[315/211.134] w-full my-1 relative">
                <svg
                  role="img"
                  aria-label={`Miniaturowa mapa powiatów Małopolski za rok ${yData.year}`}
                  viewBox="0 0 315 211.13402"
                  className="w-full h-full select-none"
                >
                  <g>
                    {RAW_SVG_PATHS.map((pathD, idx) => {
                      const powiat = PATH_TO_POWIAT_MAP[idx];
                      if (!powiat) return null;

                      const valItem = yData.values.find((v) => v.powiatId === powiat.id);
                      const val = valItem ? valItem.value : yData.min;

                      const fillColor = interpolateColor(
                        val,
                        yData.min,
                        yData.max,
                        research.theme.colorScale
                      );

                      return (
                        <path
                          key={idx}
                          d={pathD}
                          fill={fillColor}
                          stroke={isSelected ? '#1c1917' : '#FFFFFF'}
                          strokeWidth={0.8}
                          strokeLinejoin="round"
                        />
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Statystyki dla tego roku */}
              <div
                className={`mt-2 pt-2 border-t text-[11px] space-y-0.5 ${
                  isSelected ? 'border-white/10 text-stone-300' : 'border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] opacity-75">Średnia:</span>
                  <span className="font-bold">
                    {yData.avg} {research.unit}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[9px] opacity-80 truncate">
                  <span className="truncate">Top: {yData.top?.powiatName.replace('Powiat ', '')}</span>
                  <span className="font-semibold ml-1">{yData.top?.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
