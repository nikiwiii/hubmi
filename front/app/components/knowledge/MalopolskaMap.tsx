"use client";

import React, { useState, useMemo } from "react";
import {
  RAW_SVG_PATHS,
  POWIATY_DATA,
  SUBREGIONS,
  SUBREGION_PALETTE,
  PowiatItem,
  PATH_TO_POWIAT_MAP,
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
} from "lucide-react";
import { ScreenId } from "../../lib/types";

interface MalopolskaMapProps {
  onSelectPowiat?: (powiat: PowiatItem | null) => void;
  onNavigate?: (screen: ScreenId) => void;
  onApplySearch?: (query: string) => void;
}

type MapColorMode = "subregions" | "senior" | "challenges";

export const MalopolskaMap: React.FC<MalopolskaMapProps> = ({
  onSelectPowiat,
  onNavigate,
  onApplySearch,
}) => {
  const [selectedPowiatId, setSelectedPowiatId] = useState<string | null>(null);
  const [hoveredPowiatId, setHoveredPowiatId] = useState<string | null>(null);
  const [activeSubregion, setActiveSubregion] = useState<string>("all");
  const [colorMode, setColorMode] = useState<MapColorMode>("subregions");
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

    if (colorMode === "senior") {
      // Color by senior percentage
      const ratioNum = parseFloat(powiat.seniorRatio.replace(",", "."));
      if (ratioNum >= 27)
        return {
          fill: "#FECDD3",
          stroke: "#FDA4AF",
          strokeWidth: 0.9,
          opacity: 0.95,
        }; // Rose
      if (ratioNum >= 25)
        return {
          fill: "#FED7AA",
          stroke: "#FDBA74",
          strokeWidth: 0.9,
          opacity: 0.95,
        }; // Orange
      if (ratioNum >= 23)
        return {
          fill: "#FEF08A",
          stroke: "#FDE047",
          strokeWidth: 0.9,
          opacity: 0.95,
        }; // Yellow
      return {
        fill: "#D1FAE5",
        stroke: "#86EFAC",
        strokeWidth: 0.9,
        opacity: 0.95,
      }; // Green
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
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-linear-to-r from-stone-50/80 via-white to-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <MapPin className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Województwo Małopolskie – Mapa Wyzwań i Innowacji
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-stone-100 text-stone-700 rounded-full border border-stone-200/60">
                22 powiaty
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Interaktywny podział administracyjny ROPS Kraków – wybierz powiat,
              aby zobaczyć lokalne diagnozy i dobre praktyki
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Color Mode Selector */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/60 text-xs">
            <button
              onClick={() => setColorMode("subregions")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                colorMode === "subregions"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Subregiony
            </button>
            <button
              onClick={() => setColorMode("senior")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                colorMode === "senior"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Wskaźnik 60+
            </button>
            <button
              onClick={() => setColorMode("challenges")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                colorMode === "challenges"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Wyzwania
            </button>
          </div>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
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
        <div className="p-4 sm:p-6 space-y-5">
          {/* Subregion Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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

          {/* Main Visual Layout: Map (left/center) + Sidebar/Details (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Area (7 cols on lg) */}
            <div className="lg:col-span-7 bg-stone-50/70 rounded-2xl p-4 sm:p-6 border border-stone-200/60 relative flex flex-col items-center justify-center min-h-75 overflow-hidden">
              {/* Legend & City indicator */}
              <div className="w-full flex items-center justify-between text-[11px] font-medium text-stone-500 mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
                    <span>Miasta na prawach powiatu (3)</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-stone-200 inline-block border border-stone-300"></span>
                    <span>Powiaty ziemskie (19)</span>
                  </span>
                </div>
                {selectedPowiat && (
                  <button
                    onClick={() => {
                      setSelectedPowiatId(null);
                      if (onSelectPowiat) onSelectPowiat(null);
                    }}
                    className="text-stone-600 hover:text-stone-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Odznacz</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* The SVG element using exact geometry from Województwo_małopolskie_powiaty_2.svg */}
              <div className="relative w-full max-w-135 aspect-[315/211.134]">
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
                      left: Math.max(80, Math.min(mousePos.x, 460)),
                      top: Math.max(40, mousePos.y),
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
                    <div className="text-[11px] text-stone-300 mt-0.5">
                      {hoveredPowiat.subregion}
                    </div>
                    <div className="mt-1 pt-1 border-t border-stone-800 flex items-center gap-3 text-[10px] text-stone-400">
                      <span>
                        Wyzwania:{" "}
                        <b className="text-white">{hoveredPowiat.challenges}</b>
                      </span>
                      <span>
                        Seniorzy 60+:{" "}
                        <b className="text-amber-300">
                          {hoveredPowiat.seniorRatio}
                        </b>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Footer Helper */}
              <p className="mt-2 text-[11px] text-stone-400 text-center">
                Kliknij dowolny powiat na mapie, aby otworzyć szczegółową kartę
                diagnozy społecznej i przetestowanych innowacji.
              </p>
            </div>

            {/* Sidebar / Detailed Info Card (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              {selectedPowiat ? (
                /* Selected Powiat Card */
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2 border-b border-stone-200 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        {selectedPowiat.isCity ? (
                          <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-stone-600" />
                        )}
                        <span>
                          {selectedPowiat.isCity
                            ? "Miasto na prawach powiatu"
                            : "Powiat ziemski"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mt-0.5">
                        {selectedPowiat.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">
                        Siedziba:{" "}
                        <strong className="text-stone-700">
                          {selectedPowiat.seat}
                        </strong>{" "}
                        • {selectedPowiat.subregion}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPowiatId(null);
                        if (onSelectPowiat) onSelectPowiat(null);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                      title="Zamknij podgląd"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-3xs">
                      <div className="text-lg font-bold text-stone-900">
                        {selectedPowiat.challenges}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Wyzwania
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-3xs">
                      <div className="text-lg font-bold text-emerald-700">
                        {selectedPowiat.innovations}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Innowacje
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-stone-200/70 shadow-3xs">
                      <div className="text-lg font-bold text-amber-700">
                        {selectedPowiat.seniorRatio}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Osoby 60+
                      </div>
                    </div>
                  </div>

                  {/* Main Challenge */}
                  <div className="bg-white rounded-xl p-3 border border-stone-200/70 shadow-3xs space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Główna diagnoza społeczna ROPS:</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {selectedPowiat.mainChallenge}
                    </p>
                  </div>

                  {/* Best practice / Innovation */}
                  <div className="bg-white rounded-xl p-3 border border-stone-200/70 shadow-3xs space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <Award className="w-3.5 h-3.5" />
                      <span>Testowana innowacja ROPS w tym powiecie:</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {selectedPowiat.bestPractice}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    {onApplySearch && (
                      <button
                        onClick={() =>
                          onApplySearch(
                            selectedPowiat.name.replace("Powiat ", ""),
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Filtruj zasobnik</span>
                      </button>
                    )}

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate("propose")}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-stone-800 border border-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Odpowiedz z AI</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Default Regional Overview when no single county is selected */
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Regionalne Obserwatorium Polityki Społecznej
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 mt-1">
                      Województwo Małopolskie w liczbach
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Zasobnik wiedzy ROPS Kraków gromadzi diagnozy wyzwań dla
                      wszystkich 22 powiatów oraz bazę innowacji przetestowanych
                      w małopolskich gminach.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="bg-white p-3 rounded-xl border border-stone-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          22
                        </div>
                        <span className="text-xs font-semibold text-stone-800">
                          Powiaty i miasta na prawach powiatu
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">
                        100% Małopolski
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-stone-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          38+
                        </div>
                        <span className="text-xs font-semibold text-stone-800">
                          Przetestowane innowacje społeczne
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Wdrożone
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-stone-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                          24,6%
                        </div>
                        <span className="text-xs font-semibold text-stone-800">
                          Średni udział mieszkańców 60+
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Wzrost +1.8% r/r
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Największa dynamika starzenia występuje w{" "}
                      <strong>powiecie miechowskim (27,9%)</strong> oraz{" "}
                      <strong>chrzanowskim (28,2%)</strong>, z kolei najmłodszą
                      strukturę demograficzną notuje{" "}
                      <strong>powiat limanowski (20,8%)</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Subregion Summary Bar */}
              <div className="bg-white rounded-xl p-3.5 border border-stone-200/70 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">
                  {activeSubregion === "all"
                    ? "Widok: Wszystkie 5 subregionów Małopolski"
                    : `Wybrany subregion: ${SUBREGIONS.find((s) => s.key === activeSubregion)?.label}`}
                </span>
                <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                  ROPS Kraków 2026
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
