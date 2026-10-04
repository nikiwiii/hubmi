"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Search,
  ArrowRight,
  RefreshCw,
  Users2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Video,
} from "lucide-react";
import { InnovationRecord } from "../../lib/types";
import { useApp } from "../../context/AppContext";

interface InnovationPickerProps {
  onSelect: (innovation: InnovationRecord) => void;
  onQuickCreate?: (innovation: InnovationRecord) => void;
}

const PAGE_SIZE = 15;

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export const InnovationPicker: React.FC<InnovationPickerProps> = ({
  onSelect,
  onQuickCreate,
}) => {
  const {
    innovations,
    isLoadingInnovations,
    innovationsError,
    loadInnovations,
    searchLocalInnovations,
    pickerQuery,
    setPickerQuery,
    pickerPage,
    setPickerPage,
  } = useApp();

  const listTopRef = useRef<HTMLDivElement>(null);

  // Zapewnij, że baza innowacji zostanie pobrana, jeśli stan jest jeszcze pusty
  useEffect(() => {
    if (innovations.length === 0 && !isLoadingInnovations) {
      loadInnovations();
    }
  }, [innovations.length, isLoadingInnovations, loadInnovations]);

  // Błyskawiczne filtrowanie w pamięci ze stanu globalnego
  const results = useMemo(() => {
    return searchLocalInnovations(pickerQuery);
  }, [searchLocalInnovations, pickerQuery]);

  // Obliczenia paginacji
  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, pickerPage), totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const currentResults = results.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === validCurrentPage) return;
    setPickerPage(page);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pageNumbers = getPageNumbers(validCurrentPage, totalPages);
  const isInitialLoading = isLoadingInnovations && innovations.length === 0;

  return (
    <div ref={listTopRef} className="space-y-4 scroll-mt-6">
      <label className="block">
        <span className="block text-sm font-semibold text-stone-800 mb-2">
          Wyszukaj innowację, którą chcesz wdrożyć
        </span>
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-black/10 px-4 focus-within:ring-2 focus-within:ring-stone-900/10">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="search"
            value={pickerQuery}
            onChange={(e) => {
              setPickerQuery(e.target.value);
              setPickerPage(1);
            }}
            placeholder="np. seniorzy, samotność, transport, dzieci..."
            className="flex-1 py-3.5 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </label>

      {innovationsError && innovations.length === 0 && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {innovationsError}
        </p>
      )}

      {/* Pasek podsumowania liczby wyników i bieżącej strony */}
      {!isInitialLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 px-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>
              Znaleziono{" "}
              <strong className="text-stone-800">{totalItems}</strong> innowacji
              w bazie ROPS Kraków
            </span>
          </div>
          <div>
            Wyświetlam{" "}
            <strong className="text-stone-800">
              {startIndex + 1}–{endIndex}
            </strong>{" "}
            z <strong className="text-stone-800">{totalItems}</strong> (strona{" "}
            <strong className="text-stone-800">{validCurrentPage}</strong> z{" "}
            <strong className="text-stone-800">{totalPages}</strong>)
          </div>
        </div>
      )}

      {isInitialLoading ? (
        <div className="flex items-center gap-2 text-sm text-stone-500 py-12 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
          <span>Szukam w bazie innowacji ROPS Kraków...</span>
        </div>
      ) : totalItems === 0 ? (
        <p className="text-sm text-stone-500 py-12 text-center bg-stone-50 rounded-2xl border border-stone-100">
          Nie znaleziono innowacji dla podanej frazy. Spróbuj innego słowa
          kluczowego.
        </p>
      ) : (
        <>
          {/* Siatka 15 innowacji na stronę */}
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentResults.map((inn) => (
              <li key={inn.id}>
                <button
                  onClick={() => onSelect(inn)}
                  className="w-full h-full text-left p-5 bg-white hover:bg-[#FAF9F5] border border-black/5 hover:border-black/15 rounded-2xl shadow-2xs transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-bold text-stone-900 leading-snug">
                      {inn.title}
                    </span>
                  </div>
                  {(inn.addressed_problems || inn.description) && (
                    <span className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                      {inn.addressed_problems || inn.description}
                    </span>
                  )}
                  {inn.target_group && (
                    <span className="text-xs text-stone-500 flex items-center gap-1.5 mt-auto pt-1">
                      <Users2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-clamp-1">{inn.target_group}</span>
                    </span>
                  )}
                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900 group-hover:underline underline-offset-4">
                      <span>Zobacz innowację</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    {onQuickCreate && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickCreate(inn);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onQuickCreate(inn);
                          }
                        }}
                        title="Przejdź od razu do formularza adaptacji dla tej innowacji"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer shrink-0"
                      >
                        Dostosuj do usługi
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Panel paginacji: 15 innowacji na stronę */}
          {totalPages > 1 && (
            <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5">
              <span className="text-xs text-stone-500">
                Strona{" "}
                <strong className="text-stone-800">{validCurrentPage}</strong> z{" "}
                <strong className="text-stone-800">{totalPages}</strong>
              </span>

              <nav
                aria-label="Paginacja innowacji"
                className="flex items-center gap-1.5 flex-wrap justify-center"
              >
                {/* Poprzednia strona */}
                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  disabled={validCurrentPage <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-stone-100 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Poprzednia</span>
                </button>

                {/* Numery stron */}
                {pageNumbers.map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1.5 text-xs text-stone-400 select-none"
                      >
                        …
                      </span>
                    );
                  }
                  const isCurrent = p === validCurrentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p as number)}
                      className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-stone-900 text-white shadow-2xs"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Następna strona */}
                <button
                  type="button"
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  disabled={validCurrentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-stone-100 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Następna</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};
