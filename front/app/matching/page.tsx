'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  User,
  HelpCircle,
  Coins,
  Users2,
  FileText,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Compass,
  CheckCircle2,
  Handshake
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
          text: `Przepraszam, wystąpił problem podczas łączenia z silnikiem matchingu: ${err?.message || 'Nieznany błąd serwera.'
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
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek Sekcji spójny z estetyką minno */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Problemmatching</span>
            <span className="block text-stone-300">Asystent Innowacji</span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-black/5 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Nowa rozmowa</span>
          </button>
        )}
      </div>

      {/* Ekran Początkowy / Brak Wiadomości */}
      {messages.length === 0 && (
        <div
          className="rounded-[32px] p-8 sm:p-12 border border-black/5 shadow-2xs text-center flex flex-col gap-8 items-center w-fit mx-auto"
          style={{
            background:
              'radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)'
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7 text-[#EFE5C6]" />
          </div>

          <div className="max-w-xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Opisz problem społeczny lub wyzwanie w gminie
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Asystent minno przeszuka bazę innowacji ROPS Kraków, wskaże najbardziej dopasowane
              rozwiązanie, wyliczy podobieństwo semantyczne oraz przygotuje rekomendację finansowania.
            </p>
          </div>

          {/* Przykładowe zapytania jako karty */}
          <div className="space-y-3 pt-2 text-left max-w-3xl">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block text-center">
              Wybierz przykładowe zapytanie lub wpisz własne poniżej:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleQueries.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sq)}
                  className="p-4 bg-white/90 hover:bg-white border border-black/5 hover:border-black/10 rounded-2xl text-left transition-all hover:shadow-2xs group cursor-pointer flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-500 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 group-hover:text-stone-900 leading-snug">
                    {sq}
                  </span>
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
                  <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-stone-900 text-white rounded-3xl rounded-tr-md p-4 sm:p-5 shadow-xs text-sm leading-relaxed font-normal">
                      {turn.text}
                      <span className="block text-[10px] text-stone-400 mt-2 text-right font-mono">
                        {turn.timestamp}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-stone-200/80 text-stone-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Odpowiedź Asystenta RAG */
                <div className="flex items-start gap-3 max-w-full">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs font-ubuntu font-bold text-sm">
                    m
                  </div>

                  <div className="flex-1 space-y-4 overflow-hidden">
                    {/* Status weryfikacji i metadane */}
                    {turn.matchResponse && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white border border-black/5 text-xs text-stone-500 shadow-2xs">
                        <div className="flex items-center gap-2">
                          {turn.matchResponse.guardrail_status === 'PASSED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Baza ROPS Kraków: Dopasowano
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              Status: {turn.matchResponse.guardrail_status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[11px] text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{turn.matchResponse.total_duration_ms} ms</span>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* 🏆 WYRÓŻNIONY KAFELEK Z NAJBLIŻSZYM ROZWIĄZANIEM */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.top_solution && (
                      <div
                        className="rounded-[28px] p-6 sm:p-8 border border-black/6 shadow-2xs space-y-5 relative overflow-hidden"
                        style={{
                          background:
                            'radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)'
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-[#EFE5C6]" />
                              <span>Najbliższe rozwiązanie w Małopolsce</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 font-medium">Podobieństwo:</span>
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              {turn.matchResponse.top_solution.similarity_percentage}
                            </span>
                          </div>
                        </div>

                        {/* Tytuł innowacji */}
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                            {turn.matchResponse.top_solution.title}
                          </h3>
                        </div>

                        {/* Szczegółowe metadane rozwiązania */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-stone-700">
                          <div className="bg-white/85 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                              <span>Rozwiązywany problem:</span>
                            </span>
                            <p className="line-clamp-3 text-stone-600 leading-relaxed">
                              {turn.matchResponse.top_solution.problem_statement || 'Brak danych w bazie.'}
                            </p>
                          </div>

                          <div className="bg-white/85 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              <span>Dofinansowanie / Dotacje:</span>
                            </span>
                            <p className="line-clamp-3 text-stone-600 leading-relaxed">
                              {turn.matchResponse.top_solution.funding_info || 'Dostępne środki z funduszy regionalnych ROPS.'}
                            </p>
                          </div>

                          {turn.matchResponse.top_solution.target_group && (
                            <div className="bg-white/85 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5 md:col-span-2">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-black/5">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <FileText className="w-3.5 h-3.5 text-stone-400" />
                            <span>Źródło: ROPS Kraków (Katalog Innowacji Społecznych)</span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Link
                              href={`/middleman?innovation=${encodeURIComponent(turn.matchResponse.top_solution.id)}`}
                              className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-[#EFE5C6] hover:bg-[#E7DAC0] text-stone-900 text-xs font-semibold rounded-xl transition-all shadow-2xs"
                            >
                              <Handshake className="w-3.5 h-3.5" />
                              <span>Dostosuj dla mojej instytucji</span>
                            </Link>
                            {turn.matchResponse.top_solution.url && (
                              <a
                                href={turn.matchResponse.top_solution.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs"
                              >
                                <span>Zobacz projekt źródłowy</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* ODPOWIEDŹ DORADCY WYRENDEROWANA W MARKDOWNIE */}
                    {/* ======================================================== */}
                    <div className="p-6 sm:p-8 bg-white border border-black/5 rounded-[28px] shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-black/5 pb-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                          <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-900">
                            <Sparkles className="w-3.5 h-3.5 text-stone-700" />
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
                            p: ({ ...props }) => <p className="mb-3 leading-relaxed text-stone-700 last:mb-0" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc list-outside pl-5 space-y-2 my-3 text-stone-700" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal list-outside pl-5 space-y-2 my-3 text-stone-700" {...props} />,
                            li: ({ ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                            strong: ({ ...props }) => <strong className="font-semibold text-stone-950" {...props} />,
                            em: ({ ...props }) => <em className="italic text-stone-800" {...props} />,
                            a: ({ href, children, ...props }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-900 font-semibold underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 inline-flex items-center gap-1 transition-colors"
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
                              <div className="overflow-x-auto my-4 border border-black/5 rounded-2xl bg-white shadow-2xs">
                                <table className="w-full text-xs text-left border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ ...props }) => <thead className="bg-stone-50 text-stone-900 font-semibold border-b border-black/5" {...props} />,
                            th: ({ ...props }) => <th className="px-3.5 py-2.5 border-r border-black/5 last:border-r-0" {...props} />,
                            td: ({ ...props }) => <td className="px-3.5 py-2.5 border-b border-black/5 border-r border-black/5 last:border-r-0" {...props} />,
                            code: ({ ...props }) => <code className="bg-stone-100 text-stone-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props} />,
                          }}
                        >
                          {turn.text}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Alternatywne rozwiązania (w granicy do 5%) */}
                    {turn.matchResponse?.close_solutions && turn.matchResponse.close_solutions.length > 0 && (
                      <div className="border border-black/5 rounded-2xl bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => toggleAlternatives(turn.id)}
                          className="w-full p-4 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-50/80 transition-colors cursor-pointer"
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
                          <div className="p-4 pt-1 border-t border-black/5 space-y-3 bg-[#FAF9F5]">
                            {turn.matchResponse.close_solutions.map((alt) => (
                              <div
                                key={alt.id}
                                className="p-4 bg-white border border-black/5 rounded-xl space-y-2 text-xs shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-bold text-stone-900">{alt.title}</h4>
                                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 text-[11px]">
                                    {alt.similarity_percentage}
                                  </span>
                                </div>
                                <p className="text-stone-600 leading-relaxed line-clamp-2">{alt.solution}</p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <Link
                                    href={`/middleman?innovation=${encodeURIComponent(alt.id)}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EFE5C6] hover:bg-[#E7DAC0] text-[11px] font-semibold text-stone-900 transition-colors"
                                  >
                                    <Handshake className="w-3 h-3" />
                                    <span>Dostosuj dla mojej instytucji</span>
                                  </Link>
                                  {alt.url && (
                                    <a
                                      href={alt.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-900 underline underline-offset-2 hover:text-stone-700"
                                    >
                                      <span>Szczegóły projektu</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
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
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-2xs font-ubuntu font-bold text-sm">
                m
              </div>
              <div className="p-5 sm:p-6 bg-white border border-black/5 rounded-[24px] space-y-3 max-w-lg shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <div className="w-2 h-2 rounded-full bg-stone-900 animate-ping" />
                  <span>Przeszukuję bazę innowacji ROPS Kraków...</span>
                </div>
                <div className="space-y-2 animate-pulse pt-1">
                  <div className="h-2.5 bg-stone-200 rounded-full w-4/5"></div>
                  <div className="h-2.5 bg-stone-200 rounded-full w-full"></div>
                  <div className="h-2.5 bg-stone-200 rounded-full w-3/5"></div>
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
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-black/6 shadow-lg p-1.5 focus-within:ring-2 focus-within:ring-stone-900/10 focus-within:border-stone-900/30 transition-all"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Opisz problem społeczny (np. opieka w domu starców, wsparcie seniorów, dofinansowanie)..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-transparent text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
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
