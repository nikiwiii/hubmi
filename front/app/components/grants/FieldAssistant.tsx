"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Loader2, MessageCircleQuestion, RefreshCw, Sparkles, X } from "lucide-react";
import { AssistTurn, assistDraft, assistQuestion } from "../../lib/grantsApi";

const MAX_TURNS = 5;

interface Props {
  applicationId: string;
  fieldId: string;
  onInsert: (value: string) => void;
  onClose: () => void;
}

/** Asks the user one question at a time about a field, then proposes its content. */
export function FieldAssistant({ applicationId, fieldId, onInsert, onClose }: Props) {
  const [history, setHistory] = useState<AssistTurn[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [proposal, setProposal] = useState<string | null>(null);
  const [loading, setLoading] = useState<"question" | "draft" | null>("question");
  const [error, setError] = useState("");

  const draft = useCallback(
    async (turns: AssistTurn[]) => {
      setLoading("draft");
      setError("");
      try {
        const res = await assistDraft(applicationId, fieldId, turns);
        setProposal(res.value);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Asystent nie odpowiada.");
      } finally {
        setLoading(null);
      }
    },
    [applicationId, fieldId],
  );

  const fetchQuestion = useCallback(
    (turns: AssistTurn[]) =>
      assistQuestion(applicationId, fieldId, turns).then(
        (res) => {
          if (res.question) {
            setQuestion(res.question);
            setAnswer("");
            setLoading(null);
          } else {
            setQuestion(null);
            return draft(turns);
          }
        },
        (e) => {
          setError(e instanceof Error ? e.message : "Asystent nie odpowiada.");
          setLoading(null);
        },
      ),
    [applicationId, fieldId, draft],
  );

  const ask = (turns: AssistTurn[]) => {
    setLoading("question");
    setError("");
    setProposal(null);
    return fetchQuestion(turns);
  };

  useEffect(() => {
    fetchQuestion([]);
  }, [fetchQuestion]);

  const handleAnswer = async (skip: boolean) => {
    if (!question) return;
    const turns = [...history, { question, answer: skip ? "" : answer.trim() }];
    setHistory(turns);
    setQuestion(null);
    const answered = turns.filter((t) => t.answer);
    if (!skip && answered.length > 0) await draft(turns);
    else if (turns.length < MAX_TURNS) await ask(turns);
    else await draft(turns);
  };

  const canAskMore = history.length < MAX_TURNS;

  return (
    <div className="mt-2 p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
          <Sparkles className="w-3.5 h-3.5" />
          Asystent wniosku
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-amber-100 text-stone-500 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {history.filter((t) => t.answer).map((t, i) => (
        <div key={i} className="text-[11px] text-stone-500">
          <span className="font-semibold text-stone-700">{t.question}</span> {t.answer}
        </div>
      ))}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {loading === "question" ? "Asystent przygotowuje pytanie..." : "Asystent pisze propozycję..."}
        </div>
      )}

      {error && <div className="text-xs text-rose-700">{error}</div>}

      {question && !loading && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-900 flex items-start gap-1.5">
            <MessageCircleQuestion className="w-4 h-4 text-amber-700 shrink-0" />
            {question}
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Twoja odpowiedź..."
            className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAnswer(false)}
              disabled={!answer.trim()}
              className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Odpowiedz
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Pomiń pytanie
            </button>
          </div>
        </div>
      )}

      {proposal !== null && !loading && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-stone-700">Propozycja treści pola:</p>
          <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 whitespace-pre-wrap">
            {proposal}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onInsert(proposal)}
              className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Wstaw do pola
            </button>
            {canAskMore && (
              <button
                onClick={() => ask(history)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Dopytaj o więcej szczegółów
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
