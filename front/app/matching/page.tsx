"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMatchingChat } from "../lib/api";
import { MatchResponse, InnovationMatchItem } from "../lib/types";
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Handshake,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Building2,
  MessageSquare,
  HelpCircle,
  Users2,
  Mic,
  MicOff,
  Layers,
  ArrowUpRight,
  ArrowUp,
  User,
  Video,
} from "lucide-react";
import { VoiceDictationPopup, useSpeechToText } from "../components/voice";
import { useApp } from "../context/AppContext";

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  text: string;
  matchResponse?: MatchResponse;
  timestamp: string;
}

function MatchingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { matchingMessages: messages, setMatchingMessages: setMessages } =
    useApp();

  const [inputIdea, setInputIdea] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);

  // Stan dyktowania głosowego
  const [initialTextBeforeDictation, setInitialTextBeforeDictation] =
    useState("");

  const {
    isListening,
    interimTranscript,
    errorMessage: voiceError,
    audioStream,
    startListening,
    stopListening,
    cancelListening,
  } = useSpeechToText({
    lang: "pl-PL",
    onTranscriptChange: (text) => {
      setInputIdea(text);
    },
  });

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setInitialTextBeforeDictation(inputIdea);
      startListening(inputIdea);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFinishVoice = () => {
    stopListening();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCancelVoice = () => {
    cancelListening(initialTextBeforeDictation);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    if (isListening) {
      stopListening();
    }
    const q = (textToSend !== undefined ? textToSend : inputIdea).trim();
    if (!q || isLoading) return;

    const userTurnId = `user-${Date.now()}`;
    const userTurn: ChatTurn = {
      id: userTurnId,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedMessages = [...messages, userTurn];
    setMessages(updatedMessages);
    setInputIdea("");
    setIsLoading(true);
    setError(null);

    try {
      const historyForBackend = messages.map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.text,
      }));

      const response = await sendMatchingChat(q, historyForBackend, {
        reporterType: "Mieszkaniec",
      });

      setMessages([
        ...updatedMessages,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: response.answer,
          matchResponse: response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err: any) {
      setError(
        err?.message ||
          "Wystąpił błąd podczas przeszukiwania bazy innowacji. Upewnij się, że serwer jest uruchomiony i spróbuj ponownie.",
      );
      setMessages([
        ...updatedMessages,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          text: `Nie udało się połączyć z bazą innowacji: ${
            err?.message || "Błąd serwera."
          }`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    if (isListening) {
      stopListening();
    }
    setMessages([]);
    setInputIdea("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Jeśli w URL podano parametr ?q=, wykonaj automatyczne wyszukiwanie jednokrotnie
  useEffect(() => {
    if (initialQuery.trim() && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  return (
    <div className="py-1 sm:py-2 px-4 sm:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col h-[calc(100vh-4.8rem)] animate-in fade-in duration-200">
      {/* Jedyny Główny Kontener Czatu AI (Pełna Dostępna Wysokość) */}
      <div
        className="rounded-3xl border border-black/6 dark:border-white/10 shadow-sm overflow-hidden flex flex-col flex-1 h-full min-h-0 relative bg-gradient-to-br from-[#FAF4E5] via-white to-[#F5F5F0] dark:from-[#181A20] dark:via-[#141518] dark:to-[#181A20]"
      >
        {/* Górny pasek z przyciskiem resetu, gdy są wiadomości */}
        {messages.length > 0 && (
          <div className="flex items-center justify-end px-5 pt-3.5 pb-1 shrink-0">
            <button
              type="button"
              onClick={handleResetChat}
              aria-label="Rozpocznij nową rozmowę i wyczyść czat"
              className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white border border-black/5 dark:border-white/10 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition-all"
            >
              <RotateCcw
                className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400"
                aria-hidden="true"
              />
              <span>Nowa rozmowa</span>
            </button>
          </div>
        )}

        {/* Obszar Odpowiedzi z Bazy Wektorowej / Modelu (GÓRA) */}
        <div className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto min-h-0">
          {/* Stan początkowy (przed zadaniem pytania) */}
          {messages.length === 0 && (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center space-y-3.5 p-4 my-auto select-none">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-[#EFE5C6] dark:text-stone-950" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[0.98]">
                <span className="block text-stone-900 dark:text-white">
                  Sprawdź, czy Twój pomysł
                </span>
                <span className="block text-stone-400 dark:text-stone-400">już istnieje</span>
              </h2>
              <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto pt-1">
                Wpisz lub podyktuj poniżej swój pomysł na innowację społeczną.
                Asystent przeszuka bazę sprawdzonych innowacji ROPS i sprawdzi,
                czy podobne rozwiązanie zostało już zrealizowane.
              </p>
            </div>
          )}

          {/* Wątek wiadomości czatu */}
          {messages.map((turn) => (
            <div
              key={turn.id}
              className="space-y-4 animate-in fade-in duration-200"
            >
              {turn.sender === "user" ? (
                /* Wiadomość użytkownika */
                <div className="flex justify-end">
                  <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
                    <div className="bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-3xl rounded-tr-md px-5 py-3.5 text-sm sm:text-base leading-relaxed shadow-xs">
                      <p className="whitespace-pre-wrap">{turn.text}</p>
                      <span className="block text-[10px] text-stone-400 dark:text-stone-800 mt-1.5 text-right font-mono">
                        {turn.timestamp}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Odpowiedź asystenta / modelu / bazy wektorowej */
                <div className="flex items-start gap-3 max-w-full">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 flex items-center justify-center shrink-0 mt-1 shadow-2xs font-ubuntu font-bold text-sm">
                    m
                  </div>

                  <div className="flex-1 space-y-4 overflow-hidden">
                    {turn.matchResponse && (
                      <>
                        {/* Baner werdyktu dopasowania */}
                        {(() => {
                          const top = turn.matchResponse.top_solution;
                          const isHigh = (top?.similarity || 0) >= 0.45;
                          return (
                            <div
                              className={`p-4 sm:p-4.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                                isHigh
                                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                                  : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    isHigh
                                      ? "bg-emerald-600 text-white"
                                      : "bg-amber-600 text-white"
                                  }`}
                                >
                                  {isHigh ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    <Lightbulb className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <h3 className="text-sm font-bold">
                                    {isHigh
                                      ? "Znaleziono bardzo zbliżoną innowację w bazie ROPS Kraków!"
                                      : "Twój pomysł wnosi świeże spojrzenie (niska zbieżność z bazą)"}
                                  </h3>
                                  <p className="text-xs opacity-90 leading-relaxed">
                                    {isHigh
                                      ? "Podobny model został już przetestowany. Możesz zaadaptować gotowe procedury bez budowania od zera."
                                      : "Nie znaleziono identycznego rozwiązania. Poniżej znajduje się najbliższy projekt, ale Twój pomysł może być nową innowacją."}
                                  </p>
                                </div>
                              </div>

                              {top?.similarity_percentage && (
                                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-white/10 border border-black/5 dark:border-white/10 text-xs font-bold text-stone-900 dark:text-white shadow-2xs">
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>
                                    Zgodność: {top.similarity_percentage}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Karta Najbardziej Zbliżonej Innowacji (Top Solution) */}
                        {turn.matchResponse.top_solution && (
                          <div className="rounded-3xl p-5 sm:p-7 bg-white/95 dark:bg-[#1C1E23] border border-black/6 dark:border-white/10 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                              <span className="px-3 py-1 bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs w-fit">
                                <Sparkles className="w-3 h-3 text-[#EFE5C6] dark:text-stone-950" />
                                <span>
                                  Najbardziej zbliżona innowacja w bazie
                                </span>
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                                Baza: Katalog Innowacji ROPS Kraków
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                              {turn.matchResponse.top_solution.title}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-stone-700 dark:text-stone-300">
                              <div className="bg-white/90 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/10 shadow-2xs space-y-1.5">
                                <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Na czym polega to rozwiązanie?</span>
                                </span>
                                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs sm:text-[13px]">
                                  {turn.matchResponse.top_solution.solution}
                                </p>
                              </div>

                              <div className="bg-white/90 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/10 shadow-2xs space-y-1.5">
                                <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                                  <span>Jaki problem rozwiązuje?</span>
                                </span>
                                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs sm:text-[13px]">
                                  {turn.matchResponse.top_solution
                                    .problem_statement ||
                                    "Brak szczegółowego opisu problemu."}
                                </p>
                              </div>

                              {turn.matchResponse.top_solution.target_group && (
                                <div className="bg-white/90 dark:bg-white/5 rounded-2xl p-3.5 border border-black/5 dark:border-white/10 shadow-2xs space-y-1 md:col-span-2">
                                  <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                                    <Users2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                                    <span>Grupa docelowa:</span>
                                  </span>
                                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs sm:text-[13px]">
                                    {
                                      turn.matchResponse.top_solution
                                        .target_group
                                    }
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                              <span className="text-xs text-stone-500 dark:text-stone-400">
                                Możesz zaadaptować to rozwiązanie dla swojej
                                instytucji lub gminy.
                              </span>

                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/middleman?innovation=${encodeURIComponent(
                                    turn.matchResponse.top_solution.id,
                                  )}`}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EFE5C6] dark:bg-amber-400/20 hover:bg-[#E7DAC0] dark:hover:bg-amber-400/30 text-stone-900 dark:text-amber-200 border border-transparent dark:border-amber-400/30 text-xs font-bold rounded-xl transition-all shadow-2xs"
                                >
                                  <Handshake className="w-3.5 h-3.5" />
                                  <span>
                                    Dostosuj to rozwiązanie w Innowacjach
                                  </span>
                                </Link>

                                {turn.matchResponse.top_solution.url && (
                                  <a
                                    href={turn.matchResponse.top_solution.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-semibold rounded-xl transition-all shadow-2xs"
                                  >
                                    <span>Karta innowacji ROPS</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {turn.matchResponse.top_solution.video_url && (
                                  <a
                                    href={
                                      turn.matchResponse.top_solution.video_url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs"
                                    title="Zobacz filmik YouTube"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Wideo (YouTube)</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Analiza i wskazówki asystenta */}
                        {turn.text && (
                          <div className="bg-white dark:bg-[#1C1E23] rounded-3xl border border-black/6 dark:border-white/10 p-5 sm:p-6 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white border-b border-black/5 dark:border-white/10 pb-2.5">
                              <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 flex items-center justify-center text-stone-900 dark:text-white">
                                <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-amber-400" />
                              </div>
                              <span>Wnioski i wskazówki asystenta</span>
                            </div>

                            <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ ...props }) => (
                                    <h3
                                      className="text-base font-bold text-stone-900 dark:text-white mt-4 mb-2 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  h2: ({ ...props }) => (
                                    <h3
                                      className="text-base font-bold text-stone-900 dark:text-white mt-4 mb-2 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  h3: ({ ...props }) => (
                                    <h4
                                      className="text-sm font-bold text-stone-900 dark:text-white mt-3 mb-1.5 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  p: ({ ...props }) => (
                                    <p
                                      className="mb-2 leading-relaxed text-stone-700 dark:text-stone-300 last:mb-0"
                                      {...props}
                                    />
                                  ),
                                  ul: ({ ...props }) => (
                                    <ul
                                      className="list-disc list-outside pl-5 space-y-1.5 my-2 text-stone-700 dark:text-stone-300"
                                      {...props}
                                    />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol
                                      className="list-decimal list-outside pl-5 space-y-1.5 my-2 text-stone-700 dark:text-stone-300"
                                      {...props}
                                    />
                                  ),
                                  li: ({ ...props }) => (
                                    <li
                                      className="leading-relaxed pl-0.5"
                                      {...props}
                                    />
                                  ),
                                  strong: ({ ...props }) => (
                                    <strong
                                      className="font-semibold text-stone-950 dark:text-white"
                                      {...props}
                                    />
                                  ),
                                  a: ({ href, children, ...props }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-stone-900 dark:text-amber-400 font-semibold underline underline-offset-4 hover:text-stone-700 dark:hover:text-amber-300 inline-flex items-center gap-1"
                                      {...props}
                                    >
                                      <span>{children}</span>
                                      <ExternalLink className="w-3 h-3 inline-block shrink-0" />
                                    </a>
                                  ),
                                }}
                              >
                                {turn.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Inne zbliżone innowacje (jeśli istnieją) */}
                        {turn.matchResponse.close_solutions &&
                          turn.matchResponse.close_solutions.length > 0 && (
                            <div className="bg-white dark:bg-[#1C1E23] rounded-3xl border border-black/6 dark:border-white/10 p-5 sm:p-6 shadow-2xs space-y-3.5">
                              <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/10 pb-2.5">
                                <Layers className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                                <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                                  Inne powiązane innowacje w bazie (
                                  {turn.matchResponse.close_solutions.length})
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {turn.matchResponse.close_solutions.map(
                                  (alt: InnovationMatchItem) => (
                                    <div
                                      key={alt.id}
                                      className="p-3.5 bg-[#FAF9F5] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl space-y-2 flex flex-col justify-between text-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <h5 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-2">
                                            {alt.title}
                                          </h5>
                                          <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg text-[10px] shrink-0 border border-transparent dark:border-emerald-800/40">
                                            {alt.similarity_percentage}
                                          </span>
                                        </div>
                                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                                          {alt.solution}
                                        </p>
                                      </div>

                                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/10">
                                        <Link
                                          href={`/middleman?innovation=${encodeURIComponent(
                                            alt.id,
                                          )}`}
                                          className="inline-flex items-center gap-1 font-semibold text-stone-900 dark:text-white hover:text-stone-700 dark:hover:text-stone-300"
                                        >
                                          <span>Dostosuj w Innowacjach</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </Link>
                                        <div className="flex items-center gap-2">
                                          {alt.video_url && (
                                            <a
                                              href={alt.video_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 hover:text-red-700"
                                              title="Obejrzyj wideo na YouTube"
                                            >
                                              <Video className="w-3.5 h-3.5" />
                                              <span>Wideo</span>
                                            </a>
                                          )}
                                          {alt.url && (
                                            <a
                                              href={alt.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-white"
                                              title="Dokumentacja ROPS"
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Dwie ścieżki decyzyjne */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          <div className="p-5 bg-white dark:bg-[#1C1E23] rounded-3xl border border-black/6 dark:border-white/10 shadow-2xs space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 flex items-center justify-center font-bold">
                                <Handshake className="w-4 h-4" />
                              </div>
                              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                                Chcesz wdrożyć istniejące rozwiązanie?
                              </h4>
                              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                Przejdź do <strong>Innowacje</strong>, aby
                                dostosować gotowy projekt do budżetu i zasobów
                                Twojej gminy.
                              </p>
                            </div>
                            <Link
                              href={
                                turn.matchResponse.top_solution
                                  ? `/middleman?innovation=${encodeURIComponent(
                                      turn.matchResponse.top_solution.id,
                                    )}`
                                  : "/middleman"
                              }
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-amber-400 hover:bg-stone-800 dark:hover:bg-amber-300 text-white dark:text-stone-950 text-xs font-bold rounded-xl transition-all shadow-2xs"
                            >
                              <span>Dostosuj w Innowacjach</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          <div className="p-5 bg-white dark:bg-[#1C1E23] rounded-3xl border border-black/6 dark:border-white/10 shadow-2xs space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white flex items-center justify-center font-bold">
                                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                                Twój pomysł wnosi nowość?
                              </h4>
                              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                Jeśli Twoja wizja różni się od powyższych, zgłoś
                                swój autorski projekt w zakładce{" "}
                                <strong>Zaproponuj</strong>.
                              </p>
                            </div>
                            <Link
                              href={`/propose?problem=${encodeURIComponent(
                                turn.text,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FAF9F5] dark:bg-white/10 hover:bg-stone-100 dark:hover:bg-white/15 border border-black/10 dark:border-white/15 text-stone-900 dark:text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                            >
                              <span>Zgłoś nowy pomysł</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Kontakt z dedykowanym ekspertem ROPS */}
                        {turn.matchResponse.matched_expert && (
                          <div className="p-4 bg-stone-100/70 dark:bg-[#1C1E23] border border-black/5 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-[#EFE5C6] dark:text-stone-950" />
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 dark:text-white block">
                                  Ekspert ROPS Kraków:{" "}
                                  {turn.matchResponse.matched_expert.name}
                                </span>
                                <span className="text-stone-500 dark:text-stone-400 text-[11px] block">
                                  {turn.matchResponse.matched_expert.title} •{" "}
                                  {
                                    turn.matchResponse.matched_expert
                                      .specialization
                                  }
                                </span>
                              </div>
                            </div>

                            <Link
                              href={`/chat?topic=${encodeURIComponent(
                                `Konsultacja pomysłu: ${turn.text.slice(0, 50)}...`,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-950 rounded-xl font-semibold transition-colors shrink-0 text-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Napisz do eksperta</span>
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Stan ładowania / analizy */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-950 flex items-center justify-center shrink-0 mt-1 shadow-2xs font-ubuntu font-bold text-sm">
                m
              </div>
              <div className="p-4 sm:p-5 bg-white dark:bg-[#1C1E23] border border-black/5 dark:border-white/10 rounded-3xl space-y-2.5 shadow-2xs max-w-md">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-white">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-stone-500 dark:text-stone-400" />
                  <span>Przeszukuję bazę innowacji ROPS Kraków...</span>
                </div>
                <div className="space-y-1.5 animate-pulse pt-1">
                  <div className="h-2 bg-stone-200 dark:bg-white/20 rounded-full w-4/5"></div>
                  <div className="h-2 bg-stone-200 dark:bg-white/20 rounded-full w-full"></div>
                  <div className="h-2 bg-stone-200 dark:bg-white/20 rounded-full w-3/5"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dolne Pole Chatu AI (Wewnątrz kontenera, STICKY NA DOLE) */}
        <div className="sticky bottom-0 z-10 p-3 sm:p-4 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0]/85 to-transparent dark:from-[#141518] dark:via-[#141518]/90 backdrop-blur-xs">
          <div className="relative">
            {/* Popup z animacją fal mowy podczas dyktowania */}
            <VoiceDictationPopup
              isListening={isListening}
              audioStream={audioStream}
              interimTranscript={interimTranscript}
              errorMessage={voiceError}
              onFinish={handleFinishVoice}
              onCancel={handleCancelVoice}
            />

            {/* Klasyczne pole czatu AI */}
            <div className="bg-white/95 dark:bg-[#1C1E23] backdrop-blur-xs rounded-2xl border border-black/8 dark:border-white/10 shadow-2xs p-3 sm:p-3.5 focus-within:ring-2 focus-within:ring-stone-900/10 dark:focus-within:ring-white/15 focus-within:border-stone-900/30 dark:focus-within:border-white/25 transition-all flex flex-col justify-between gap-2.5">
              <textarea
                id="idea-input"
                ref={inputRef}
                rows={2}
                value={inputIdea}
                onChange={(e) => setInputIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isListening
                    ? "Słucham... opisz swój pomysł na innowację..."
                    : "Napisz swój pomysł na innowację społeczną..."
                }
                disabled={isLoading}
                className="w-full bg-transparent border-0 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm sm:text-base leading-relaxed focus:outline-none resize-none max-h-32"
              />

              {/* Dolna belka akcji czatu */}
              <div className="flex items-center justify-between pt-2 border-t border-black/4 dark:border-white/10">
                {/* Przycisk dyktowania głosowego (inny button) */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isLoading}
                  aria-label={
                    isListening
                      ? "Zatrzymaj dyktowanie głosowe"
                      : "Rozpocznij dyktowanie pomysłu głosem"
                  }
                  aria-pressed={isListening}
                  className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-600 text-white shadow-xs animate-pulse"
                      : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200/80 dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white border border-black/5 dark:border-white/10"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Zatrzymaj</span>
                    </>
                  ) : (
                    <>
                      <Mic
                        className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400"
                        aria-hidden="true"
                      />
                      <span>Dyktuj</span>
                    </>
                  )}
                </button>

                {/* Przycisk wysyłania (ArrowUp) po prawej */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputIdea.trim()}
                  aria-label="Wyślij zapytanie do inteligentnej bazy wiedzy"
                  title="Wyślij pomysł (Enter)"
                  className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-full bg-stone-900 dark:bg-amber-400 hover:bg-stone-800 dark:hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-stone-900 dark:disabled:hover:bg-amber-400 text-white dark:text-stone-950 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <RotateCcw
                      className="w-4 h-4 animate-spin text-[#EFE5C6] dark:text-stone-950"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowUp
                      className="w-4 h-4 stroke-[2.5]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProblemMatchingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-stone-400">
          Ładowanie asystenta innowacji...
        </div>
      }
    >
      <MatchingContent />
    </Suspense>
  );
}
