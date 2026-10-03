"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMatchingChat } from "../lib/api";
import { MatchResponse } from "../lib/types";
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
  Handshake,
  MapPin,
  Tag,
  Lightbulb,
  MessageSquare,
  PlusCircle,
  ArrowRight,
  Database,
  Heart,
  Activity,
  Building2,
  Mic,
  MicOff,
} from "lucide-react";
import { VoiceDictationPopup, useSpeechToText } from "../components/voice";

interface ChatTurn {
  id: string;
  sender: "user" | "assistant";
  text: string;
  matchResponse?: MatchResponse;
  timestamp: string;
}

const MALOPOLSKA_POWIATY = [
  "Cała Małopolska",
  "m. Kraków",
  "m. Tarnów",
  "m. Nowy Sącz",
  "powiat bocheński",
  "powiat brzeski",
  "powiat chrzanowski",
  "powiat dąbrowski",
  "powiat gorlicki",
  "powiat krakowski",
  "powiat limanowski",
  "powiat miechowski",
  "powiat myślenicki",
  "powiat nowosądecki",
  "powiat nowotarski",
  "powiat olkuski",
  "powiat oświęcimski",
  "powiat proszowicki",
  "powiat suski",
  "powiat tarnowski",
  "powiat tatrzański",
  "powiat wadowicki",
  "powiat wielicki",
];

const QUICK_CATEGORIES = [
  {
    label: "Samotność i izolacja",
    query: "Jak przeciwdziałać samotności seniorów i zintegrować sąsiadów?",
    icon: Heart,
  },
  {
    label: "Opieka nad seniorem",
    query:
      "Wsparcie w codziennej domowej opiece nad niesamodzielną osobą starszą",
    icon: Users2,
  },
  {
    label: "Bariery i dostępność",
    query: "Likwidacja barier architektonicznych w bloku i dostęp do usług",
    icon: Compass,
  },
  {
    label: "Transport i dojazd",
    query:
      "Trudności z dojazdem seniorów do przychodni i lekarza w małych miejscowościach",
    icon: ArrowUpRight,
  },
  {
    label: "Zdrowie i leki",
    query:
      "Prawidłowe dawkowanie leków i wsparcie rehabilitacji ruchowej w domu",
    icon: Activity,
  },
  {
    label: "Cyfryzacja bez lęku",
    query:
      "Prosta nauka obsługi smartfona i załatwiania spraw online dla seniora",
    icon: Sparkles,
  },
];

const REPORTER_ROLES = [
  "Senior / Seniorka",
  "Opiekun / Rodzina",
  "Mieszkaniec",
  "Pracownik socjalny / OPS",
];

export default function ProblemMatchingPage() {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState("");
  const [selectedPowiat, setSelectedPowiat] = useState("Cała Małopolska");
  const [selectedRole, setSelectedRole] = useState("Senior / Seniorka");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [expandedAlternatives, setExpandedAlternatives] = useState<
    Record<string, boolean>
  >({});
  const [expandedAdminTrace, setExpandedAdminTrace] = useState<
    Record<string, boolean>
  >({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setInputMessage(text);
    },
  });

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setInitialTextBeforeDictation(inputMessage);
      startListening(inputMessage);
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
    const q = (textToSend || inputMessage).trim();
    if (!q || isLoading) return;

    const userTurnId = `user-${Date.now()}`;
    const newMessages: ChatTurn[] = [
      ...messages,
      {
        id: userTurnId,
        sender: "user",
        text: q,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyForBackend = messages.map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: m.text,
      }));

      const response = await sendMatchingChat(q, historyForBackend, {
        category: selectedCategory || undefined,
        powiat:
          selectedPowiat !== "Cała Małopolska" ? selectedPowiat : undefined,
        reporterType: selectedRole,
      });

      setMessages([
        ...newMessages,
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
      setMessages([
        ...newMessages,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          text: `Przepraszamy, wystąpił problem podczas łączenia z silnikiem matchingu: ${
            err?.message || "Nieznany błąd serwera."
          }. Zapewnij, że backend jest uruchomiony i spróbuj ponownie.`,
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

  const toggleAlternatives = (turnId: string) => {
    setExpandedAlternatives((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  };

  const toggleAdminTrace = (turnId: string) => {
    setExpandedAdminTrace((prev) => ({
      ...prev,
      [turnId]: !prev[turnId],
    }));
  };

  const handleResetChat = () => {
    if (isListening) {
      stopListening();
    }
    setMessages([]);
    setExpandedAlternatives({});
    setExpandedAdminTrace({});
    setInputMessage("");
    setSelectedCategory(null);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek Sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Asystent</span>
            <span className="block text-stone-300">
              Innowacji i Potrzeb
            </span>
          </div>
          <p className="text-stone-500 text-xs sm:text-sm mt-2 max-w-xl">
            Opisz wyzwanie społeczne w swojej okolicy. System dopasuje gotowe
            innowacje ROPS Kraków, zainicjuje kontakt z ekspertem oraz
            zarejestruje problem w małopolskim Zasobniku potrzeb.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-black/5 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Nowa rozmowa</span>
          </button>
        )}
      </div>

      {/* Ekran Początkowy / Podpowiedzi dla seniorów i mieszkańców */}
      {messages.length === 0 && (
        <div
          className="rounded-[32px] p-6 sm:p-10 border border-black/5 shadow-2xs flex flex-col gap-8 items-center mx-auto"
          style={{
            background:
              "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-7 h-7 text-[#EFE5C6]" />
          </div>

          <div className="max-w-xl text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              W czym możemy dzisiaj pomóc?
            </h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              Wybierz gotowy temat lub opisz problem własnymi słowami w polu
              poniżej.
            </p>
          </div>

          {/* Szybkie kafle tematów (duże, czytelne dla seniora) */}
          <div className="w-full max-w-4xl space-y-3 pt-1">
            {/* <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block text-center">
              Wybierz najczęstszy obszar lub wpisz własne wyzwanie:
            </span> */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_CATEGORIES.map((cat, idx) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      }
                      setSelectedCategory(cat.label);
                      setInputMessage(cat.query);
                    }}
                    className="p-4 bg-white/90 hover:bg-white border border-black/5 hover:border-black/15 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer flex items-start gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-stone-900 group-hover:text-white text-stone-700 flex items-center justify-center shrink-0 transition-colors mt-0.5 border border-amber-200/50 group-hover:border-transparent">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block leading-tight mb-1">
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-stone-500 leading-snug line-clamp-2">
                        {cat.query}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div> */}
          </div>
        </div>
      )}

      {/* Wątek Wiadomości Czatu */}
      {messages.length > 0 && (
        <div className="space-y-8 min-h-[300px]">
          {messages.map((turn) => (
            <div key={turn.id} className="space-y-4">
              {/* Wiadomość Użytkownika */}
              {turn.sender === "user" ? (
                <div className="flex justify-end">
                  <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-stone-900 text-white rounded-3xl rounded-tr-md p-4 sm:p-5 shadow-xs text-sm sm:text-base leading-relaxed font-normal">
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
                    {/* Wskaźnik weryfikacji bez technicznego żargonu */}
                    {turn.matchResponse && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-white border border-black/5 text-xs text-stone-500 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Zweryfikowano z bazą ROPS Kraków
                          </span>
                          {turn.matchResponse.saved_problem_id && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Zapisano w Zasobniku potrzeb
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-stone-400 font-medium">
                          Baza: 115 innowacji ROPS
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* 🏆 WYRÓŻNIONY KAFELEK: NAJBLIŻSZE ROZWIĄZANIE (ROPS) */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.top_solution && (
                      <div
                        className="rounded-[28px] p-6 sm:p-8 border border-black/6 shadow-2xs space-y-5 relative overflow-hidden"
                        style={{
                          background:
                            "radial-gradient(circle at 14% 14%, #FAF4E5 0%, #FFFFFF 48%, #FAFAF8 80%, #F5F5F0 100%)",
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-[#EFE5C6]" />
                              <span>
                                Gotowa Innowacja Społeczna ROPS Kraków
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-medium">
                              Trafność dopasowania:
                            </span>
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              {
                                turn.matchResponse.top_solution
                                  .similarity_percentage
                              }
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
                            <p className="line-clamp-3 text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                              {turn.matchResponse.top_solution
                                .problem_statement || "Brak danych w bazie."}
                            </p>
                          </div>

                          <div className="bg-white/85 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              <span>Dofinansowanie / Źródła wsparcia:</span>
                            </span>
                            <p className="line-clamp-3 text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                              {turn.matchResponse.top_solution.funding_info ||
                                "Wsparcie w ramach programów ROPS Kraków i funduszy regionalnych."}
                            </p>
                          </div>

                          {turn.matchResponse.top_solution.target_group && (
                            <div className="bg-white/85 rounded-2xl p-4 border border-black/5 shadow-2xs space-y-1.5 md:col-span-2">
                              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                                <Users2 className="w-3.5 h-3.5 text-stone-500" />
                                <span>Grupa docelowa:</span>
                              </span>
                              <p className="text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                                {turn.matchResponse.top_solution.target_group}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Informacje źródłowe bez zmyślonych linków */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-black/5">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <FileText className="w-3.5 h-3.5 text-stone-400" />
                            <span>
                              Dokumentacja źródłowa:{" "}
                              <strong className="text-stone-700">
                                {turn.matchResponse.top_solution.file_source ||
                                  "Katalog Innowacji Społecznych ROPS Kraków"}
                              </strong>
                            </span>
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
                                <span>Zobacz dokument innowacji</span>
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

                      <div className="text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ ...props }) => (
                              <h3
                                className="text-base font-bold text-stone-900 mt-5 mb-2.5 first:mt-0"
                                {...props}
                              />
                            ),
                            h2: ({ ...props }) => (
                              <h3
                                className="text-base font-bold text-stone-900 mt-5 mb-2.5 first:mt-0"
                                {...props}
                              />
                            ),
                            h3: ({ ...props }) => (
                              <h4
                                className="text-sm font-bold text-stone-900 mt-4 mb-2 first:mt-0 flex items-center gap-1.5"
                                {...props}
                              />
                            ),
                            h4: ({ ...props }) => (
                              <h5
                                className="text-xs font-bold text-stone-900 mt-3 mb-1.5 uppercase tracking-wide"
                                {...props}
                              />
                            ),
                            p: ({ ...props }) => (
                              <p
                                className="mb-3 leading-relaxed text-stone-700 last:mb-0"
                                {...props}
                              />
                            ),
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc list-outside pl-5 space-y-2 my-3 text-stone-700"
                                {...props}
                              />
                            ),
                            ol: ({ ...props }) => (
                              <ol
                                className="list-decimal list-outside pl-5 space-y-2 my-3 text-stone-700"
                                {...props}
                              />
                            ),
                            li: ({ ...props }) => (
                              <li className="leading-relaxed pl-1" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong
                                className="font-semibold text-stone-950"
                                {...props}
                              />
                            ),
                            em: ({ ...props }) => (
                              <em
                                className="italic text-stone-800"
                                {...props}
                              />
                            ),
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
                              <blockquote
                                className="border-l-3 border-[#D4C39E] bg-[#F5EEDC]/40 pl-4 py-2 italic text-stone-700 my-3 rounded-r-xl"
                                {...props}
                              />
                            ),
                            code: ({ ...props }) => (
                              <code
                                className="bg-stone-100 text-stone-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {turn.text}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* 👥 WIĘCEJ ŹRÓDEŁ 1: POMYSŁY MIESZKAŃCÓW (HUBMI) */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.community_ideas &&
                      turn.matchResponse.community_ideas.length > 0 && (
                        <div className="bg-white border border-black/5 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                Oddolne pomysły mieszkańców na platformie Hubmi
                                ({turn.matchResponse.community_ideas.length})
                              </h4>
                            </div>
                            <span className="text-[11px] text-stone-400">
                              Głos społeczności
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {turn.matchResponse.community_ideas.map((idea) => (
                              <div
                                key={idea.id}
                                className="p-3.5 bg-stone-50/70 hover:bg-stone-50 border border-black/5 rounded-xl space-y-1.5 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-stone-900 text-xs line-clamp-1">
                                    {idea.title}
                                  </h5>
                                  {idea.category && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-stone-200/70 text-stone-700 rounded-md shrink-0">
                                      {idea.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                                  {idea.description}
                                </p>
                                {idea.author_name && (
                                  <p className="text-[10px] text-stone-400">
                                    Autor: {idea.author_name}
                                  </p>
                                )}
                                <div className="pt-1">
                                  <Link
                                    href={`/discover?idea=${idea.id}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-900 hover:text-stone-700"
                                  >
                                    <span>Zobacz pomysł w Hubie</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* ======================================================== */}
                    {/* 📊 WIĘCEJ ŹRÓDEŁ 2: PODOBNE ZGŁOSZONE PROBLEMY W MAŁOPOLSCE */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.similar_problems &&
                      turn.matchResponse.similar_problems.length > 0 && (
                        <div className="bg-[#FAF9F5] border border-black/5 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-stone-700" />
                              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                                Podobne zgłoszenia w innych powiatach Małopolski
                                ({turn.matchResponse.similar_problems.length})
                              </h4>
                            </div>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Baza Zasobnika
                            </span>
                          </div>

                          <div className="space-y-2 pt-1">
                            {turn.matchResponse.similar_problems.map((prob) => (
                              <div
                                key={prob.id}
                                className="p-3 bg-white border border-black/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-1 flex-1">
                                  <p className="text-stone-800 font-medium leading-relaxed">
                                    {prob.problem_text}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
                                    {prob.powiat && (
                                      <span className="font-semibold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                                        {prob.powiat}
                                      </span>
                                    )}
                                    {prob.reporter_type && (
                                      <span>Zgłosił: {prob.reporter_type}</span>
                                    )}
                                    <span>Status: {prob.status}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* ======================================================== */}
                    {/* 👩‍💼 WIĘCEJ ŹRÓDEŁ 3: DEDYKOWANY EKSPERT ROPS KRAKÓW */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.matched_expert && (
                      <div className="bg-gradient-to-r from-amber-50/70 to-stone-50 border border-amber-200/50 rounded-[24px] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                            <Building2 className="w-5 h-5 text-[#EFE5C6]" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-amber-100/80 px-2 py-0.5 rounded-md">
                                Dedykowany ekspert regionalny
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-stone-900">
                              {turn.matchResponse.matched_expert.name}
                            </h4>
                            <p className="text-xs text-stone-600">
                              {turn.matchResponse.matched_expert.title} •{" "}
                              {turn.matchResponse.matched_expert.department}
                            </p>
                            <p className="text-[11px] text-stone-500 pt-0.5">
                              Specjalizacja:{" "}
                              <em>
                                {
                                  turn.matchResponse.matched_expert
                                    .specialization
                                }
                              </em>
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/chat?topic=${encodeURIComponent(turn.matchResponse.matched_expert.chat_topic)}`}
                          className="shrink-0 inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Napisz do eksperta</span>
                        </Link>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* 🚀 ŚCIEŻKA DALSZEGO DZIAŁANIA (NEXT ACTIONS - BRAK ŚLEPEJ ULICZKI) */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.next_actions &&
                      turn.matchResponse.next_actions.length > 0 && (
                        <div className="bg-white border border-black/5 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3.5">
                          <div className="flex items-center gap-2 border-b border-black/5 pb-2.5">
                            <Compass className="w-4 h-4 text-stone-700" />
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                              Rekomendowane kolejne kroki
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {turn.matchResponse.next_actions.map((act) => (
                              <div
                                key={act.action_id}
                                className="p-4 rounded-xl border border-black/5 bg-[#FAF9F5] hover:bg-stone-50 transition-colors flex flex-col justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="font-bold text-stone-900">
                                      {act.title}
                                    </h5>
                                    {act.badge && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                        {act.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-600 leading-relaxed">
                                    {act.description}
                                  </p>
                                </div>

                                <Link
                                  href={act.url}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors text-center"
                                >
                                  <span>{act.button_label}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* ======================================================== */}
                    {/* ALTERNATYWNE ROZWIĄZANIA (DO 5%) */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.close_solutions &&
                      turn.matchResponse.close_solutions.length > 0 && (
                        <div className="border border-black/5 rounded-2xl bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => toggleAlternatives(turn.id)}
                            className="w-full p-4 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-50/80 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-stone-500" />
                              <span>
                                Inne zbliżone innowacje ROPS (
                                {turn.matchResponse.close_solutions.length})
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
                                    <h4 className="font-bold text-stone-900">
                                      {alt.title}
                                    </h4>
                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 text-[11px]">
                                      {alt.similarity_percentage}
                                    </span>
                                  </div>
                                  <p className="text-stone-600 leading-relaxed line-clamp-2">
                                    {alt.solution}
                                  </p>
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
                                        <span>Szczegóły innowacji</span>
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

                    {/* ======================================================== */}
                    {/* 🔧 ŚLAD TECHNICZNY (TYLKO DLA EWALUATORA / ADMINA) */}
                    {/* ======================================================== */}
                    {turn.matchResponse?.trace &&
                      turn.matchResponse.trace.length > 0 && (
                        <div className="border border-black/5 rounded-xl bg-stone-50/60 overflow-hidden text-xs">
                          <button
                            onClick={() => toggleAdminTrace(turn.id)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>
                                Szczegóły wykonania i trace (
                                {turn.matchResponse.total_duration_ms} ms,
                                filtr: {turn.matchResponse.guardrail_status})
                              </span>
                            </div>
                            {expandedAdminTrace[turn.id] ? (
                              <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                            )}
                          </button>

                          {expandedAdminTrace[turn.id] && (
                            <div className="p-3 border-t border-black/5 bg-white space-y-2 font-mono text-[11px]">
                              {turn.matchResponse.trace.map((step) => (
                                <div
                                  key={step.step_number}
                                  className="flex items-start justify-between gap-2 text-stone-600 border-b border-stone-100 pb-1 last:border-b-0"
                                >
                                  <div>
                                    <span className="text-stone-400">
                                      #{step.step_number}
                                    </span>{" "}
                                    <strong className="text-stone-800">
                                      {step.name}
                                    </strong>
                                    : {step.status}
                                  </div>
                                  <span className="text-stone-400 shrink-0">
                                    {step.duration_ms} ms
                                  </span>
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
                  <span>
                    Dopasowuję innowacje, ekspertów i potrzeby regionalne...
                  </span>
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

      {/* Dolny Pasek Wprowadzania Wiadomości (Senior-Friendly Sticky Bar) */}
      <div className="sticky bottom-4 z-20 space-y-2">
        {/* Pasek pomocniczy: Wybór Powiatu i Roli zgłaszającego */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-black/6 shadow-xs p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-500" />
              Lokalizacja:
            </span>
            <select
              value={selectedPowiat}
              onChange={(e) => setSelectedPowiat(e.target.value)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200/70 border border-black/5 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none transition-colors cursor-pointer"
            >
              {MALOPOLSKA_POWIATY.map((pow) => (
                <option key={pow} value={pow}>
                  {pow}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-stone-500" />
              Zgłaszający:
            </span>
            <div className="flex items-center gap-1">
              {REPORTER_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedRole === role
                      ? "bg-stone-900 text-white shadow-2xs"
                      : "bg-stone-100 hover:bg-stone-200/70 text-stone-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Formularz wprowadzania pytania */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-black/6 shadow-lg p-2 focus-within:ring-2 focus-within:ring-stone-900/10 focus-within:border-stone-900/30 transition-all"
        >
          {/* Popup z animowanymi falami dźwiękowymi podczas dyktowania */}
          <VoiceDictationPopup
            isListening={isListening}
            audioStream={audioStream}
            interimTranscript={interimTranscript}
            errorMessage={voiceError}
            onFinish={handleFinishVoice}
            onCancel={handleCancelVoice}
          />

          <div className="flex items-center gap-2">
            {/* Pole tekstowe */}
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isListening
                  ? "Słucham... powiedz swoje zapytanie..."
                  : "Opisz problem lub potrzebę (np. samotność seniorów na wsi, brak dojazdu do lekarza)..."
              }
              disabled={isLoading}
              className="flex-1 px-3 py-2.5 bg-transparent text-sm sm:text-base font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:opacity-50"
            />

            {/* Przycisk mikrofonu do dyktowania głosem */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isLoading}
              title={
                isListening
                  ? "Zakończ dyktowanie głosowe"
                  : "Dyktuj zapytanie mikrofonem"
              }
              aria-label={
                isListening
                  ? "Zakończ dyktowanie głosowe"
                  : "Dyktuj zapytanie mikrofonem"
              }
              className={`relative p-3 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                isListening
                  ? "bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/15"
                  : "bg-stone-100 hover:bg-stone-200/80 text-stone-700 hover:text-stone-900 border border-black/5 active:scale-95"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {/* Przycisk wysłania */}
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Dopasowuję...</span>
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
