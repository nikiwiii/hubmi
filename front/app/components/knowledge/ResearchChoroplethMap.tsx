'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  RAW_SVG_PATHS,
  POWIATY_DATA,
  PATH_TO_POWIAT_MAP,
  SUBREGIONS,
  PowiatItem
} from '../../lib/malopolskaMapData';
import {
  ResearchInfo,
  getYearPowiatValues,
  interpolateColor,
  formatResearchValue
} from '../../lib/researchData';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
  MapPin,
  X
} from 'lucide-react';

interface ResearchChoroplethMapProps {
  research: ResearchInfo;
  selectedYear: string;
  onSelectYear: (year: string) => void;
  selectedPowiatId: string | null;
  onSelectPowiat: (powiatId: string | null) => void;
}

export const ResearchChoroplethMap: React.FC<ResearchChoroplethMapProps> = ({
  research,
  selectedYear,
  onSelectYear,
  selectedPowiatId,
  onSelectPowiat
}) => {
  const [hoveredPowiatId, setHoveredPowiatId] = useState<string | null>(null);
  const [activeSubregion, setActiveSubregion] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pobierz dane dla wybranego roku
  const yearValues = useMemo(() => {
    return getYearPowiatValues(research.id, selectedYear);
  }, [research.id, selectedYear]);

  // Wartości min, max i średnia dla danego roku
  const stats = useMemo(() => {
    if (yearValues.length === 0) return { min: 0, max: 100, avg: 0 };
    const numbers = yearValues.map((v) => v.value);
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const avg = Number((numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2));
    return { min, max, avg };
  }, [yearValues]);

  // Obsługa autoodtwarzania w czasie
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const curIdx = research.years.indexOf(selectedYear);
        const nextIdx = (curIdx + 1) % research.years.length;
        onSelectYear(research.years[nextIdx]);
      }, 1400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedYear, research.years, onSelectYear]);

  // Wartość i dane dla najechanego powiatu
  const hoveredValueItem = useMemo(() => {
    if (!hoveredPowiatId) return null;
    return yearValues.find((v) => v.powiatId === hoveredPowiatId) || null;
  }, [hoveredPowiatId, yearValues]);

  // Wartość i dane dla zaznaczonego powiatu
  const selectedValueItem = useMemo(() => {
    if (!selectedPowiatId) return null;
    return yearValues.find((v) => v.powiatId === selectedPowiatId) || null;
  }, [selectedPowiatId, yearValues]);

  // Obliczenie koloru ścieżki
  const getPathStyle = (pathIdx: number) => {
    const powiat = PATH_TO_POWIAT_MAP[pathIdx];
    if (!powiat) return { fill: '#F1F5F9', stroke: '#E2E8F0', opacity: 0.5 };

    const isSelected = selectedPowiatId === powiat.id;
    const isHovered = hoveredPowiatId === powiat.id;
    const isDimmed = activeSubregion !== 'all' && powiat.subregionKey !== activeSubregion;

    const valItem = yearValues.find((v) => v.powiatId === powiat.id);
    const val = valItem ? valItem.value : stats.min;

    const baseColor = interpolateColor(val, stats.min, stats.max, research.theme.colorScale);

    if (isSelected) {
      return {
        fill: '#1c1917', // stone-900 wyróżnienie
        stroke: '#ffffff',
        strokeWidth: 2,
        opacity: 1
      };
    }

    if (isHovered) {
      return {
        fill: research.theme.accent,
        stroke: '#ffffff',
        strokeWidth: 2,
        opacity: 1
      };
    }

    if (isDimmed) {
      return {
        fill: '#E2E8F0',
        stroke: '#CBD5E1',
        strokeWidth: 0.6,
        opacity: 0.35
      };
    }

    return {
      fill: baseColor,
      stroke: '#FFFFFF',
      strokeWidth: 1.1,
      opacity: 0.95
    };
  };

  const handleNextYear = () => {
    const idx = research.years.indexOf(selectedYear);
    if (idx < research.years.length - 1) {
      onSelectYear(research.years[idx + 1]);
    }
  };

  const handlePrevYear = () => {
    const idx = research.years.indexOf(selectedYear);
    if (idx > 0) {
      onSelectYear(research.years[idx - 1]);
    }
  };

  return (
    <div className="bg-white rounded-[28px] border border-black/5 shadow-2xs overflow-hidden">
      {/* Header paska mapy */}
      <div className="px-5 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: research.theme.accent }} />
            <h3 className="text-base font-bold text-stone-900">
              Województwo Małopolskie
            </h3>
          </div>
        </div>

        {/* Wskaźnik wybranego powiatu */}
        {selectedPowiatId && selectedValueItem && (
          <div className="flex items-center gap-2 bg-stone-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs">
            <span>Wybrano: {selectedValueItem.powiatName}</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
              {formatResearchValue(selectedValueItem.value)} {research.unit}
            </span>
            <button
              onClick={() => onSelectPowiat(null)}
              className="text-stone-400 hover:text-white ml-1 cursor-pointer"
              title="Wyczyść zaznaczenie"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
        {/* Kontroler osi czasu / Year Scrubber */}
        <div className="bg-stone-50 rounded-2xl p-3 sm:p-4 border border-stone-200/70 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Przycisk Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${isPlaying
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-white" />
                    <span>Zatrzymaj animację</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    <span>Odtwórz w czasie</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevYear}
                  disabled={selectedYear === research.years[0]}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Poprzedni rok"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextYear}
                  disabled={selectedYear === research.years[research.years.length - 1]}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Następny rok"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Licznik aktywnego roku i średnia */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500 hidden sm:inline">
                Średnia Małopolski ({selectedYear}):{' '}
                <strong className="text-stone-900 font-bold">
                  {formatResearchValue(stats.avg)} {research.unit}
                </strong>
              </span>
            </div>
          </div>

          {/* Przyciski lat */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {research.years.map((year) => {
              const isCurrent = year === selectedYear;
              return (
                <button
                  key={year}
                  onClick={() => onSelectYear(year)}
                  className={`flex-1 min-w-[58px] py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${isCurrent
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs scale-102'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtr subregionów */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUBREGIONS.map((sub) => {
              const isActive = activeSubregion === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubregion(sub.key)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border ${isActive
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200/80'
                    }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-stone-500 font-medium">
            Kliknij powiat na mapie, aby przeanalizować jego wykres
          </div>
        </div>

        {/* Kontener Mapy SVG */}
        <div className="relative bg-stone-50/70 rounded-2xl p-4 sm:p-8 border border-stone-200/70 flex flex-col items-center justify-center min-h-[380px] overflow-hidden">
          <div className="relative w-full max-w-2xl aspect-[315/211.134]">
            <svg
              role="img"
              aria-label={`Interaktywna mapa choropletowa powiatów województwa małopolskiego: ${research.titlePl} za rok ${selectedYear}`}
              viewBox="0 0 315 211.13402"
              className="w-full h-full drop-shadow-sm select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
              }}
              onMouseLeave={() => {
                setHoveredPowiatId(null);
                setMousePos(null);
              }}
            >
              <defs>
                <filter id="choropleth-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
                </filter>
                <filter id="choropleth-selected-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
                </filter>
              </defs>

              <g>
                {RAW_SVG_PATHS.map((pathD, idx) => {
                  const powiat = PATH_TO_POWIAT_MAP[idx];
                  const style = getPathStyle(idx);
                  const isHovered = powiat && hoveredPowiatId === powiat.id;
                  const isSelected = powiat && selectedPowiatId === powiat.id;

                  return (
                    <path
                      key={idx}
                      d={pathD}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={style.opacity}
                      className="transition-colors duration-150 cursor-pointer"
                      filter={
                        isSelected
                          ? 'url(#choropleth-selected-glow)'
                          : isHovered
                            ? 'url(#choropleth-hover-glow)'
                            : undefined
                      }
                      onMouseEnter={() => {
                        if (powiat) setHoveredPowiatId(powiat.id);
                      }}
                      onClick={() => {
                        if (powiat) {
                          onSelectPowiat(selectedPowiatId === powiat.id ? null : powiat.id);
                        }
                      }}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Tooltip przy najechaniu myszką */}
            {hoveredPowiatId && hoveredValueItem && (
              <div className="absolute top-3 left-3 bg-stone-900/95 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-2xl shadow-xl pointer-events-none z-20 border border-white/10 text-xs space-y-1 animate-in fade-in duration-150">
                <div className="font-bold text-sm text-stone-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{hoveredValueItem.powiatName}</span>
                </div>
                <div className="text-[11px] text-stone-300">
                  Siedziba: {hoveredValueItem.seat} • {hoveredValueItem.subregion}
                </div>
                <div className="pt-1 flex items-baseline gap-2 border-t border-white/10">
                  <span className="text-amber-400 text-base font-extrabold">
                    {formatResearchValue(hoveredValueItem.value)} {research.unit}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    w roku {selectedYear}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Legenda skali barwnej */}
          <div className="mt-4 w-full max-w-md bg-white/90 backdrop-blur-2xs p-3 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600">
              <span>Min: {formatResearchValue(stats.min)} {research.unit}</span>
              <span className="text-stone-400">Śr: {formatResearchValue(stats.avg)} {research.unit}</span>
              <span>Max: {formatResearchValue(stats.max)} {research.unit}</span>
            </div>
            <div
              className="h-3 rounded-full w-full shadow-inner border border-stone-200/40"
              style={{
                background: `linear-gradient(to right, ${research.theme.colorScale[0]}, ${research.theme.colorScale[1]}, ${research.theme.colorScale[2]})`
              }}
            />
            <div className="text-center text-[10px] text-stone-400 font-medium">
              Skala natężenia wskaźnika dla Małopolski w {selectedYear} r.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
