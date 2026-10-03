"use client";

import React, { useEffect, useState } from "react";
import { Search, ArrowRight, RefreshCw, Users2 } from "lucide-react";
import { searchInnovations } from "../../lib/api";
import { InnovationRecord } from "../../lib/types";
import { errorMessage } from "../../lib/middleman";

interface InnovationPickerProps {
  onSelect: (innovation: InnovationRecord) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export const InnovationPicker: React.FC<InnovationPickerProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InnovationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchInnovations(query);
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Nie udało się pobrać innowacji."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block text-sm font-semibold text-stone-800 mb-2">
          Wyszukaj innowację, którą chcesz wdrożyć
        </span>
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-black/10 px-4 focus-within:ring-2 focus-within:ring-stone-900/10">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="np. seniorzy, samotność, transport, dzieci..."
            className="flex-1 py-3.5 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </label>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-stone-500 py-6 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Szukam w bazie innowacji ROPS Kraków...</span>
        </div>
      ) : results.length === 0 && !error ? (
        <p className="text-sm text-stone-500 py-6 text-center">
          Nie znaleziono innowacji. Spróbuj innego słowa.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((inn) => (
            <li key={inn.id}>
              <button
                onClick={() => onSelect(inn)}
                className="w-full h-full text-left p-5 bg-white hover:bg-[#FAF9F5] border border-black/5 hover:border-black/15 rounded-2xl shadow-2xs transition-all cursor-pointer group flex flex-col gap-2"
              >
                <span className="text-base font-bold text-stone-900 leading-snug">
                  {inn.title}
                </span>
                {(inn.addressed_problems || inn.description) && (
                  <span className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                    {inn.addressed_problems || inn.description}
                  </span>
                )}
                {inn.target_group && (
                  <span className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5" />
                    <span className="line-clamp-1">{inn.target_group}</span>
                  </span>
                )}
                <span className="mt-auto pt-1 inline-flex items-center gap-1 text-sm font-semibold text-stone-900 group-hover:underline underline-offset-4">
                  Wybierz tę innowację
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
