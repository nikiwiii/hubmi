"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  ArrowRight,
  MapPin,
  FileText,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  X,
  MessageSquareText,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { getAllResearches, ResearchInfo } from "../../lib/researchData";

export interface MatchedResearchItem {
  research: ResearchInfo;
  matchScore: number;
  relevanceReason: string;
  suggestedFocus: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  displayedText?: string;
  isTyping?: boolean;
  matchedResearches?: MatchedResearchItem[];
  followUpTip?: string;
  timestamp: string;
}

export interface ResearchAIChatProps {
  onClose?: () => void;
}

export function ResearchAIChat({ onClose }: ResearchAIChatProps = {}) {
  const router = useRouter();
  const allResearches = getAllResearches();

  const [inputQuery, setInputQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "reports">("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Dzień dobry! Jestem doradcą danych społecznych Małopolski. Jeśli masz pomysł na innowację społeczną, opisz go swoimi słowami. Przeanalizuję bazę badań i wskaźników ROPS Kraków, aby wskazać raporty uzasadniające Twój projekt oraz powiaty, w których problem jest najbardziej palący.",
      displayedText:
        "Dzień dobry! Jestem doradcą danych społecznych Małopolski. Jeśli masz pomysł na innowację społeczną, opisz go swoimi słowami. Przeanalizuję bazę badań i wskaźników ROPS Kraków, aby wskazać raporty uzasadniające Twój projekt oraz powiaty, w których problem jest najbardziej palący.",
      isTyping: false,
      timestamp: "Teraz",
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (smooth = true) => {
    if (!shouldAutoScrollRef.current) return;
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages, isAnalyzing]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Animacja pisania tekstu przez AI na wzór człowieka
  const typeMessage = (msgId: string, fullText: string) => {
    let index = 0;

    const typeNext = () => {
      if (index < fullText.length) {
        // Naturalne tempo człowieka: 2 do 4 znaków na raz
        const step = Math.min(
          Math.floor(Math.random() * 3) + 2,
          fullText.length - index,
        );
        index += step;
        const currentSlice = fullText.slice(0, index);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, displayedText: currentSlice } : m,
          ),
        );

        scrollToBottom(false);

        // Zróżnicowane opóźnienia: naturalna pauza na znakach interpunkcyjnych
        const lastChar = currentSlice[currentSlice.length - 1];
        let delay = 12 + Math.floor(Math.random() * 12);
        if (lastChar === "." || lastChar === "!" || lastChar === "?") {
          delay += 75;
        } else if (lastChar === "," || lastChar === ":") {
          delay += 40;
        }

        typingTimeoutRef.current = setTimeout(typeNext, delay);
      } else {
        // Zakończenie pisania
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, displayedText: fullText, isTyping: false }
              : m,
          ),
        );
        typingTimeoutRef.current = null;
        setTimeout(() => scrollToBottom(true), 60);
      }
    };

    typeNext();
  };

  // Inteligentne dopasowanie semantyczne raportów do opisanego pomysłu
  const findRelevantResearches = (userText: string) => {
    const text = userText.toLowerCase();

    const matches: MatchedResearchItem[] = [];

    allResearches.forEach((r) => {
      let score = 30; // base relevance
      let reason = "Ogólna spójność z obszarem diagnoz społecznych Małopolski.";
      let focus = `Warto zbadać sytuację w powiecie ${r.summary.topCounty.name.replace("Powiat ", "")}, gdzie wskaźnik wynosi ${r.summary.topCounty.value} ${r.unit}.`;

      // Reguły semantyczne oparte na tematyce diagnozy
      if (
        r.id === "senior_dependency_ratio" ||
        r.titlePl.toLowerCase().includes("senior")
      ) {
        if (
          text.includes("senior") ||
          text.includes("starsz") ||
          text.includes("wiek") ||
          text.includes("emeryt") ||
          text.includes("samotn") ||
          text.includes("babci") ||
          text.includes("dziadk") ||
          text.includes("klub") ||
          text.includes("opiek")
        ) {
          score = 96;
          reason =
            "Twój pomysł idealnie wpisuje się w wyzwanie starzenia się populacji i rosnącego indeksu starości.";
          focus = `Szczególnie wysoki współczynnik obciążenia osobami starszymi wykazują powiaty ościenne (średnia regionu: ${r.summary.endAvg} ${r.unit}).`;
        }
      } else if (
        r.id === "registered_unemployment" ||
        r.titlePl.toLowerCase().includes("bezroboc")
      ) {
        if (
          text.includes("prac") ||
          text.includes("bezroboc") ||
          text.includes("zatrudn") ||
          text.includes("kurs") ||
          text.includes("zawod") ||
          text.includes("staż") ||
          text.includes("młod") ||
          text.includes("aktywizac")
        ) {
          score = 94;
          reason =
            "Projekt odpowiada na lokalne nierówności na rynku pracy i potrzebę podnoszenia kwalifikacji zawodowych.";
          focus = `Stopa bezrobocia w Małopolsce wynosi średnio ${r.summary.endAvg} ${r.unit}, ale w najbardziej dotkniętych powiatach jest niemal trzykrotnie wyższa niż w Krakowie.`;
        }
      } else if (
        r.id === "average_hospital_stay" ||
        r.titlePl.toLowerCase().includes("szpital")
      ) {
        if (
          text.includes("zdrow") ||
          text.includes("szpital") ||
          text.includes("pacjent") ||
          text.includes("lecz") ||
          text.includes("rehabilitac") ||
          text.includes("chorob") ||
          text.includes("medycz")
        ) {
          score = 92;
          reason =
            "Inicjatywa wspiera opiekę poszpitalną i profilaktykę zdrowotną, odciążając regionalny system lecznictwa.";
          focus = `Średni pobyt pacjenta w szpitalach Małopolski wynosi ${r.summary.endAvg} ${r.unit}. Dłuższa hospitalizacja często wynika z braku wsparcia środowiskowego.`;
        }
      } else if (
        r.id === "average_monthly_gross_pay" ||
        r.titlePl.toLowerCase().includes("wynagrodz")
      ) {
        if (
          text.includes("pieniądz") ||
          text.includes("zarob") ||
          text.includes("płac") ||
          text.includes("dochod") ||
          text.includes("bied") ||
          text.includes("ubóstw") ||
          text.includes("rodzin") ||
          text.includes("wsparci") ||
          text.includes("koszt")
        ) {
          score = 91;
          reason =
            "Projekt przyczynia się do niwelowania dysproporcji dochodowych i wsparcia rodzin o niższych zasobach materialnych.";
          focus = `Przeciętne wynagrodzenie w regionie osiąga ${r.summary.endAvg} ${r.unit}, jednak różnice między metropolią a powiatami peryferyjnymi sięgają ponad 30%.`;
        }
      }

      matches.push({
        research: r,
        matchScore: score,
        relevanceReason: reason,
        suggestedFocus: focus,
      });
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches.slice(0, 2);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isAnalyzing) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    shouldAutoScrollRef.current = true;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: query,
      displayedText: query,
      isTyping: false,
      timestamp: "Teraz",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsAnalyzing(true);
    setMobileTab("chat");

    setTimeout(() => {
      const topMatches = findRelevantResearches(query);
      const primary = topMatches[0];

      let assistantText = "";
      if (primary && primary.matchScore >= 80) {
        assistantText = `Świetny pomysł! Przeanalizowałem bazę diagnoz społecznych Małopolski. Twój plan ma mocne uzasadnienie w badaniach ROPS – odpowiada na udokumentowane wyzwanie społeczne w regionie. W panelu obok przygotowałem szczegółowe raporty i wskaźniki powiatowe, które warto załączyć do wniosku:`;
      } else {
        assistantText = `Ciekawa koncepcja innowacji społecznej. Choć Twój pomysł dotyka interdyscyplinarnych zagadnień, najsilniejsze powiązania demograficzne i społeczne w regionie wykazują poniższe diagnozy ROPS Kraków (widoczne w panelu obok):`;
      }

      const assistantMsgId = `ai-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: "assistant",
        text: assistantText,
        displayedText: "",
        isTyping: true,
        matchedResearches: topMatches,
        followUpTip:
          "Wskazówka: Możesz kliknąć w kartę raportu, aby zobaczyć interaktywną mapę wszystkich 22 powiatów i sprawdzić dokładne wskaźniki dla Twojej gminy.",
        timestamp: "Przed chwilą",
      };

      setIsAnalyzing(false);
      setMessages((prev) => [...prev, assistantMsg]);

      typeMessage(assistantMsgId, assistantText);
    }, 600);
  };

  const handleResetChat = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    shouldAutoScrollRef.current = false;
    setIsAnalyzing(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: "Rozpocząłem nową sesję. Opowiedz o kolejnym pomyśle na innowację społeczną, a dobiorę do niego odpowiednie raporty z bazy wiedzy ROPS.",
        displayedText:
          "Rozpocząłem nową sesję. Opowiedz o kolejnym pomyśle na innowację społeczną, a dobiorę do niego odpowiednie raporty z bazy wiedzy ROPS.",
        isTyping: false,
        timestamp: "Teraz",
      },
    ]);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Wyodrębnij ostatnie dopasowane raporty z historii wiadomości (separacja raportów od czatu)
  const latestAssistantMsgWithMatches = [...messages]
    .reverse()
    .find(
      (m) =>
        m.sender === "assistant" &&
        m.matchedResearches &&
        m.matchedResearches.length > 0,
    );

  const activeMatches = latestAssistantMsgWithMatches?.matchedResearches || [];
  const isLatestTyping = latestAssistantMsgWithMatches?.isTyping;
  const activeTip = latestAssistantMsgWithMatches?.followUpTip;

  return (
    <div className="bg-white rounded-[28px] border border-stone-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Pasek górny doradcy AI */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-2xs font-bold shrink-0">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-xl font-bold text-stone-900">
                Czat
              </h3>
            </div>
          </div>
        </div>

        {/* Prawa strona paska górnego: przełącznik mobilny oraz akcje */}
        <div className="flex items-center gap-2">
          {/* Przełącznik zakładek na urządzeniach mobilnych */}
          <div className="flex lg:hidden bg-stone-200/70 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setMobileTab("chat")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${mobileTab === "chat"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
                }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Czat</span>
            </button>
            <button
              onClick={() => setMobileTab("reports")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${mobileTab === "reports"
                ? "bg-white text-stone-900 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raporty ({activeMatches.length})</span>
            </button>
          </div>

          <button
            onClick={handleResetChat}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-medium"
            title="Rozpocznij nowy pomysł"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nowy pomysł</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1 font-medium"
              title="Zamknij czat i wróć do katalogu"
            >
              <X className="w-4 h-4" />
              <span className="hidden md:inline">Zamknij czat</span>
            </button>
          )}
        </div>
      </div>

      {/* Główna przestrzeń: Rozdzielenie czatu od panelu raportów (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* LEWA KOLUMNA: Czysty czat konwersacyjny */}
        <div
          className={`lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200/70 bg-white ${mobileTab === "reports" ? "hidden lg:flex" : "flex"
            }`}
        >
          {/* Okno wiadomości */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[520px] bg-stone-50/20"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"
                  }`}
              >
                {/* Dymek wiadomości */}
                <div
                  className={`max-w-xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-2xs ${msg.sender === "user"
                    ? "bg-stone-900 text-white rounded-br-xs"
                    : "bg-white border border-stone-200/80 text-stone-800 rounded-bl-xs space-y-2.5"
                    }`}
                >
                  <p className="whitespace-pre-line font-medium">
                    {msg.displayedText !== undefined
                      ? msg.displayedText
                      : msg.text}
                    {msg.isTyping && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-amber-600 rounded-full animate-pulse align-middle" />
                    )}
                  </p>

                  {/* Informacja o dopasowanych raportach w dedykowanym panelu */}
                  {!msg.isTyping &&
                    msg.matchedResearches &&
                    msg.matchedResearches.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-amber-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            Dopasowano {msg.matchedResearches.length} diagnozy
                            ROPS
                          </span>
                        </span>

                        {/* Przycisk przejścia do raportów na mobile */}
                        <button
                          onClick={() => setMobileTab("reports")}
                          className="lg:hidden text-amber-700 font-bold underline cursor-pointer text-xs"
                        >
                          Zobacz raporty →
                        </button>
                        <span className="hidden lg:inline text-[11px] text-stone-400 font-medium">
                          Szczegóły w panelu obok →
                        </span>
                      </div>
                    )}
                </div>

                <span className="text-[10px] text-stone-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Wskaźnik analizowania AI */}
            {isAnalyzing && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-xs p-4 shadow-2xs flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-semibold text-stone-600">
                    Przeszukuję bazę diagnoz i wskaźników Małopolski...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Formularz wprowadzania wiadomości */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 sm:p-5 bg-white border-t border-stone-100 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isAnalyzing}
                placeholder="Opisz swój pomysł na projekt społeczny..."
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 text-stone-900 placeholder:text-stone-400 text-sm font-medium transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || isAnalyzing}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Zapytaj AI</span>
            </button>
          </form>
        </div>

        {/* PRAWA KOLUMNA: Odrębny panel dopasowanych raportów (Separacja raportów) */}
        <div
          className={`lg:col-span-5 flex flex-col bg-stone-50/50 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[600px] ${mobileTab === "chat" ? "hidden lg:flex" : "flex"
            }`}
        >
          {/* Nagłówek panelu raportów */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Rekomendowane Diagnozy ROPS
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Dowody i wskaźniki uzasadniające Twój projekt
              </p>
            </div>

            {activeMatches.length > 0 && !isLatestTyping && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {activeMatches.length} znalezione
              </span>
            )}
          </div>

          {/* STAN 1: Analizowanie zapytania */}
          {isAnalyzing && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center space-y-3 shadow-2xs my-auto">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto animate-spin">
                <Sparkles className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-stone-900">
                Wyszukuję pasujące badania...
              </h5>
              <p className="text-xs text-stone-500">
                Porównuję Twój opis z bazą wskaźników demograficznych,
                zdrowotnych i rynku pracy ROPS Kraków.
              </p>
            </div>
          )}

          {/* STAN 2: Pusty stan początkowy */}
          {!isAnalyzing && activeMatches.length === 0 && (
            <div className="py-2">
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs text-left space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-700" />
                </div>
                <h5 className="text-sm font-bold text-stone-900">
                  Jak działa doradca?
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed">
                  W tym miejscu pojawią się
                  konkretne badania ROPS Kraków, mapy powiatów oraz argumenty do
                  wniosku dotacyjnego.
                </p>
              </div>
            </div>
          )}

          {/* STAN 3: Wyświetlenie odnalezionych raportów (Oddzielone od czatu) */}
          {!isAnalyzing && activeMatches.length > 0 && (
            <div className="space-y-3.5">
              {activeMatches.map(
                ({ research, matchScore, relevanceReason, suggestedFocus }) => (
                  <div
                    key={research.id}
                    className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all space-y-3 text-left"
                  >
                    {/* Górna belka karty raportu */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: research.theme.pastelBg,
                          borderColor: research.theme.border,
                          color: research.theme.text,
                        }}
                      >
                        {research.category}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{matchScore}% dopasowania</span>
                      </div>
                    </div>

                    {/* Tytuł raportu */}
                    <h5 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      {research.titlePl}
                    </h5>

                    {/* Dlaczego raport pasuje */}
                    <div className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">Dlaczego to ważne:</strong>{" "}
                        {relevanceReason}
                      </span>
                    </div>

                    {/* Sugestia lokalizacji */}
                    <div className="flex items-start gap-1.5 text-xs text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{suggestedFocus}</span>
                    </div>

                    {/* Przyciski akcji */}
                    <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <button
                        onClick={() => router.push(`/knowledge/${research.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Otwórz raport i mapę powiatów</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => router.push(`/propose`)}
                        className="inline-flex items-center justify-center gap-1 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer underline py-1"
                      >
                        <span>Zgłoś pomysł</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ),
              )}

              {/* Wskazówka doradcy pod raportami */}
              {activeTip && (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-xs text-stone-600 italic">
                  {activeTip}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
