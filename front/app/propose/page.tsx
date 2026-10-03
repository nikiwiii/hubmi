"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  generateInitialQuestions,
  generateFinalConcept,
  LLMDialogueMessage,
  GeneratedConcept,
} from "../lib/llmSimulator";
import { IdeaMockupVisualizer } from "../components/propose/IdeaMockupVisualizer";
import {
  ArrowRight,
  RotateCcw,
  Check,
  Send,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ProposePage() {
  const { currentUser, addIdea, navigate, isLoadingUser } = useApp();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, isLoadingUser, router]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawIdea, setRawIdea] = useState("");
  const [dialogueHistory, setDialogueHistory] = useState<LLMDialogueMessage[]>(
    [],
  );
  const [currentReplyText, setCurrentReplyText] = useState("");
  const [isLlmThinking, setIsLlmThinking] = useState(false);
  const [generatedConcept, setGeneratedConcept] =
    useState<GeneratedConcept | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Sprawdzanie sesji...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-stone-500">
        <Lock className="w-8 h-8 text-stone-300" />
        <p className="text-sm font-medium">
          Zaloguj się, aby zaproponować pomysł.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Przejdź do logowania
        </button>
      </div>
    );
  }

  // Step 1: Start LLM Dialogue
  const handleStartDialogue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) return;

    setIsLlmThinking(true);
    setStep(2);

    setTimeout(() => {
      const q = generateInitialQuestions(rawIdea);
      const userInitialMsg: LLMDialogueMessage = {
        id: "msg-user-init",
        sender: "user",
        text: rawIdea,
        timestamp: "Teraz",
      };
      const assistantMsg: LLMDialogueMessage = {
        id: "msg-ai-1",
        sender: "assistant",
        text: q.reply,
        suggestions: q.suggestions,
        timestamp: "Teraz",
      };

      setDialogueHistory([userInitialMsg, assistantMsg]);
      setIsLlmThinking(false);
    }, 700);
  };

  // Step 2: User responds
  const handleSendDialogueReply = (replyText: string) => {
    if (!replyText.trim()) return;

    const userMsg: LLMDialogueMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: replyText,
      timestamp: "Teraz",
    };

    const newHistory = [...dialogueHistory, userMsg];
    setDialogueHistory(newHistory);
    setCurrentReplyText("");
    setIsLlmThinking(true);

    setTimeout(() => {
      const userRepliesCount = newHistory.filter(
        (m) => m.sender === "user",
      ).length;
      if (userRepliesCount >= 2) {
        const concept = generateFinalConcept(rawIdea, newHistory);
        setGeneratedConcept(concept);
        setStep(3);
        setIsLlmThinking(false);
      } else {
        const nextAiMsg: LLMDialogueMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: "assistant",
          text: "Dziękuję. Jak chciałbyś zarządzać chętnymi do testów? Czy wystarczy prosta lista w aplikacji?",
          suggestions: [
            "Prosta lista chętnych w aplikacji",
            "Bezpośredni kontakt przez czat Hubmi",
          ],
          timestamp: "Teraz",
        };
        setDialogueHistory([...newHistory, nextAiMsg]);
        setIsLlmThinking(false);
      }
    }, 800);
  };

  // Step 3: Publish idea
  const handlePublish = () => {
    if (!generatedConcept || !currentUser) return;

    const author = currentUser;

    addIdea({
      title: generatedConcept.title,
      subtitle: generatedConcept.subtitle,
      authorId: author.id,
      authorName: author.name,
      authorEmail: author.email,
      category: generatedConcept.category,
      summary: generatedConcept.summary,
      description: generatedConcept.description,
      targetAudience: generatedConcept.targetAudience,
      keyBenefits: generatedConcept.keyBenefits,
      colorTheme: generatedConcept.colorTheme,
      geometricShape: generatedConcept.geometricShape,
      status: "active",
    });

    setIsPublished(true);
    setTimeout(() => {
      navigate("discover");
    }, 900);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
      {/* Subtle Step Tracker */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Zaproponuj Pomysł
        </h1>

        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
          <span className={step >= 1 ? "text-stone-900 font-bold" : ""}>
            1. Opis
          </span>
          <span>•</span>
          <span className={step >= 2 ? "text-stone-900 font-bold" : ""}>
            2. Dialog
          </span>
          <span>•</span>
          <span className={step === 3 ? "text-stone-900 font-bold" : ""}>
            3. Wizualizacja
          </span>
        </div>
      </div>

      {/* STEP 1: INITIAL IDEA FORM */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xs space-y-5">
          <div>
            <label className="block text-base font-semibold text-stone-900 mb-1">
              Opisz krótko swój pomysł:
            </label>
            <p className="text-stone-500 text-xs">
              Nasz asystent pomoże dobrać ułatwienia i przygotuje prostą
              wizualizację.
            </p>
          </div>

          <form onSubmit={handleStartDialogue} className="space-y-4">
            <textarea
              rows={3}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="np. Aplikacja do wymiany narzędzi i sadzonek w sąsiedztwie..."
              className="w-full p-4 rounded-2xl border border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900 transition-colors"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  setRawIdea(
                    "Sąsiedzka wypożyczalnia maszyn do drewna i mebli vintage.",
                  )
                }
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-700 transition-colors"
              >
                Wypożyczalnia maszyn
              </button>
              <button
                type="button"
                onClick={() =>
                  setRawIdea("Prosty asystent leków z powiadomieniem głosowym.")
                }
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-700 transition-colors"
              >
                Asystent leków
              </button>
              <button
                type="button"
                onClick={() =>
                  setRawIdea("Klub wycieczek rowerowych i spacerów 40+.")
                }
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-700 transition-colors"
              >
                Wycieczki 40+
              </button>
            </div>

            <button
              type="submit"
              disabled={!rawIdea.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Dalej</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: DIALOGUE */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-500">
              Doprecyzowanie pomysłu
            </span>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Zmień opis</span>
            </button>
          </div>

          <div className="space-y-3 max-h-95 overflow-y-auto pr-1">
            {dialogueHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-stone-900 text-white rounded-br-xs"
                      : "bg-stone-100 text-stone-900 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-1.5">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendDialogueReply(sug)}
                          className="w-full text-left p-2 rounded-lg bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-medium transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLlmThinking && (
              <div className="text-xs text-stone-400 italic py-1">
                Przygotowuję odpowiedź...
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <input
              type="text"
              value={currentReplyText}
              onChange={(e) => setCurrentReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleSendDialogueReply(currentReplyText);
              }}
              placeholder="Wpisz odpowiedź..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
            />
            <button
              onClick={() => handleSendDialogueReply(currentReplyText)}
              disabled={!currentReplyText.trim() || isLlmThinking}
              className="px-4 py-2.5 bg-stone-900 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VISUAL MOCKUP & PUBLISH */}
      {step === 3 && generatedConcept && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-2xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {generatedConcept.category}
                </span>
                <h3 className="text-2xl font-bold text-stone-900 mt-2">
                  {generatedConcept.title}
                </h3>
                <p className="text-sm text-stone-600 mt-0.5">
                  {generatedConcept.subtitle}
                </p>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                {generatedConcept.summary}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handlePublish}
                  disabled={isPublished}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isPublished ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Opublikowano!</span>
                    </>
                  ) : (
                    <span>Opublikuj pomysł</span>
                  )}
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium"
                >
                  Wstecz
                </button>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <IdeaMockupVisualizer
                title={generatedConcept.title}
                subtitle={generatedConcept.subtitle}
                theme={generatedConcept.colorTheme}
                shape={generatedConcept.geometricShape}
                category={generatedConcept.category}
                keyBenefits={generatedConcept.keyBenefits}
                targetAudience={generatedConcept.targetAudience}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
