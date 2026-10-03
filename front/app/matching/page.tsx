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
  const { matchingMessages: messages, setMatchingMessages: setMessages } = useApp();

  const [inputIdea, setInputIdea] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Jeśli w URL podano parametr ?q=, wykonaj automatyczne wyszukiwanie
  useEffect(() => {
    if (initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
    }
  }, [initialQuery]);

  return (
    <div className="py-1 sm:py-2 px-4 sm:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col h-[calc(100vh-4.8rem)] animate-in fade-in duration-200">
      {/* Jedyny Główny Kontener Czatu AI z Gradientem (Pełna Dostępna Wysokość) */}
      <div
        className="rounded-3xl border border-black/6 shadow-sm overflow-hidden flex flex-col flex-1 h-full min-h-0 relative"
        style={{
          background:
            "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
        }}
      >
        {/* Górny pasek z przyciskiem resetu, gdy są wiadomości */}
        {messages.length > 0 && (
          <div className="flex items-center justify-end px-5 pt-3.5 pb-1 shrink-0">
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-black/5 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Nowa rozmowa</span>
            </button>
          </div>
        )}

        {/* Obszar Odpowiedzi z Bazy Wektorowej / Modelu (GÓRA) */}
        <div className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto min-h-0">
          {/* Stan początkowy (przed zadaniem pytania) */}
          {messages.length === 0 && (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center space-y-3.5 p-4 my-auto select-none">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-6 h-6 text-[#EFE5C6]" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[0.98]">
                <span className="block text-stone-900">
                  Sprawdź, czy Twój pomysł
                </span>
                <span className="block text-stone-300">już istnieje</span>
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto pt-1">
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
                    <div className="bg-stone-900 text-white rounded-3xl rounded-tr-md px-5 py-3.5 text-sm sm:text-base leading-relaxed shadow-xs">
                      <p className="whitespace-pre-wrap">{turn.text}</p>
                      <span className="block text-[10px] text-stone-400 mt-1.5 text-right font-mono">
                        {turn.timestamp}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Odpowiedź asystenta / modelu / bazy wektorowej */
                <div className="flex items-start gap-3 max-w-full">
                  <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs font-ubuntu font-bold text-sm">
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
                                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                  : "bg-amber-50/70 border-amber-200 text-amber-900"
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
                                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 border border-black/5 text-xs font-bold shadow-2xs">
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
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
                          <div className="rounded-3xl p-5 sm:p-7 bg-white/95 border border-black/6 shadow-sm space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-3">
                              <span className="px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs w-fit">
                                <Sparkles className="w-3 h-3 text-[#EFE5C6]" />
                                <span>
                                  Najbardziej zbliżona innowacja w bazie
                                </span>
                              </span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                Baza: Katalog Innowacji ROPS Kraków
                              </span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                              {turn.matchResponse.top_solution.title}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-stone-700">
                              <div className="bg-white/90 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5">
                                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Na czym polega to rozwiązanie?</span>
                                </span>
                                <p className="text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                                  {turn.matchResponse.top_solution.solution}
                                </p>
                              </div>

                              <div className="bg-white/90 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5">
                                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                                  <span>Jaki problem rozwiązuje?</span>
                                </span>
                                <p className="text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                                  {turn.matchResponse.top_solution
                                    .problem_statement ||
                                    "Brak szczegółowego opisu problemu."}
                                </p>
                              </div>

                              {turn.matchResponse.top_solution.target_group && (
                                <div className="bg-white/90 rounded-2xl p-3.5 border border-black/5 shadow-2xs space-y-1 md:col-span-2">
                                  <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                    <Users2 className="w-3.5 h-3.5 text-stone-500" />
                                    <span>Grupa docelowa:</span>
                                  </span>
                                  <p className="text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                                    {
                                      turn.matchResponse.top_solution
                                        .target_group
                                    }
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
                              <span className="text-xs text-stone-500">
                                Możesz zaadaptować to rozwiązanie dla swojej
                                instytucji lub gminy.
                              </span>

                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/middleman?innovation=${encodeURIComponent(
                                    turn.matchResponse.top_solution.id,
                                  )}`}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EFE5C6] hover:bg-[#E7DAC0] text-stone-900 text-xs font-bold rounded-xl transition-all shadow-2xs"
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
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs"
                                  >
                                    <span>Karta innowacji ROPS</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Analiza i wskazówki asystenta */}
                        {turn.text && (
                          <div className="bg-white rounded-3xl border border-black/6 p-5 sm:p-6 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 border-b border-black/5 pb-2.5">
                              <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-stone-900">
                                <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                              </div>
                              <span>Wnioski i wskazówki asystenta</span>
                            </div>

                            <div className="text-sm text-stone-700 leading-relaxed font-normal">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ ...props }) => (
                                    <h3
                                      className="text-base font-bold text-stone-900 mt-4 mb-2 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  h2: ({ ...props }) => (
                                    <h3
                                      className="text-base font-bold text-stone-900 mt-4 mb-2 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  h3: ({ ...props }) => (
                                    <h4
                                      className="text-sm font-bold text-stone-900 mt-3 mb-1.5 first:mt-0"
                                      {...props}
                                    />
                                  ),
                                  p: ({ ...props }) => (
                                    <p
                                      className="mb-2 leading-relaxed text-stone-700 last:mb-0"
                                      {...props}
                                    />
                                  ),
                                  ul: ({ ...props }) => (
                                    <ul
                                      className="list-disc list-outside pl-5 space-y-1.5 my-2 text-stone-700"
                                      {...props}
                                    />
                                  ),
                                  ol: ({ ...props }) => (
                                    <ol
                                      className="list-decimal list-outside pl-5 space-y-1.5 my-2 text-stone-700"
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
                                      className="font-semibold text-stone-950"
                                      {...props}
                                    />
                                  ),
                                  a: ({ href, children, ...props }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-stone-900 font-semibold underline underline-offset-4 hover:text-stone-700 inline-flex items-center gap-1"
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
                            <div className="bg-white rounded-3xl border border-black/6 p-5 sm:p-6 shadow-2xs space-y-3.5">
                              <div className="flex items-center gap-2 border-b border-black/5 pb-2.5">
                                <Layers className="w-4 h-4 text-stone-600" />
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                  Inne powiązane innowacje w bazie (
                                  {turn.matchResponse.close_solutions.length})
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {turn.matchResponse.close_solutions.map(
                                  (alt: InnovationMatchItem) => (
                                    <div
                                      key={alt.id}
                                      className="p-3.5 bg-[#FAF9F5] border border-black/5 rounded-2xl space-y-2 flex flex-col justify-between text-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <h5 className="font-bold text-stone-900 text-sm line-clamp-2">
                                            {alt.title}
                                          </h5>
                                          <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                                            {alt.similarity_percentage}
                                          </span>
                                        </div>
                                        <p className="text-stone-600 leading-relaxed line-clamp-3">
                                          {alt.solution}
                                        </p>
                                      </div>

                                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5">
                                        <Link
                                          href={`/middleman?innovation=${encodeURIComponent(
                                            alt.id,
                                          )}`}
                                          className="inline-flex items-center gap-1 font-semibold text-stone-900 hover:text-stone-700"
                                        >
                                          <span>Dostosuj w Innowacjach</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </Link>
                                        {alt.url && (
                                          <a
                                            href={alt.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-stone-500 hover:text-stone-800"
                                            title="Dokumentacja ROPS"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {/* Dwie ścieżki decyzyjne */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                          <div className="p-5 bg-white rounded-3xl border border-black/6 shadow-2xs space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center font-bold">
                                <Handshake className="w-4 h-4" />
                              </div>
                              <h4 className="text-sm font-bold text-stone-900">
                                Chcesz wdrożyć istniejące rozwiązanie?
                              </h4>
                              <p className="text-xs text-stone-600 leading-relaxed">
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
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                            >
                              <span>Dostosuj w Innowacjach</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          <div className="p-5 bg-white rounded-3xl border border-black/6 shadow-2xs space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold">
                                <Lightbulb className="w-4 h-4 text-amber-600" />
                              </div>
                              <h4 className="text-sm font-bold text-stone-900">
                                Twój pomysł wnosi nowość?
                              </h4>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                Jeśli Twoja wizja różni się od powyższych, zgłoś
                                swój autorski projekt w zakładce{" "}
                                <strong>Zaproponuj</strong>.
                              </p>
                            </div>
                            <Link
                              href={`/propose?problem=${encodeURIComponent(
                                turn.text,
                              )}`}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FAF9F5] hover:bg-stone-100 border border-black/10 text-stone-900 text-xs font-bold rounded-xl transition-all shadow-2xs"
                            >
                              <span>Zgłoś nowy pomysł</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        {/* Kontakt z dedykowanym ekspertem ROPS */}
                        {turn.matchResponse.matched_expert && (
                          <div className="p-4 bg-stone-100/70 border border-black/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-[#EFE5C6]" />
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 block">
                                  Ekspert ROPS Kraków:{" "}
                                  {turn.matchResponse.matched_expert.name}
                                </span>
                                <span className="text-stone-500 text-[11px] block">
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
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors shrink-0 text-xs"
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
              <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs font-ubuntu font-bold text-sm">
                m
              </div>
              <div className="p-4 sm:p-5 bg-white border border-black/5 rounded-3xl space-y-2.5 shadow-2xs max-w-md">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-stone-500" />
                  <span>Przeszukuję bazę innowacji ROPS Kraków...</span>
                </div>
                <div className="space-y-1.5 animate-pulse pt-1">
                  <div className="h-2 bg-stone-200 rounded-full w-4/5"></div>
                  <div className="h-2 bg-stone-200 rounded-full w-full"></div>
                  <div className="h-2 bg-stone-200 rounded-full w-3/5"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dolne Pole Chatu AI (Wewnątrz kontenera, STICKY NA DOLE) */}
        <div className="sticky bottom-0 z-10 p-3 sm:p-4 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0]/85 to-transparent backdrop-blur-xs">
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
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl border border-black/8 shadow-2xs p-3 sm:p-3.5 focus-within:ring-2 focus-within:ring-stone-900/10 focus-within:border-stone-900/30 transition-all flex flex-col justify-between gap-2.5">
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
                className="w-full bg-transparent border-0 text-stone-900 placeholder:text-stone-400 text-sm sm:text-base leading-relaxed focus:outline-none resize-none max-h-32"
              />

              {/* Dolna belka akcji czatu */}
              <div className="flex items-center justify-between pt-2 border-t border-black/4">
                {/* Przycisk dyktowania głosowego (inny button) */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={isLoading}
                  title={
                    isListening
                      ? "Zatrzymaj dyktowanie"
                      : "Dyktuj pomysł głosem"
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-600 text-white shadow-xs animate-pulse"
                      : "bg-stone-100 hover:bg-stone-200/80 text-stone-700 hover:text-stone-900 border border-black/5"
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Zatrzymaj</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-stone-600" />
                      <span>Dyktuj</span>
                    </>
                  )}
                </button>

                {/* Przycisk wysyłania (ArrowUp) po prawej */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputIdea.trim()}
                  title="Wyślij pomysł (Enter)"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-stone-900 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                >
                  {isLoading ? (
                    <RotateCcw className="w-4 h-4 animate-spin text-[#EFE5C6]" />
                  ) : (
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
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
