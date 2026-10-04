"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { FieldAssistant } from "../../components/grants/FieldAssistant";
import { PdfPreviewModal } from "../../components/grants/PdfPreviewModal";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  CallField,
  GrantApplication,
  fetchApplication,
  formatDate,
  formatDateTime,
  saveApplication,
  submitApplication,
} from "../../lib/grantsApi";

const AUTOSAVE_MS = 1200;
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function problemsOf(fields: CallField[], answers: Record<string, string>) {
  const missing = fields.filter((f) => f.required && !(answers[f.id] || "").trim());
  const tooLong = fields.filter((f) => f.max_chars && (answers[f.id] || "").length > f.max_chars);
  return { missing, tooLong };
}

export default function ApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser, isLoadingUser } = useApp();

  const [application, setApplication] = useState<GrantApplication | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [assistFor, setAssistFor] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestAnswers = useRef(answers);
  useEffect(() => {
    latestAnswers.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!isLoadingUser && !currentUser) router.push("/auth");
  }, [currentUser, isLoadingUser, router]);

  useEffect(() => {
    if (!currentUser || !id) return;
    fetchApplication(id)
      .then((a) => {
        setApplication(a);
        setAnswers(a.answers);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Nie udało się wczytać wniosku."));
  }, [currentUser, id]);

  const call = application?.call ?? null;
  const fields = useMemo(() => call?.fields ?? [], [call]);
  const editable =
    !!application && !!call && application.status === "draft" && call.is_open && application.user_id === currentUser?.id;

  const save = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    setSaveState("saving");
    try {
      const saved = await saveApplication(id, latestAnswers.current);
      // Keep local answers (the user may have typed meanwhile); take only server-side metadata.
      setApplication((prev) => (prev ? { ...prev, ai_filled: saved.ai_filled, updated_at: saved.updated_at } : prev));
      setSaveState((s) => (s === "saving" ? "saved" : s));
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }, [id]);

  const setAnswer = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(save, AUTOSAVE_MS);
  };

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const { missing, tooLong } = problemsOf(fields, answers);
  const requiredCount = fields.filter((f) => f.required).length;
  const filledCount = fields.filter((f) => (answers[f.id] || "").trim()).length;

  const handleSubmit = async () => {
    setShowValidation(true);
    setSubmitError("");
    if (missing.length || tooLong.length) {
      setSubmitError("Popraw zaznaczone pola przed wysłaniem.");
      return;
    }
    if (!confirm("Wysłać wniosek? Po wysłaniu nie będzie można go edytować.")) return;
    setSubmitting(true);
    try {
      if (saveState !== "saved" && saveState !== "idle" && !(await save())) {
        throw new Error("Nie udało się zapisać zmian przed wysłaniem.");
      }
      const submitted = await submitApplication(id);
      setApplication(submitted);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Nie udało się wysłać wniosku.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePdf = async () => {
    if (editable && saveState === "dirty") await save();
    setShowPdf(true);
  };

  if (isLoadingUser || (!application && !loadError)) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Wczytywanie wniosku...</span>
      </div>
    );
  }

  if (loadError || !application || !call) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-stone-300 mx-auto" />
        <p className="text-sm text-stone-600">{loadError || "Nie znaleziono wniosku."}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold"
        >
          Wróć do pulpitu
        </button>
      </div>
    );
  }

  const sections: { name: string; fields: CallField[] }[] = [];
  for (const f of fields) {
    const last = sections[sections.length - 1];
    if (last && last.name === f.section) last.fields.push(f);
    else sections.push({ name: f.section, fields: [f] });
  }

  return (
    <div className="py-6 px-4 sm:px-6 max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Wróć
      </button>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{call.title}</p>
            <h1 className="text-xl font-bold text-stone-900 mt-0.5">{application.idea_title || "Wniosek"}</h1>
            <p className="text-xs text-stone-500 mt-1">
              {application.submitted_at
                ? `Złożony ${formatDateTime(application.submitted_at)}`
                : `Nabór trwa do ${formatDate(call.ends_at)}`}
            </p>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${APPLICATION_STATUS_STYLES[application.status]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>

        {application.admin_comment && (
          <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-700">
            <span className="font-semibold">Komentarz organizatora:</span> {application.admin_comment}
          </div>
        )}

        {editable && (
          <div className="p-3 bg-amber-50/70 rounded-xl text-xs text-stone-700 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Asystent AI wstępnie wypełnił wniosek na podstawie fiszki pomysłu. Sprawdź pola oznaczone jako{" "}
              <strong>uzupełnione przez AI</strong> i dopisz brakujące – przy każdym polu możesz poprosić asystenta o pomoc.
            </span>
          </div>
        )}

        {application.status === "draft" && !call.is_open && (
          <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-700">Nabór jest zamknięty – wniosku nie można już wysłać.</div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-stone-500">
            Wypełnione pola: {filledCount}/{fields.length}
            {requiredCount > 0 && ` · wymagane: ${requiredCount - missing.length}/${requiredCount}`}
            {editable && (
              <span className="ml-2">
                {saveState === "saving" && "· Zapisywanie..."}
                {saveState === "saved" && "· Zapisano"}
                {saveState === "dirty" && "· Niezapisane zmiany"}
                {saveState === "error" && <span className="text-rose-600">· Błąd zapisu</span>}
              </span>
            )}
          </div>
          <button
            onClick={handlePdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-semibold text-stone-800 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Podgląd PDF
          </button>
        </div>
      </div>

      {/* Fields */}
      {sections.map((section, si) => (
        <div key={si} className="bg-white rounded-2xl p-5 border border-black/5 shadow-2xs space-y-5">
          {section.name && <h2 className="text-sm font-bold text-stone-900">{section.name}</h2>}
          {section.fields.map((field) => {
            const value = answers[field.id] || "";
            const isEmpty = !value.trim();
            const isAi = application.ai_filled.includes(field.id);
            const invalid =
              showValidation && (missing.includes(field) || tooLong.includes(field));
            const inputClass = `w-full px-3 py-2 rounded-xl border focus:outline-none text-xs text-stone-900 disabled:bg-stone-50 disabled:text-stone-700 ${
              invalid ? "border-rose-400 focus:border-rose-600" : "border-stone-200 focus:border-stone-900"
            }`;

            return (
              <div key={field.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={field.id} className="text-xs font-semibold text-stone-800">
                    {field.label}
                    {field.required && <span className="text-rose-600"> *</span>}
                  </label>
                  {isAi && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Uzupełnione przez AI – sprawdź
                    </span>
                  )}
                  {isEmpty && editable && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      Do uzupełnienia
                    </span>
                  )}
                </div>
                {field.help && <p className="text-[11px] text-stone-500 whitespace-pre-line">{field.help}</p>}

                {field.type === "long_text" ? (
                  <textarea
                    id={field.id}
                    value={value}
                    disabled={!editable}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    rows={Math.min(14, Math.max(4, Math.ceil(value.length / 90)))}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={field.id}
                    type={field.type === "date" ? "date" : "text"}
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    value={value}
                    disabled={!editable}
                    onChange={(e) => setAnswer(field.id, e.target.value)}
                    className={inputClass}
                  />
                )}

                <div className="flex items-center justify-between gap-3">
                  {editable && field.type !== "date" ? (
                    <button
                      onClick={() => setAssistFor(assistFor === field.id ? null : field.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-900 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isEmpty ? "Pomóż mi to uzupełnić" : "Pomóż mi to rozwinąć"}
                    </button>
                  ) : (
                    <span />
                  )}
                  {field.max_chars && (
                    <span className={`text-[10px] ${value.length > field.max_chars ? "text-rose-600 font-semibold" : "text-stone-400"}`}>
                      {value.length}/{field.max_chars} znaków
                    </span>
                  )}
                </div>

                {assistFor === field.id && (
                  <FieldAssistant
                    key={field.id}
                    applicationId={application.id}
                    fieldId={field.id}
                    onInsert={(v) => {
                      setAnswer(field.id, v);
                      setAssistFor(null);
                    }}
                    onClose={() => setAssistFor(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Submit bar */}
      {editable && (
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-2xs space-y-3">
          {submitError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs space-y-1">
              <p>{submitError}</p>
              {showValidation && missing.length > 0 && <p>Brakuje: {missing.map((f) => f.label).join(", ")}.</p>}
              {showValidation && tooLong.length > 0 && <p>Za długie: {tooLong.map((f) => f.label).join(", ")}.</p>}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-stone-500">
              Po wysłaniu wniosek trafi do organizatora naboru i nie będzie można go edytować.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Wyślij wniosek
            </button>
          </div>
        </div>
      )}

      {application.status !== "draft" && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Wniosek został wysłany. O zmianie statusu poinformujemy Cię w powiadomieniach.
        </div>
      )}

      {showPdf && (
        <PdfPreviewModal applicationId={application.id} title={application.idea_title} onClose={() => setShowPdf(false)} />
      )}
    </div>
  );
}
