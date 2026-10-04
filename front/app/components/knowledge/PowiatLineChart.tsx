'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  ResearchInfo,
  PowiatTimeSeries,
  getAllPowiatTimeSeries,
  getRegionalAverageTimeSeries,
  formatResearchValue
} from '../../lib/researchData';
import { POWIATY_DATA } from '../../lib/malopolskaMapData';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  MapPin,
  ChevronDown,
  Check,
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import { CustomSelect, SelectOption } from '../shared/CustomSelect';

interface PowiatLineChartProps {
  research: ResearchInfo;
  selectedPowiatId: string | null;
  onSelectPowiat: (powiatId: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  unit?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md text-stone-900 dark:text-white p-3 rounded-2xl shadow-xl border border-stone-200 dark:border-white/10 text-xs space-y-1.5 min-w-[200px]">
        <div className="font-bold text-amber-600 dark:text-amber-400 text-sm border-b border-stone-100 dark:border-white/10 pb-1">
          Rok {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[130px]">{entry.name}:</span>
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100">
              {formatResearchValue(entry.value)} {unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PowiatLineChart: React.FC<PowiatLineChartProps> = ({
  research,
  selectedPowiatId,
  onSelectPowiat
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [comparePowiatId, setComparePowiatId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Wszystkie serie czasowe
  const allSeries = useMemo(() => {
    return getAllPowiatTimeSeries(research.id);
  }, [research.id]);

  // Seria czasowa średniej regionalnej
  const regionalAvg = useMemo(() => {
    return getRegionalAverageTimeSeries(research.id);
  }, [research.id]);

  // Główny wybrany powiat (jeśli brak, domyślnie pierwszy na liście np. Kraków lub bocheński)
  const activeSeries = useMemo(() => {
    if (selectedPowiatId) {
      const found = allSeries.find((s) => s.powiatId === selectedPowiatId);
      if (found) return found;
    }
    return allSeries[0] || null;
  }, [selectedPowiatId, allSeries]);

  // Powiat do porównania (opcjonalny)
  const compareSeries = useMemo(() => {
    if (!comparePowiatId) return null;
    return allSeries.find((s) => s.powiatId === comparePowiatId) || null;
  }, [comparePowiatId, allSeries]);

  const mainPowiatOptions: SelectOption[] = useMemo(() => {
    return allSeries.map((s) => ({
      value: s.powiatId,
      label: `${s.powiatName} (${formatResearchValue(s.endValue)} ${research.unit})`,
    }));
  }, [allSeries, research.unit]);

  const comparePowiatOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'none', label: '+ Porównaj z innym powiatem' },
      ...allSeries
        .filter((s) => s.powiatId !== activeSeries?.powiatId)
        .map((s) => ({
          value: s.powiatId,
          label: `Porównaj: ${s.powiatName}`,
        })),
    ];
  }, [allSeries, activeSeries?.powiatId]);

  // Formatowanie danych do Recharts
  const chartData = useMemo(() => {
    if (!activeSeries) return [];

    return research.years.map((year, idx) => {
      const activePoint = activeSeries.history.find((h) => h.year === year)?.value ?? 0;
      const avgPoint = regionalAvg.find((h) => h.year === year)?.value ?? 0;

      const row: Record<string, string | number> = {
        year,
        [activeSeries.powiatName]: activePoint,
        'Średnia Małopolski': avgPoint
      };

      if (compareSeries) {
        const compPoint = compareSeries.history.find((h) => h.year === year)?.value ?? 0;
        row[compareSeries.powiatName] = compPoint;
      }

      return row;
    });
  }, [activeSeries, compareSeries, regionalAvg, research.years]);

  if (!isMounted || !activeSeries) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 min-h-[360px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-400 text-sm">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Wczytywanie wykresu serii czasowej...</span>
        </div>
      </div>
    );
  }

  const isPositiveTrend = activeSeries.delta >= 0;
  const isPercent = research.unit === '%' || research.unit.toLowerCase() === 'procent';
  const powiatPctChange =
    activeSeries.startValue && activeSeries.startValue !== 0
      ? (((activeSeries.endValue - activeSeries.startValue) / activeSeries.startValue) * 100).toFixed(1)
      : null;

  return (
    <div className="bg-white dark:bg-[#1C1E23] rounded-[28px] border border-black/5 dark:border-white/10 shadow-2xs p-5 sm:p-6 space-y-6">
      {/* Nagłówek i przełączniki powiatów */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: research.theme.accent }} />
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            {activeSeries.powiatName}
          </h3>
        </div>

        {/* Selektory powiatu */}
        <div className="flex flex-wrap items-center gap-2">
          {activeSeries && (
            <CustomSelect
              value={activeSeries.powiatId}
              onChange={onSelectPowiat}
              options={mainPowiatOptions}
            />
          )}

          <CustomSelect
            value={comparePowiatId || 'none'}
            onChange={(val) => setComparePowiatId(val === 'none' ? null : val)}
            options={comparePowiatOptions}
          />
        </div>
      </div>

      {/* Karty podsumowujące statystyki wybranego powiatu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Karta 1: Początek */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Początek ({research.years[0]})
            </span>
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none flex items-baseline">
              <span>{formatResearchValue(activeSeries.startValue)}</span>
              {isPercent && <span className="text-lg sm:text-xl font-bold text-stone-600 ml-0.5">%</span>}
            </div>
            {!isPercent && (
              <div className="text-xs font-medium text-stone-500 mt-1.5 truncate" title={research.unit}>
                {research.unit}
              </div>
            )}
          </div>
        </div>

        {/* Karta 2: Ostatni pomiar */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Ostatni pomiar ({research.years[research.years.length - 1]})
            </span>
            <Activity className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none flex items-baseline">
              <span>{formatResearchValue(activeSeries.endValue)}</span>
              {isPercent && <span className="text-lg sm:text-xl font-bold text-stone-600 ml-0.5">%</span>}
            </div>
            {!isPercent && (
              <div className="text-xs font-medium text-stone-500 mt-1.5 truncate" title={research.unit}>
                {research.unit}
              </div>
            )}
          </div>
        </div>

        {/* Karta 3: Zmiana całkowita */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Zmiana ({research.years.length} lat)
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isPositiveTrend
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/70'
              }`}
            >
              {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {powiatPctChange ? `${activeSeries.delta > 0 ? '+' : ''}${powiatPctChange}%` : ''}
            </span>
          </div>
          <div className="mt-2.5">
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight leading-none flex items-baseline ${
                isPositiveTrend ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              <span>
                {activeSeries.delta > 0 ? `+${formatResearchValue(activeSeries.delta)}` : formatResearchValue(activeSeries.delta)}
              </span>
              {isPercent && <span className="text-lg sm:text-xl font-bold ml-0.5">%</span>}
            </div>
            {!isPercent && (
              <div className="text-xs font-medium text-stone-500 mt-1.5 truncate" title={research.unit}>
                {research.unit}
              </div>
            )}
          </div>
        </div>

        {/* Karta 4: Pozycja w regionie */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Pozycja w regionie
            </span>
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-none">
              #{activeSeries.latestRank}{' '}
              <span className="text-xs font-medium text-stone-400">/ 22</span>
            </div>
            <div className="text-xs font-semibold text-stone-600 mt-1.5 truncate">
              {activeSeries.latestRank === 1 ? 'Lider w Małopolsce' : activeSeries.latestRank <= 5 ? 'Ścisła czołówka regionu' : 'W rankingu województwa'}
            </div>
          </div>
        </div>
      </div>

      {/* Główny Wykres Liniowy Recharts */}
      <div
        role="region"
        aria-label={`Wykres liniowy: trendy wskaźnika ${research.titlePl} dla ${activeSeries?.powiatName || 'powiatów'} w latach ${research.summary.startYear}–${research.summary.endYear}`}
        className="w-full h-[340px] sm:h-[400px] pt-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
              unit={research.unit === '%' ? '%' : ''}
              tickFormatter={(val: number) => {
                if (Math.abs(val) >= 1000) return `${(val / 1000).toLocaleString('pl-PL')} tys.`;
                return val.toLocaleString('pl-PL');
              }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip unit={research.unit} />} />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              iconType="circle"
              iconSize={8}
            />

            {/* Linia głównego powiatu */}
            <Line
              type="monotone"
              dataKey={activeSeries.powiatName}
              stroke={research.theme.chartColor}
              strokeWidth={3.5}
              dot={{ r: 4.5, fill: research.theme.chartColor, stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 7, strokeWidth: 2, fill: research.theme.chartColor }}
            />

            {/* Opcjonalna linia drugiego powiatu do porównania */}
            {compareSeries && (
              <Line
                type="monotone"
                dataKey={compareSeries.powiatName}
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
              />
            )}

            {/* Linia średniej regionalnej (przerywana) */}
            <Line
              type="monotone"
              dataKey="Średnia Małopolski"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200/60">
        <span>
          Wskazówka: Linia przerywana reprezentuje średnią arytmetyczną wszystkich 22 powiatów Małopolski.
        </span>
        <span className="font-semibold text-stone-700 hidden sm:inline">
          {activeSeries.subregion}
        </span>
      </div>
    </div>
  );
};
