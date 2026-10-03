import React, { useState } from 'react';
import { sendMatchingChat } from '../../lib/api';
import { MatchResponse } from '../../lib/types';
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

export const RagChatSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const sampleQueries = [
    'Szukam rozwiązań związanych z domem starców i dofinansowaniem',
    'Wsparcie dla osób starszych w codziennych czynnościach domowych',
    'Jak przeciwdziałać samotności seniorów na wsi?',
    'Nowoczesne narzędzia do rehabilitacji ruchowej w małych gminach'
  ];

  const handleSearch = async (textToSearch?: string) => {
    const q = (textToSearch || query).trim();
    if (!q) return;

    if (textToSearch) setQuery(textToSearch);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMatchingChat(q);
      setResult(response);
    } catch (err: any) {
      setError(err?.message || 'Nie udało się połączyć z backendem RAG.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EFE5C6] flex items-center justify-center text-stone-900 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900">
              Inteligentny Doradca Innowacji Społecznych (RAG + Groq AI)
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Wektorowe przeszukiwanie bazy 115 innowacji ROPS Kraków, Guardrails, Explainability i Tracing.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="space-y-3"
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Opisz problem (np. opieka w domu starców, wsparcie seniorów, dofinansowanie)..."
            className="w-full pl-12 pr-28 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 text-sm font-medium focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Szukam...</span>
              </>
            ) : (
              <>
                <span>Dopasuj</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Sample Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-semibold text-stone-400 mr-1">Przykłady:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSearch(sq)}
              className="text-[11px] px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-6 bg-stone-50 rounded-2xl space-y-4 animate-pulse">
          <div className="h-4 bg-stone-200 rounded-md w-1/3"></div>
          <div className="h-3 bg-stone-200 rounded-md w-full"></div>
          <div className="h-3 bg-stone-200 rounded-md w-5/6"></div>
          <div className="h-3 bg-stone-200 rounded-md w-2/3"></div>
        </div>
      )}

      {/* Results View */}
      {result && !isLoading && (
        <div className="space-y-6 pt-2 animate-in fade-in duration-300">
          {/* Guardrail Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2">
              {result.guardrail_status === 'PASSED' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-stone-900">
                    Weryfikacja bazy innowacji (Guardrail):
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    DOPASOWANO DO BAZY
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-stone-900">
                    Reguła bezpieczeństwa (Guardrail):
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                    {result.guardrail_status}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{result.total_duration_ms} ms</span>
            </div>
          </div>

          {/* AI Response Card */}
          <div className="p-5 sm:p-6 bg-[#FAF9F5] border border-stone-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <Sparkles className="w-4 h-4 text-stone-700" />
              <span>Odpowiedź Asystenta (Groq API):</span>
            </div>
            <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-line font-normal">
              {result.answer}
            </div>
          </div>

          {/* Top Solution Card */}
          {result.top_solution && (
            <div className="p-5 sm:p-6 bg-white border-2 border-stone-900 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Najbliższe rozwiązanie (Top Match)
                  </span>
                  <h4 className="text-lg font-bold text-stone-900 mt-2">
                    {result.top_solution.title}
                  </h4>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-stone-400 font-medium block">Podobieństwo semantyczne:</span>
                  <span className="text-lg font-black text-emerald-700">
                    {result.top_solution.similarity_percentage}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700 pt-2 border-t border-stone-100">
                <div>
                  <span className="font-semibold text-stone-900 block mb-0.5">Problem:</span>
                  <p className="line-clamp-2">{result.top_solution.problem_statement || 'Brak danych'}</p>
                </div>
                <div>
                  <span className="font-semibold text-stone-900 block mb-0.5">Dofinansowanie:</span>
                  <p className="line-clamp-2">{result.top_solution.funding_info || 'Dostępne środki regionalne'}</p>
                </div>
              </div>

              {result.top_solution.url && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={result.top_solution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <span>Zobacz projekt źródłowy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Close Solutions (w granicy do 5%) */}
          {result.close_solutions && result.close_solutions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                <Layers className="w-4 h-4 text-stone-500" />
                <span>Rozwiązania alternatywne (w granicy do 5% różnicy):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.close_solutions.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-stone-900 truncate pr-2">{c.title}</span>
                        <span className="font-semibold text-emerald-700 shrink-0">
                          {c.similarity_percentage}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-2">{c.solution}</p>
                    </div>

                    {c.url && (
                      <div className="pt-2 border-t border-stone-200/60 flex justify-end">
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-800 hover:text-stone-950"
                        >
                          <span>Szczegóły</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explainability Block */}
          {result.explainability && (
            <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl space-y-2 text-xs text-stone-800">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Wyjaśnialność wyboru (Explainability):</span>
              </div>
              <p className="leading-relaxed">{result.explainability.summary}</p>
              {result.explainability.source_file && (
                <div className="pt-1 text-[11px] text-stone-500">
                  Dokument referencyjny: <span className="font-mono">{result.explainability.source_file}</span>
                </div>
              )}
            </div>
          )}

          {/* Tracing Steps Dropdown */}
          {result.trace && result.trace.length > 0 && (
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowTrace(!showTrace)}
                className="w-full p-3.5 bg-stone-50 hover:bg-stone-100 flex items-center justify-between text-left text-xs font-bold text-stone-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>Ślad wykonania zapytania (Tracing - {result.trace.length} kroków)</span>
                </div>
                {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showTrace && (
                <div className="p-4 bg-white divide-y divide-stone-100 text-xs">
                  {result.trace.map((step) => (
                    <div key={step.step_number} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{step.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700">
                            {step.status}
                          </span>
                        </div>
                        {step.details && (
                          <pre className="mt-1 text-[10px] font-mono text-stone-500 bg-stone-50 p-2 rounded-lg max-w-xl overflow-x-auto">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-stone-400 shrink-0">
                        {step.duration_ms} ms
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

