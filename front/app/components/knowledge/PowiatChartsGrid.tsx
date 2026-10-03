'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  ResearchInfo,
  PowiatTimeSeries,
  getAllPowiatTimeSeries
} from '../../lib/researchData';
import { SUBREGIONS } from '../../lib/malopolskaMapData';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  Filter,
  X
} from 'lucide-react';
import { CustomSelect, SelectOption } from '../shared/CustomSelect';

interface PowiatChartsGridProps {
  research: ResearchInfo;
  selectedPowiatId: string | null;
  onSelectPowiat: (powiatId: string) => void;
}

type SortOption = 'rank' | 'alpha' | 'deltaAsc' | 'deltaDesc' | 'valDesc' | 'valAsc';

const SORT_OPTIONS: SelectOption<SortOption>[] = [
  { value: 'rank', label: 'Ranking (od najwyższej)' },
  { value: 'valAsc', label: 'Wartość (od najniższej)' },
  { value: 'deltaDesc', label: 'Największy wzrost (↑)' },
  { value: 'deltaAsc', label: 'Największy spadek (↓)' },
  { value: 'alpha', label: 'Nazwa powiatu (A-Z)' },
];

export const PowiatChartsGrid: React.FC<PowiatChartsGridProps> = ({
  research,
  selectedPowiatId,
  onSelectPowiat
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubregion, setSelectedSubregion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rank');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const allSeries = useMemo(() => {
    return getAllPowiatTimeSeries(research.id);
  }, [research.id]);

  // Filtrowanie i sortowanie powiatów
  const filteredSeries = useMemo(() => {
    let list = allSeries.filter((item) => {
      const matchesSearch =
        item.powiatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.seat.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubregion =
        selectedSubregion === 'all' || item.subregionKey === selectedSubregion;
      return matchesSearch && matchesSubregion;
    });

    switch (sortBy) {
      case 'valDesc':
        list.sort((a, b) => b.endValue - a.endValue);
        break;
      case 'valAsc':
        list.sort((a, b) => a.endValue - b.endValue);
        break;
      case 'deltaDesc':
        list.sort((a, b) => b.delta - a.delta);
        break;
      case 'deltaAsc':
        list.sort((a, b) => a.delta - b.delta);
        break;
      case 'alpha':
        list.sort((a, b) => a.powiatName.localeCompare(b.powiatName, 'pl'));
        break;
      case 'rank':
      default:
        list.sort((a, b) => a.latestRank - b.latestRank);
        break;
    }

    return list;
  }, [allSeries, searchQuery, selectedSubregion, sortBy]);

  // Mini tooltip do kart powiatów
  const MiniTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 text-white px-2 py-1 rounded-lg text-[10px] shadow-md border border-white/10">
          <span>{label}: </span>
          <span className="font-bold text-amber-400">
            {payload[0].value} {research.unit}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[28px] border border-black/5 shadow-2xs p-5 sm:p-6 space-y-5">
      {/* Pasek narzędziowy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <span className="text-xs font-semibold text-stone-500">
          Wszystkie 22 powiaty Małopolski
        </span>

        {/* Wyszukiwarka i Sortowanie */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj powiatu..."
              className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <CustomSelect<SortOption>
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              labelPrefix="Sortuj:"
            />
          </div>
        </div>
      </div>

      {/* Filtry subregionów */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {SUBREGIONS.map((sub) => {
          const isActive = selectedSubregion === sub.key;
          return (
            <button
              key={sub.key}
              onClick={() => setSelectedSubregion(sub.key)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200/70'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Grid 22 wykresów liniowych */}
      {filteredSeries.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-10 text-center border border-stone-200 text-stone-500 text-xs">
          Brak powiatów spełniających kryteria wyszukiwania.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSeries.map((item) => {
            const isSelected = selectedPowiatId === item.powiatId;
            const isPositive = item.delta >= 0;

            return (
              <div
                key={item.powiatId}
                onClick={() => onSelectPowiat(item.powiatId)}
                className={`group flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-lg ring-2 ring-stone-900 ring-offset-2'
                    : 'bg-white hover:bg-stone-50/70 text-stone-900 border-stone-200 hover:border-stone-400 hover:shadow-xs'
                }`}
              >
                {/* Górny wiersz karty */}
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm tracking-tight">
                          {item.powiatName}
                        </span>
                        {item.isCity && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-white/20 text-stone-100'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            Miasto
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] block mt-0.5 ${
                          isSelected ? 'text-stone-300' : 'text-stone-400'
                        }`}
                      >
                        Siedziba: {item.seat}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      #{item.latestRank}
                    </span>
                  </div>

                  {/* Wskaźniki liczbowe */}
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] block uppercase font-medium tracking-wider ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        Najnowszy ({research.years[research.years.length - 1]})
                      </span>
                      <span className="text-xl font-extrabold tracking-tight">
                        {item.endValue}{' '}
                        <span className="text-xs font-normal opacity-80">{research.unit}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] block uppercase font-medium tracking-wider ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        Zmiana 11 lat
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <TrendingUp
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-emerald-400' : 'text-emerald-600'
                            }`}
                          />
                        ) : (
                          <TrendingDown
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-rose-400' : 'text-rose-600'
                            }`}
                          />
                        )}
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? isPositive
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                              : isPositive
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {item.delta > 0 ? `+${item.delta}` : item.delta}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wykres liniowy Recharts dla danego powiatu */}
                <div
                  role="region"
                  aria-label={`Mini wykres trendu wskaźnika dla powiatu ${item.powiatName} w latach 2014-2024`}
                  className="w-full h-[120px] mt-3 pt-2 border-t border-dashed border-stone-200/50"
                >
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={item.history}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="year"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: isSelected ? '#94a3b8' : '#94a3b8',
                            fontSize: 9
                          }}
                          interval={4} // Pokaż pierwszy, środkowy i ostatni rok
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: isSelected ? '#94a3b8' : '#94a3b8',
                            fontSize: 9
                          }}
                        />
                        <Tooltip content={<MiniTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={isSelected ? '#FBBF24' : research.theme.chartColor}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full bg-stone-100 rounded-xl animate-pulse" />
                  )}
                </div>

                {/* Stopka karty z przyciskiem zaznaczenia */}
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-stone-300' : 'text-stone-400'
                    }`}
                  >
                    {item.subregion}
                  </span>

                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isSelected
                        ? 'text-amber-400'
                        : 'text-stone-700 group-hover:text-stone-900'
                    }`}
                  >
                    <span>{isSelected ? 'Wybrany' : 'Wybierz'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
