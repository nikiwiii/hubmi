"use client";

import React, { useState, useMemo } from "react";
import {
  RAW_SVG_PATHS,
  POWIATY_DATA,
  SUBREGIONS,
  SUBREGION_PALETTE,
  PowiatItem,
  PATH_TO_POWIAT_MAP,
  PopulationMetricKey,
  POPULATION_METRICS_OPTIONS,
  getPowiatDemographics,
  DemographicData,
} from "../../lib/malopolskaMapData";
import {
  MapPin,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Search,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle2,
  Building2,
  Users,
  Activity,
  HeartHandshake,
  ArrowUpRight
} from "lucide-react";
import { ScreenId } from "../../lib/types";

interface MalopolskaMapProps {
  onSelectPowiat?: (powiat: PowiatItem | null) => void;
  onNavigate?: (screen: ScreenId) => void;
  onApplySearch?: (query: string) => void;
}

type MapColorMode = "subregions" | "demographics" | "challenges";

export const MalopolskaMap: React.FC<MalopolskaMapProps> = ({
  onSelectPowiat,
  onNavigate,
  onApplySearch,
}) => {
  const [selectedPowiatId, setSelectedPowiatId] = useState<string | null>(null);
  const [hoveredPowiatId, setHoveredPowiatId] = useState<string | null>(null);
  const [activeSubregion, setActiveSubregion] = useState<string>("all");
  const [colorMode, setColorMode] = useState<MapColorMode>("demographics");
  const [selectedPopulationMetric, setSelectedPopulationMetric] = useState<PopulationMetricKey>("age60Plus");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const selectedPowiat = useMemo(() => {
    return POWIATY_DATA.find((p) => p.id === selectedPowiatId) || null;
  }, [selectedPowiatId]);

  const hoveredPowiat = useMemo(() => {
    return POWIATY_DATA.find((p) => p.id === hoveredPowiatId) || null;
  }, [hoveredPowiatId]);

  const currentMetricOption = useMemo(() => {
    return (
      POPULATION_METRICS_OPTIONS.find((m) => m.key === selectedPopulationMetric) ||
      POPULATION_METRICS_OPTIONS[0]
    );
  }, [selectedPopulationMetric]);

  const handlePowiatClick = (powiat: PowiatItem) => {
    if (selectedPowiatId === powiat.id) {
      setSelectedPowiatId(null);
      if (onSelectPowiat) onSelectPowiat(null);
    } else {
      setSelectedPowiatId(powiat.id);
      if (onSelectPowiat) onSelectPowiat(powiat);
    }
  };

  const handleSubregionClick = (key: string) => {
    setActiveSubregion(key);
    // If active county does not belong to selected subregion, clear county selection
    if (
      key !== "all" &&
      selectedPowiat &&
      selectedPowiat.subregionKey !== key
    ) {
      setSelectedPowiatId(null);
      if (onSelectPowiat) onSelectPowiat(null);
    }
  };

  // Helper to extract demographic metric value
  const getMetricValue = (demo: DemographicData, metric: PopulationMetricKey): number => {
    switch (metric) {
      case "age60Plus":
        return demo.age60PlusRatio;
      case "age75Plus":
        return demo.age75PlusRatio;
      case "age40to59":
        return demo.age40to59Ratio;
      case "agingIndex":
        return demo.agingIndex;
      case "singleSenior":
        return demo.singleSeniorRatio;
      default:
        return demo.age60PlusRatio;
    }
  };

  // Helper to format metric value with unit
  const formatMetricDisplay = (demo: DemographicData, metric: PopulationMetricKey): string => {
    const val = getMetricValue(demo, metric);
    if (metric === "agingIndex") {
      return `${val} os./100 dzieci`;
    }
    return `${val.toFixed(1).replace(".", ",")}%`;
  };

  // Helper to determine path fill color
  const getPathColor = (pIdx: number) => {
    const powiat = PATH_TO_POWIAT_MAP[pIdx];
    if (!powiat) return { fill: "#F1F5F9", stroke: "#CBD5E1" };

    const isSelected = selectedPowiatId === powiat.id;
    const isHovered = hoveredPowiatId === powiat.id;
    const isDimmed =
      activeSubregion !== "all" && powiat.subregionKey !== activeSubregion;

    if (isSelected) {
      return {
        fill: "#1c1917", // stone-900
        stroke: "#ffffff",
        strokeWidth: 1.5,
        opacity: 1,
      };
    }

    if (isHovered) {
      return {
        fill: "#0f766e", // teal-700
        stroke: "#ffffff",
        strokeWidth: 1.5,
        opacity: 1,
      };
    }

    if (isDimmed) {
      return {
        fill: "#F1F5F9",
        stroke: "#E2E8F0",
        strokeWidth: 0.8,
        opacity: 0.4,
      };
    }

    if (colorMode === "demographics") {
      const demo = getPowiatDemographics(powiat.id);
      const val = getMetricValue(demo, selectedPopulationMetric);

      if (selectedPopulationMetric === "age60Plus") {
        if (val >= 27.0) return { fill: "#FECDD3", stroke: "#FDA4AF", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 25.0) return { fill: "#FED7AA", stroke: "#FDBA74", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 23.0) return { fill: "#FEF08A", stroke: "#FDE047", strokeWidth: 0.9, opacity: 0.95 };
        return { fill: "#D1FAE5", stroke: "#86EFAC", strokeWidth: 0.9, opacity: 0.95 };
      }

      if (selectedPopulationMetric === "age75Plus") {
        if (val >= 9.8) return { fill: "#FECDD3", stroke: "#FDA4AF", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 8.8) return { fill: "#FED7AA", stroke: "#FDBA74", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 7.8) return { fill: "#FEF08A", stroke: "#FDE047", strokeWidth: 0.9, opacity: 0.95 };
        return { fill: "#D1FAE5", stroke: "#86EFAC", strokeWidth: 0.9, opacity: 0.95 };
      }

      if (selectedPopulationMetric === "age40to59") {
        if (val >= 28.8) return { fill: "#DDD6FE", stroke: "#C4B5FD", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 27.8) return { fill: "#EDE9FE", stroke: "#DDD6FE", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 26.8) return { fill: "#E0E7FF", stroke: "#C7D2FE", strokeWidth: 0.9, opacity: 0.95 };
        return { fill: "#F1F5F9", stroke: "#CBD5E1", strokeWidth: 0.9, opacity: 0.95 };
      }

      if (selectedPopulationMetric === "agingIndex") {
        if (val >= 150) return { fill: "#FECDD3", stroke: "#FDA4AF", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 130) return { fill: "#FED7AA", stroke: "#FDBA74", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 110) return { fill: "#FEF08A", stroke: "#FDE047", strokeWidth: 0.9, opacity: 0.95 };
        return { fill: "#D1FAE5", stroke: "#86EFAC", strokeWidth: 0.9, opacity: 0.95 };
      }

      if (selectedPopulationMetric === "singleSenior") {
        if (val >= 34.0) return { fill: "#FECDD3", stroke: "#FDA4AF", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 30.0) return { fill: "#FED7AA", stroke: "#FDBA74", strokeWidth: 0.9, opacity: 0.95 };
        if (val >= 26.0) return { fill: "#FEF08A", stroke: "#FDE047", strokeWidth: 0.9, opacity: 0.95 };
        return { fill: "#D1FAE5", stroke: "#86EFAC", strokeWidth: 0.9, opacity: 0.95 };
      }
    }

    if (colorMode === "challenges") {
      if (powiat.challenges >= 8)
        return {
          fill: "#FDE68A",
          stroke: "#FCD34D",
          strokeWidth: 0.9,
          opacity: 0.95,
        };
      if (powiat.challenges >= 6)
        return {
          fill: "#E0E7FF",
          stroke: "#C7D2FE",
          strokeWidth: 0.9,
          opacity: 0.95,
        };
      return {
        fill: "#E2E8F0",
        stroke: "#CBD5E1",
        strokeWidth: 0.9,
        opacity: 0.95,
      };
    }

    // Default: subregions palette
    const pal = SUBREGION_PALETTE[powiat.subregionKey];
    if (powiat.isCity) {
      // Cities have slightly accented fill
      return {
        fill: "#38bdf8", // sky-400
        stroke: "#ffffff",
        strokeWidth: 1.2,
        opacity: 1,
      };
    }

    return {
      fill: pal?.fill || "#E2E8F0",
      stroke: "#ffffff",
      strokeWidth: 0.9,
      opacity: 0.95,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden transition-all duration-300">
      {/* Top Banner Bar */}
      <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-stone-100 flex items-center justify-between gap-3 bg-linear-to-r from-stone-50/80 via-white to-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <MapPin className="w-4.5 h-4.5 text-amber-300" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">
              Województwo Małopolskie – Mapa Wyzwań
            </h2>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-stone-100 text-stone-700 rounded-full border border-stone-200/60">
              22 powiaty
            </span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            title={isExpanded ? "Zwiń mapę" : "Rozwiń mapę"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Subregion Filter Pills & Legend Bar (directly above map) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            {/* Subregion pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SUBREGIONS.map((sub) => {
                const isActive = activeSubregion === sub.key;
                return (
                  <button
                    key={sub.key}
                    onClick={() => handleSubregionClick(sub.key)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                        : "bg-white text-stone-600 hover:bg-stone-50 border-stone-200/80 hover:text-stone-900"
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {sub.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Map Legend & Reset Button */}
            <div className="flex items-center gap-3 shrink-0 text-[11px] font-medium text-stone-500 self-end sm:self-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
                <span>Miasta</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-400 inline-block"></span>
                <span>Wyższy wskaźnik</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-400 inline-block"></span>
                <span>Niższy wskaźnik</span>
              </span>
              {selectedPowiat && (
                <button
                  onClick={() => {
                    setSelectedPowiatId(null);
                    if (onSelectPowiat) onSelectPowiat(null);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Odznacz</span>
                </button>
              )}
            </div>
          </div>

          {/* The Map Display - Spacious, centered, clean */}
          <div className="bg-stone-50/70 rounded-2xl p-4 sm:p-6 border border-stone-200/60 relative flex flex-col items-center justify-center min-h-[340px] overflow-hidden">
            <div className="relative w-full max-w-2xl aspect-[315/211.134]">
              <svg
                viewBox="0 0 315 211.13402"
                className="w-full h-full drop-shadow-sm select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => {
                  setHoveredPowiatId(null);
                  setMousePos(null);
                }}
              >
                <defs>
                  <filter
                    id="map-glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="2.5"
                      floodColor="#0f766e"
                      floodOpacity="0.4"
                    />
                  </filter>
                  <filter
                    id="map-selected-glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="3"
                      stdDeviation="3"
                      floodColor="#000000"
                      floodOpacity="0.35"
                    />
                  </filter>
                </defs>

                <g>
                  {RAW_SVG_PATHS.map((pathD, idx) => {
                    const powiat = PATH_TO_POWIAT_MAP[idx];
                    const style = getPathColor(idx);
                    const isHovered = powiat && hoveredPowiatId === powiat.id;
                    const isSelected =
                      powiat && selectedPowiatId === powiat.id;

                    return (
                      <path
                        key={idx}
                        d={pathD}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth || 1}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={style.opacity}
                        className="transition-colors duration-150 cursor-pointer"
                        filter={
                          isSelected
                            ? "url(#map-selected-glow)"
                            : isHovered
                              ? "url(#map-glow)"
                              : undefined
                        }
                        onMouseEnter={() => {
                          if (powiat) setHoveredPowiatId(powiat.id);
                        }}
                        onClick={() => {
                          if (powiat) handlePowiatClick(powiat);
                        }}
                      />
                    );
                  })}

                  {/* Regional City Keypoints Labels */}
                  <g
                    pointerEvents="none"
                    className="select-none font-sans font-bold"
                  >
                    {/* Kraków */}
                    <circle
                      cx="108.5"
                      cy="69.0"
                      r="2.5"
                      fill="#ffffff"
                      stroke="#1c1917"
                      strokeWidth="1"
                    />
                    <text
                      x="108.5"
                      y="64.5"
                      textAnchor="middle"
                      fontSize="6"
                      fill="#1c1917"
                      fontWeight="bold"
                    >
                      Kraków
                    </text>

                    {/* Tarnów */}
                    <circle
                      cx="191.5"
                      cy="75.5"
                      r="2"
                      fill="#ffffff"
                      stroke="#1c1917"
                      strokeWidth="1"
                    />
                    <text
                      x="191.5"
                      y="72"
                      textAnchor="middle"
                      fontSize="5.5"
                      fill="#1c1917"
                      fontWeight="bold"
                    >
                      Tarnów
                    </text>

                    {/* Nowy Sącz */}
                    <circle
                      cx="164.9"
                      cy="141.9"
                      r="2"
                      fill="#ffffff"
                      stroke="#1c1917"
                      strokeWidth="1"
                    />
                    <text
                      x="164.9"
                      y="138"
                      textAnchor="middle"
                      fontSize="5.5"
                      fill="#1c1917"
                      fontWeight="bold"
                    >
                      Nowy Sącz
                    </text>
                  </g>
                </g>
              </svg>

              {/* Floating Tooltip */}
              {hoveredPowiat && mousePos && !selectedPowiat && (
                <div
                  className="absolute pointer-events-none z-20 px-3 py-2 bg-stone-900/95 backdrop-blur-md text-white rounded-xl shadow-lg border border-white/10 text-xs transform -translate-x-1/2 -translate-y-full -mt-2 transition-all duration-75"
                  style={{
                    left: Math.max(90, Math.min(mousePos.x, 560)),
                    top: Math.max(30, mousePos.y),
                  }}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{hoveredPowiat.name}</span>
                    {hoveredPowiat.isCity && (
                      <span className="px-1.5 py-0.2 bg-sky-500 text-[9px] rounded font-semibold text-white">
                        Miasto
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-300">
                    {hoveredPowiat.subregion}
                  </div>

                  {(() => {
                    const demo = getPowiatDemographics(hoveredPowiat.id);
                    return (
                      <div className="mt-1 pt-1 border-t border-stone-800 flex items-center justify-between gap-3 text-[10px]">
                        <span className="text-stone-400">
                          {currentMetricOption.badgeLabel}:
                        </span>
                        <strong className="text-amber-300 font-bold">
                          {formatMetricDisplay(demo, selectedPopulationMetric)}
                        </strong>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* STATISTICS & DIAGNOSIS SECTION - PLACED DIRECTLY UNDER THE MAP */}
          <div className="bg-stone-50/90 rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-4">
            {/* Age Group / Demographic Metric Selector (PLACED DIRECTLY ON TOP OF STATISTICS) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Wybór grupy wiekowej:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {POPULATION_METRICS_OPTIONS.map((metric) => {
                  const isSelected = selectedPopulationMetric === metric.key && colorMode === "demographics";
                  return (
                    <button
                      key={metric.key}
                      onClick={() => {
                        setSelectedPopulationMetric(metric.key);
                        setColorMode("demographics");
                      }}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-stone-900 text-white border-stone-900 shadow-2xs ring-2 ring-stone-900/10"
                          : "bg-white text-stone-700 border-stone-200/90 hover:bg-stone-100 hover:border-stone-300"
                      }`}
                    >
                      <span className="text-xs font-bold line-clamp-1">
                        {metric.label.split("(")[0]}
                      </span>
                      <span
                        className={`text-[11px] font-medium mt-0.5 ${
                          isSelected ? "text-amber-300" : "text-stone-500"
                        }`}
                      >
                        śr. {metric.avgRegional}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedPowiat ? (
              /* SELECTED POWIAT VIEW */
              (() => {
                const demo = getPowiatDemographics(selectedPowiat.id);
                const selectedVal = getMetricValue(demo, selectedPopulationMetric);
                const regionalAvgNum = parseFloat(
                  currentMetricOption.avgRegional.replace(",", ".").replace("%", "").replace(" os./100 dzieci", "")
                );
                const diffFromAvg = selectedVal - regionalAvgNum;
                const diffText =
                  selectedPopulationMetric === "agingIndex"
                    ? `${diffFromAvg >= 0 ? "+" : ""}${Math.round(diffFromAvg)} os. wzgl. średniej`
                    : `${diffFromAvg >= 0 ? "+" : ""}${diffFromAvg.toFixed(1).replace(".", ",")} p.p. wzgl. średniej`;

                return (
                  <div className="space-y-3 pt-3 border-t border-stone-200/80 animate-in fade-in duration-150">
                    {/* Header bar for selected county */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-stone-900">
                            {selectedPowiat.name}
                          </h3>
                          {selectedPowiat.isCity && (
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-md">
                              Miasto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 font-medium">
                          Siedziba: {selectedPowiat.seat} • {selectedPowiat.subregion}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onApplySearch && (
                          <button
                            onClick={() =>
                              onApplySearch(selectedPowiat.name.replace("Powiat ", ""))
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Filtruj zasobnik</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPowiatId(null);
                            if (onSelectPowiat) onSelectPowiat(null);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cała Małopolska</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Clean Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-3xs">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          {currentMetricOption.badgeLabel}
                        </span>
                        <div className="text-xl font-extrabold text-stone-900 my-0.5">
                          {formatMetricDisplay(demo, selectedPopulationMetric)}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block ${
                            diffFromAvg > 0
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {diffText}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-3xs">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Mieszkańcy
                        </span>
                        <div className="text-xl font-extrabold text-stone-900 my-0.5">
                          {demo.totalPopulation.toLocaleString("pl-PL")}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Populacja ogółem
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-3xs">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Seniorzy 75+
                        </span>
                        <div className="text-xl font-extrabold text-stone-900 my-0.5">
                          {demo.age75PlusRatio.toFixed(1).replace(".", ",")}%
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Wiek sędziwy
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-3xs">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Pilność wsparcia
                        </span>
                        <div className="text-xl font-extrabold text-stone-900 capitalize my-0.5">
                          {demo.careUrgency}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          Samotni 60+: {demo.singleSeniorRatio.toFixed(1).replace(".", ",")}%
                        </span>
                      </div>
                    </div>

                    {/* Diagnosis & Innovation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-3xs space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                          <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                          <span>Główne wyzwanie społeczne</span>
                        </div>
                        <p className="text-xs text-stone-700 font-medium leading-relaxed">
                          {selectedPowiat.mainChallenge}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-3xs space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Innowacja społeczna ROPS</span>
                        </div>
                        <p className="text-xs text-stone-700 font-medium leading-relaxed">
                          {selectedPowiat.bestPractice}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* REGIONAL OVERVIEW & TOP 5 (WHEN NO COUNTY IS SELECTED) */
              <div className="space-y-3 pt-3 border-t border-stone-200/80">
                {/* 3 Regional Summary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-3xs">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                      Średnia regionu
                    </span>
                    <span className="text-xl font-extrabold text-stone-900 block mt-0.5">
                      {currentMetricOption.avgRegional}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-3xs">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                      Maksimum
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-rose-700">
                        {currentMetricOption.topCountyValue}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate">
                        {currentMetricOption.topCounty}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-3xs">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                      Minimum
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-emerald-700">
                        {currentMetricOption.lowCountyValue}
                      </span>
                      <span className="text-xs font-semibold text-stone-700 truncate">
                        {currentMetricOption.lowCounty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top 5 Interactive Ranking Cards */}
                <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-3xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Top 5 powiatów w regionie:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {POWIATY_DATA
                      .map((p) => {
                        const demo = getPowiatDemographics(p.id);
                        const val = getMetricValue(demo, selectedPopulationMetric);
                        return { powiat: p, demo, val };
                      })
                      .sort((a, b) => b.val - a.val)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <button
                          key={item.powiat.id}
                          onClick={() => handlePowiatClick(item.powiat)}
                          className="flex items-center justify-between sm:flex-col sm:items-start p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/70 transition-all text-left cursor-pointer group hover:border-stone-300"
                        >
                          <div className="flex items-center gap-1.5 w-full justify-between">
                            <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[9px]">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-extrabold text-stone-900 group-hover:text-amber-800 transition-colors">
                              {formatMetricDisplay(item.demo, selectedPopulationMetric)}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-stone-900 mt-1 line-clamp-1">
                            {item.powiat.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
