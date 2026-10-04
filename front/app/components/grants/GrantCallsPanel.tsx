"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, FileText, Loader2, Send, Sparkles, X } from "lucide-react";
import { Idea } from "../../lib/types";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  GrantApplication,
  GrantCall,
  createApplication,
  fetchMyApplications,
  fetchOpenCalls,
  formatDate,
  formatDateTime,
} from "../../lib/grantsApi";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  myIdeas: Idea[];
}

export function GrantCallsPanel({ myIdeas }: Props) {
  const router = useRouter();
  const [calls, setCalls] = useState<GrantCall[]>([]);
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [pickerCall, setPickerCall] = useState<GrantCall | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOpenCalls().then(setCalls).catch(() => setCalls([]));
    fetchMyApplications().then(setApplications).catch(() => setApplications([]));
  }, []);

  // Ideas saved only locally (non-UUID ids) do not exist in the backend.
  const eligibleIdeas = myIdeas.filter((i) => UUID_RE.test(i.id));

  const existingFor = (callId: string, ideaId: string) =>
    applications.find((a) => a.call_id === callId && a.idea_id === ideaId);

  const handlePick = async (call: GrantCall, idea: Idea) => {
    const existing = existingFor(call.id, idea.id);
    if (existing) {
      router.push(`/applications/${existing.id}`);
      return;
    }
    setError("");
    setCreatingFor(idea.id);
    try {
      const application = await createApplication(call.id, idea.id);
      router.push(`/applications/${application.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się przygotować wniosku.");
      setCreatingFor(null);
    }
  };

  if (calls.length === 0 && applications.length === 0) return null;

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <div
          key={call.id}
          className="bg-[#EFE5C6]/60 border border-[#E3D4A5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Trwa nabór do {formatDate(call.ends_at)}</span>
            </div>
            <h3 className="text-sm font-bold text-stone-900">{call.title}</h3>
            {call.description && <p className="text-xs text-stone-600 max-w-2xl">{call.description}</p>}
            {call.template_url && (
              <a
                href={call.template_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 underline underline-offset-2 hover:text-stone-900"
              >
                <FileText className="w-3 h-3" />
                Wzór wniosku (PDF)
              </a>
            )}
          </div>
          <button
            onClick={() => {
              setError("");
              setPickerCall(call);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Złóż wniosek</span>
          </button>
        </div>
      ))}

      {applications.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Moje wnioski ({applications.length})</h3>
          <div className="divide-y divide-stone-100">
            {applications.map((a) => (
              <button
                key={a.id}
                onClick={() => router.push(`/applications/${a.id}`)}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50/60 rounded-lg px-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">{a.idea_title || "Wniosek"}</p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {a.call?.title || "Nabór"} ·{" "}
                    {a.submitted_at ? `złożony ${formatDateTime(a.submitted_at)}` : `edytowany ${formatDateTime(a.updated_at)}`}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${APPLICATION_STATUS_STYLES[a.status]}`}
                >
                  {APPLICATION_STATUS_LABELS[a.status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pickerCall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">Który pomysł zgłaszasz?</h3>
                <p className="text-xs text-stone-500 mt-0.5">{pickerCall.title}</p>
              </div>
              <button
                onClick={() => !creatingFor && setPickerCall(null)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              Asystent AI wypełni wniosek na podstawie fiszki pomysłu. Pola, o których fiszka nic nie mówi, zostawi puste –
              uzupełnisz je przed wysłaniem.
            </p>

            {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

            {eligibleIdeas.length === 0 ? (
              <div className="p-4 bg-stone-50 rounded-xl text-xs text-stone-600 text-center">
                Nie masz jeszcze opublikowanych pomysłów. Dodaj pomysł w kreatorze, a potem wróć tutaj.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {eligibleIdeas.map((idea) => {
                  const existing = existingFor(pickerCall.id, idea.id);
                  const busy = creatingFor === idea.id;
                  return (
                    <button
                      key={idea.id}
                      disabled={!!creatingFor}
                      onClick={() => handlePick(pickerCall, idea)}
                      className="w-full p-3 rounded-xl border border-stone-200 hover:border-stone-900 text-left flex items-center justify-between gap-3 disabled:opacity-60 cursor-pointer disabled:cursor-wait"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">{idea.title}</p>
                        <p className="text-[11px] text-stone-500 truncate">{idea.subtitle}</p>
                      </div>
                      {busy ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-stone-600 shrink-0">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          AI wypełnia wniosek...
                        </span>
                      ) : existing ? (
                        <span className="text-[11px] font-semibold text-stone-600 shrink-0">
                          Otwórz wniosek ({APPLICATION_STATUS_LABELS[existing.status]})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
