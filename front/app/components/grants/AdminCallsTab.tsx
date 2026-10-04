"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  FileDown,
  FileText,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Unlock,
  X,
} from "lucide-react";
import { CustomSelect } from "../shared/CustomSelect";
import { CallFieldsEditor } from "./CallFieldsEditor";
import { PdfPreviewModal } from "./PdfPreviewModal";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  ApplicationStatus,
  CALL_STATUS_LABELS,
  CallField,
  GrantApplication,
  GrantCall,
  createCall,
  fetchAllCalls,
  fetchCallApplications,
  formatDate,
  formatDateTime,
  fromLocalInput,
  reextractCallFields,
  toLocalInput,
  updateApplicationStatus,
  updateCall,
} from "../../lib/grantsApi";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs text-stone-900";

const CALL_STATUS_STYLES = {
  draft: "bg-stone-100 text-stone-700",
  published: "bg-emerald-50 text-emerald-700",
  closed: "bg-rose-50 text-rose-700",
} as const;

const REVIEW_OPTIONS = (["submitted", "under_review", "accepted", "rejected"] as ApplicationStatus[]).map((s) => ({
  value: s,
  label: APPLICATION_STATUS_LABELS[s],
}));

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export function AdminCallsTab({ onFeedback }: { onFeedback: (msg: string) => void }) {
  const [calls, setCalls] = useState<GrantCall[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const reload = () =>
    fetchAllCalls()
      .then(setCalls)
      .catch((e) => {
        setCalls([]);
        setError(errorText(e, "Nie udało się wczytać naborów."));
      });

  useEffect(() => {
    reload();
  }, []);

  const selected = calls?.find((c) => c.id === selectedId) ?? null;

  const replaceCall = (call: GrantCall) =>
    setCalls((prev) => {
      const list = prev ?? [];
      const old = list.find((c) => c.id === call.id);
      const merged = { ...call, applications_count: call.applications_count ?? old?.applications_count ?? 0 };
      return old ? list.map((c) => (c.id === call.id ? merged : c)) : [merged, ...list];
    });

  if (creating) {
    return (
      <NewCallForm
        onCancel={() => setCreating(false)}
        onCreated={(call) => {
          replaceCall(call);
          setCreating(false);
          setSelectedId(call.id);
        }}
      />
    );
  }

  if (selected) {
    return (
      <CallDetail
        call={selected}
        onBack={() => {
          setSelectedId(null);
          reload();
        }}
        onChange={replaceCall}
        onFeedback={onFeedback}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900">Nabory wniosków</h2>
          <p className="text-[11px] text-stone-500">
            Gdy nabór jest opublikowany i trwa, użytkownicy mogą zgłaszać pomysły z pulpitu.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Otwórz nowy nabór
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

      {calls === null ? (
        <div className="flex items-center gap-2 text-xs text-stone-400 py-6 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin" /> Wczytywanie...
        </div>
      ) : calls.length === 0 ? (
        <div className="p-6 text-center text-xs text-stone-500">Brak naborów.</div>
      ) : (
        <div className="divide-y divide-stone-100">
          {calls.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="w-full py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-stone-50/60 rounded-lg cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CALL_STATUS_STYLES[c.status]}`}>
                    {CALL_STATUS_LABELS[c.status]}
                  </span>
                  {c.is_open && <span className="text-[10px] font-semibold text-emerald-700">● trwa</span>}
                </div>
                <p className="text-sm font-semibold text-stone-900 mt-1 truncate">{c.title}</p>
                <p className="text-[11px] text-stone-500">
                  {formatDateTime(c.starts_at)} – {formatDateTime(c.ends_at)} · {c.fields.length} pól
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-700 shrink-0">
                Wnioski: {c.applications_count ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewCallForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (call: GrantCall) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(() => toLocalInput(new Date(Date.now() + 30 * 86400000).toISOString()));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Dodaj wzór wniosku w PDF.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const call = await createCall({
        title: title.trim(),
        description: description.trim(),
        starts_at: fromLocalInput(startsAt),
        ends_at: fromLocalInput(endsAt),
        template: file,
      });
      onCreated(call);
    } catch (err) {
      setError(errorText(err, "Nie udało się utworzyć naboru."));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-900">Nowy nabór</h2>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Nazwa naboru</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Opis (widoczny dla użytkowników)</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Początek naboru</label>
          <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Koniec naboru</label>
          <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">Wzór wniosku (PDF, maks. 10 MB)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-stone-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-stone-100 file:text-xs file:font-semibold"
        />
        <p className="text-[11px] text-stone-500 mt-1">
          Asystent AI odczyta z PDF listę pól wniosku. Przed publikacją sprawdzisz ją i poprawisz.
        </p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer">
          Anuluj
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold disabled:opacity-60 cursor-pointer"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "AI odczytuje pola z PDF..." : "Utwórz szkic naboru"}
        </button>
      </div>
    </form>
  );
}

function CallDetail({
  call,
  onBack,
  onChange,
  onFeedback,
}: {
  call: GrantCall;
  onBack: () => void;
  onChange: (call: GrantCall) => void;
  onFeedback: (msg: string) => void;
}) {
  const isDraft = call.status === "draft";
  const [title, setTitle] = useState(call.title);
  const [description, setDescription] = useState(call.description);
  const [startsAt, setStartsAt] = useState(toLocalInput(call.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(call.ends_at));
  const [fields, setFields] = useState<CallField[]>(call.fields);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState<GrantApplication[] | null>(null);
  const [preview, setPreview] = useState<GrantApplication | null>(null);
  const [pdfFor, setPdfFor] = useState<GrantApplication | null>(null);

  useEffect(() => {
    if (!isDraft) fetchCallApplications(call.id).then(setApplications).catch(() => setApplications([]));
  }, [call.id, isDraft]);

  const run = async (key: string, fn: () => Promise<GrantCall>, message: string) => {
    setBusy(key);
    setError("");
    try {
      const updated = await fn();
      onChange(updated);
      setFields(updated.fields);
      onFeedback(message);
    } catch (e) {
      setError(errorText(e, "Operacja nie powiodła się."));
    } finally {
      setBusy(null);
    }
  };

  const details = () => ({
    title: title.trim(),
    description: description.trim(),
    starts_at: fromLocalInput(startsAt),
    ends_at: fromLocalInput(endsAt),
  });

  const saveAll = () =>
    run("save", () => updateCall(call.id, isDraft ? { ...details(), fields } : details()), "Zapisano nabór.");

  const publish = () => {
    if (!confirm("Opublikować nabór? Po publikacji pól wniosku nie można już zmieniać.")) return;
    run("publish", () => updateCall(call.id, { ...details(), fields, status: "published" }), "Nabór opublikowany.");
  };

  const setStatus = async (applicationId: string, status: ApplicationStatus) => {
    const comment = status === "accepted" || status === "rejected" ? prompt("Komentarz dla wnioskodawcy (opcjonalnie):") ?? undefined : undefined;
    try {
      const updated = await updateApplicationStatus(applicationId, status, comment);
      setApplications((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? prev);
      onFeedback(`Status wniosku: ${APPLICATION_STATUS_LABELS[status]}`);
    } catch (e) {
      setError(errorText(e, "Nie udało się zmienić statusu."));
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" />
        Wszystkie nabory
      </button>

      <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CALL_STATUS_STYLES[call.status]}`}>
              {CALL_STATUS_LABELS[call.status]}
            </span>
            {call.is_open && <span className="text-[10px] font-semibold text-emerald-700">● przyjmuje wnioski</span>}
            {call.status === "published" && !call.is_open && (
              <span className="text-[10px] font-semibold text-stone-500">poza terminem naboru</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {call.template_url && (
              <a
                href={call.template_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800"
              >
                <FileText className="w-3.5 h-3.5" />
                {call.template_filename || "Wzór PDF"}
              </a>
            )}
            <button
              onClick={saveAll}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 disabled:opacity-50 cursor-pointer"
            >
              {busy === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Zapisz
            </button>
            {isDraft && (
              <button
                onClick={publish}
                disabled={!!busy || fields.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {busy === "publish" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                Opublikuj nabór
              </button>
            )}
            {call.status === "published" && (
              <button
                onClick={() => confirm("Zamknąć nabór? Użytkownicy nie będą mogli wysyłać wniosków.") &&
                  run("close", () => updateCall(call.id, { status: "closed" }), "Nabór zamknięty.")}
                disabled={!!busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Zamknij nabór
              </button>
            )}
            {call.status === "closed" && (
              <button
                onClick={() => run("reopen", () => updateCall(call.id, { ...details(), status: "published" }), "Nabór otwarty ponownie.")}
                disabled={!!busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Otwórz ponownie
              </button>
            )}
          </div>
        </div>

        {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">Nazwa naboru</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 mb-1">Opis</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Początek</label>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Koniec</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {isDraft ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Pola wniosku ({fields.length})</h3>
              <p className="text-[11px] text-stone-500">
                Odczytane przez AI z PDF. Sprawdź etykiety, wymagane pola i limity znaków przed publikacją.
              </p>
            </div>
            <button
              onClick={() =>
                confirm("Odczytać pola ponownie? Obecne zmiany w polach zostaną zastąpione.") &&
                run("extract", () => reextractCallFields(call.id), "Ponownie odczytano pola z PDF.")
              }
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {busy === "extract" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Odczytaj ponownie z PDF
            </button>
          </div>
          {call.extraction_error && fields.length === 0 && (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {call.extraction_error}
            </div>
          )}
          <CallFieldsEditor fields={fields} onChange={setFields} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-2xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900">Złożone wnioski ({applications?.length ?? "…"})</h3>
          {applications === null ? (
            <div className="flex items-center gap-2 text-xs text-stone-400 py-4 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" /> Wczytywanie...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500">Nikt jeszcze nie złożył wniosku.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-800">
                <thead className="bg-stone-50 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Pomysł / wnioskodawca</th>
                    <th className="py-2.5 px-3">Złożony</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {applications.map((a) => (
                    <tr key={a.id}>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-stone-900">{a.idea_title || "-"}</p>
                        <p className="text-[10px] text-stone-400">{a.author_name || "-"}</p>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-stone-600">{formatDateTime(a.submitted_at)}</td>
                      <td className="py-3 px-3">
                        <CustomSelect<ApplicationStatus>
                          value={a.status}
                          onChange={(v) => setStatus(a.id, v)}
                          options={REVIEW_OPTIONS}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setPreview(a)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer" title="Podgląd">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPdfFor(a)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                            title="PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pdfFor && <PdfPreviewModal applicationId={pdfFor.id} title={pdfFor.idea_title} onClose={() => setPdfFor(null)} />}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">{preview.idea_title}</h3>
                <p className="text-xs text-stone-500">
                  {preview.author_name} · złożony {formatDate(preview.submitted_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${APPLICATION_STATUS_STYLES[preview.status]}`}>
                  {APPLICATION_STATUS_LABELS[preview.status]}
                </span>
                <button onClick={() => setPreview(null)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {call.fields.map((f, i) => (
              <div key={f.id} className="space-y-0.5">
                {f.section && f.section !== call.fields[i - 1]?.section && (
                  <h4 className="text-xs font-bold text-stone-900 pt-2 border-b border-stone-100 pb-1">{f.section}</h4>
                )}
                <p className="text-[11px] font-semibold text-stone-600">{f.label}</p>
                <p className="text-xs text-stone-900 whitespace-pre-wrap">
                  {preview.answers[f.id]?.trim() || <span className="text-stone-400">(brak odpowiedzi)</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
