'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMatchingChat } from '../lib/api';
import { MatchResponse, InnovationMatchItem } from '../lib/types';
import {
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Trophy,
  Bot,
  User,
  HelpCircle,
  Coins,
  Users2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchResponse?: MatchResponse;
  timestamp: string;
}

export default function ProblemMatchingPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [expandedAlternatives, setExpandedAlternatives] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sampleQueries = [
    'Szukam rozwiązań związanych z domem starców i dofinansowaniem',
    'Wsparcie dla osób starszych w codziennych czynnościach domowych',
    'Jak przeciwdziałać samotności seniorów na wsi?',
    'Nowoczesne narzędzia do rehabilitacji ruchowej w małych gminach',
    'Wsparcie dzieci z trudnościami w nauce, dysleksją i ADHD'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputMessage).trim();
    if (!q || isLoading) return;

    const userTurnId = `user-${Date.now()}`;
    const newMessages: ChatTurn[] = [
      ...messages,
      {
        id: userTurnId,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Przygotowujemy historię dla backendu
      const historyForBackend = messages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text
      }));

      const response = await sendMatchingChat(q, historyForBackend);

      setMessages([
        ...newMessages,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: response.answer,
          matchResponse: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: `Przepraszam, wystąpił problem podczas łączenia z silnikiem matchingu: ${
            err?.message || 'Nieznany błąd serwera.'
          }. Upewnij się, że backend jest uruchomiony.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleAlternatives = (turnId: string) => {
    setExpandedAlternatives((prev) => ({
      ...prev,
      [turnId]: !prev[turnId]
    }));
  };

  const handleResetChat = () => {
    setMessages([]);
    setExpandedAlternatives({});
    setInputMessage('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek Sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFE5C6] border border-[#E2D5B0] flex items-center justify-center text-stone-900 shadow-xs">
            <Bot className="w-6 h-6 text-stone-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Problemmatching
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
              Inteligentny doradca innowacji społecznych ROPS Kraków – semantyczne dopasowanie, dotacje i źródła.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Nowa rozmowa
          </button>
        )}
      </div>

      {/* Ekran Początkowy / Brak Wiadomości */}
      {messages.length === 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-2xs space-y-8 text-center max-w-3xl mx-auto my-6">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF9F5] border border-stone-200 mx-auto flex items-center justify-center text-stone-900 shadow-2xs">
            <Trophy className="w-8 h-8 text-stone-800" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
              Opisz problem społeczny, z którym się mierzysz
            </h2>
          </div>

          {/* Przykładowe pytania na start */}
          <div className="space-y-3 pt-2 text-left">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block text-center">
              Wybierz przykładowe zapytanie lub wpisz własne:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sampleQueries.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sq)}
                  className="p-3.5 bg-stone-50 hover:bg-stone-100/90 border border-stone-200/80 rounded-2xl text-xs font-semibold text-stone-800 text-left transition-all hover:border-stone-300 flex items-start gap-2.5 group cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 shrink-0 mt-0.5 transition-colors" />
                  <span>{sq}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wątek Wiadomości Czatu */}
      {messages.length > 0 && (
        <div className="space-y-8 min-h-[300px]">
          {messages.map((turn) => (
            <div key={turn.id} className="space-y-4">
              {/* Wiadomość Użytkownika */}
              {turn.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-stone-900 text-white rounded-3xl rounded-tr-md p-4 sm:p-5 shadow-xs text-sm leading-relaxed font-medium">
                      {turn.text}
                      <span className="block text-[10px] text-stone-400 mt-1.5 text-right font-mono">
                        {turn.timestamp}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-stone-800 flex items-center justify-center text-white shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Odpowiedź Asystenta RAG */
                <div className="flex items-start gap-3 max-w-full">
                  <div className="w-9 h-9 rounded-xl bg-[#EFE5C6] flex items-center justify-center text-stone-900 shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-5 h-5 text-stone-900" />
                  </div>

                  <div className="flex-1 space-y-4 overflow-hidden">
                    {/* Status Guardrail & Tracing */}
                    {turn.matchResponse && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100/80 border border-stone-200/70 text-xs">
                        <div className="flex items-center gap-2">
                          {turn.matchResponse.guardrail_status === 'PASSED' ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-stone-800">Baza Innowacji:</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                DOPASOWANO DO BAZY
                              </span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-semibold text-stone-800">Status weryfikacji:</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                {turn.matchResponse.guardrail_status}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[11px] text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{turn.matchResponse.total_duration_ms} ms</span>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* 🏆 NA SAMEJ GÓRZE PO ODPOWIEDZI: KAFELEK Z NAJBLIŻSZĄ ODPOWIEDZIĄ */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.top_solution && (
                      <div className="p-6 bg-white border-2 border-stone-900 rounded-3xl shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-stone-900 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>Najbliższe rozwiązanie (Top Match)</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-medium">Podobieństwo semantyczne:</span>
                            <span className="px-2.5 py-0.5 rounded-lg text-sm font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {turn.matchResponse.top_solution.similarity_percentage}
                            </span>
                          </div>
                        </div>

                        {/* Tytuł innowacji */}
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">
                            {turn.matchResponse.top_solution.title}
                          </h3>
                        </div>

                        {/* Szczegółowe metadane rozwiązania */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-stone-700 bg-[#FAF9F5] p-4 rounded-2xl border border-stone-200/80">
                          <div className="space-y-1">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                              <span>Rozwiązywany problem:</span>
                            </span>
                            <p className="line-clamp-3 text-stone-600 leading-relaxed">
                              {turn.matchResponse.top_solution.problem_statement || 'Brak danych w bazie.'}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              <span>Dofinansowanie / Dotacje:</span>
                            </span>
                            <p className="line-clamp-3 text-stone-600 leading-relaxed">
                              {turn.matchResponse.top_solution.funding_info || 'Dostępne środki z funduszy regionalnych ROPS.'}
                            </p>
                          </div>

                          {turn.matchResponse.top_solution.target_group && (
                            <div className="space-y-1 md:col-span-2 pt-2 border-t border-stone-200/60">
                              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                <Users2 className="w-3.5 h-3.5 text-stone-500" />
                                <span>Grupa docelowa:</span>
                              </span>
                              <p className="text-stone-600 leading-relaxed">
                                {turn.matchResponse.top_solution.target_group}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Przycisk przejścia do innowacji źródłowej */}
                        {turn.matchResponse.top_solution.url && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2 text-[11px] text-stone-500">
                              <FileText className="w-3.5 h-3.5 text-stone-400" />
                              <span>Źródło: ROPS Kraków (Baza Innowacji)</span>
                            </div>

                            <a
                              href={turn.matchResponse.top_solution.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                            >
                              <span>Zobacz projekt źródłowy</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* ODPOWIEDŹ DORADCY WYRENDEROWANA W ŁADNYM MARKDOWNIE */}
                    {/* ======================================================== */}
                    <div className="p-6 sm:p-7 bg-[#FAF9F5] border border-stone-200/90 rounded-3xl shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                          <div className="w-5 h-5 rounded-md bg-[#EFE5C6] flex items-center justify-center text-stone-900">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span>Rekomendacja Doradcy Społecznego ROPS</span>
                        </div>
                      </div>

                      <div className="text-sm text-stone-800 leading-relaxed font-normal">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ ...props }) => <h3 className="text-base font-bold text-stone-900 mt-5 mb-2.5 first:mt-0" {...props} />,
                            h2: ({ ...props }) => <h3 className="text-base font-bold text-stone-900 mt-5 mb-2.5 first:mt-0" {...props} />,
                            h3: ({ ...props }) => <h4 className="text-sm font-bold text-stone-900 mt-4 mb-2 first:mt-0 flex items-center gap-1.5" {...props} />,
                            h4: ({ ...props }) => <h5 className="text-xs font-bold text-stone-900 mt-3 mb-1.5 uppercase tracking-wide" {...props} />,
                            p: ({ ...props }) => <p className="mb-3 leading-relaxed text-stone-800 last:mb-0" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc list-outside pl-5 space-y-2 my-3 text-stone-800" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal list-outside pl-5 space-y-2 my-3 text-stone-800" {...props} />,
                            li: ({ ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                            strong: ({ ...props }) => <strong className="font-semibold text-stone-950" {...props} />,
                            em: ({ ...props }) => <em className="italic text-stone-800" {...props} />,
                            a: ({ href, children, ...props }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-900 font-semibold underline underline-offset-2 decoration-stone-400 hover:decoration-stone-900 hover:text-stone-950 inline-flex items-center gap-1 transition-colors"
                                {...props}
                              >
                                <span>{children}</span>
                                <ExternalLink className="w-3 h-3 inline-block shrink-0" />
                              </a>
                            ),
                            blockquote: ({ ...props }) => (
                              <blockquote className="border-l-3 border-[#D4C39E] bg-[#F5EEDC]/40 pl-4 py-2 italic text-stone-700 my-3 rounded-r-xl" {...props} />
                            ),
                            table: ({ ...props }) => (
                              <div className="overflow-x-auto my-4 border border-stone-200 rounded-xl bg-white shadow-2xs">
                                <table className="w-full text-xs text-left border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ ...props }) => <thead className="bg-stone-100/90 text-stone-900 font-semibold border-b border-stone-200" {...props} />,
                            th: ({ ...props }) => <th className="px-3.5 py-2.5 border-r border-stone-200 last:border-r-0" {...props} />,
                            td: ({ ...props }) => <td className="px-3.5 py-2.5 border-b border-stone-100 border-r border-stone-100 last:border-r-0" {...props} />,
                            code: ({ ...props }) => <code className="bg-stone-200/70 text-stone-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props} />,
                          }}
                        >
                          {turn.text}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Alternatywne rozwiązania (w granicy do 5%) */}
                    {turn.matchResponse?.close_solutions && turn.matchResponse.close_solutions.length > 0 && (
                      <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => toggleAlternatives(turn.id)}
                          className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-stone-500" />
                            <span>
                              Zbliżone rozwiązania alternatywne ({turn.matchResponse.close_solutions.length})
                            </span>
                          </div>
                          {expandedAlternatives[turn.id] ? (
                            <ChevronUp className="w-4 h-4 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </button>

                        {expandedAlternatives[turn.id] && (
                          <div className="p-4 pt-1 border-t border-stone-100 space-y-3 bg-[#FAF9F5]">
                            {turn.matchResponse.close_solutions.map((alt) => (
                              <div
                                key={alt.id}
                                className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-bold text-stone-900">{alt.title}</h4>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[11px]">
                                    {alt.similarity_percentage}
                                  </span>
                                </div>
                                <p className="text-stone-600 line-clamp-2">{alt.solution}</p>
                                {alt.url && (
                                  <a
                                    href={alt.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-900 underline hover:text-stone-700"
                                  >
                                    <span>Szczegóły projektu</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Stan Ładowania (Thinking / Matching) */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in duration-300">
              <div className="w-9 h-9 rounded-xl bg-[#EFE5C6] flex items-center justify-center text-stone-900 shrink-0 shadow-2xs">
                <RefreshCw className="w-4 h-4 animate-spin text-stone-900" />
              </div>
              <div className="p-5 bg-white border border-stone-200 rounded-3xl space-y-3 max-w-lg shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <span>Przeszukuję bazę innowacji ROPS Kraków...</span>
                </div>
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-stone-200 rounded-full w-4/5"></div>
                  <div className="h-3 bg-stone-200 rounded-full w-full"></div>
                  <div className="h-3 bg-stone-200 rounded-full w-3/5"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Dolny Pasek Wprowadzania Wiadomości (Sticky Input Bar) */}
      <div className="sticky bottom-4 z-20 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-stone-300 shadow-md p-1.5 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/10 transition-all"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Opisz problem (np. opieka w domu starców, wsparcie seniorów, dofinansowanie)..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-transparent text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Szukam...</span>
                </>
              ) : (
                <>
                  <span>Wyślij</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
