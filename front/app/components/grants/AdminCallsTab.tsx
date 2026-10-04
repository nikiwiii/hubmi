"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Eye,
  FileDown,
  FileText,
  Layers,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
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
  "w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent";

const CALL_STATUS_STYLES = {
  draft: "bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border-stone-200 dark:border-white/10",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/30",
  closed: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/30",
} as const;

const REVIEW_OPTIONS = (["submitted", "under_review", "accepted", "rejected"] as ApplicationStatus[]).map((s) => ({
  value: s,
  label: APPLICATION_STATUS_LABELS[s],
}));

function errorText(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export function AdminCallsTab({
  onFeedback,
  onCount,
}: {
  onFeedback: (msg: string) => void;
  onCount?: (count: number) => void;
}) {
  const [calls, setCalls] = useState<GrantCall[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "published" | "draft" | "closed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reload = () => {
    setIsRefreshing(true);
    return fetchAllCalls()
      .then((list) => {
        setCalls(list);
        onCount?.(list.length);
      })
      .catch((e) => {
        setCalls([]);
        onCount?.(0);
        setError(errorText(e, "Nie udało się wczytać naborów."));
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    reload();
  }, []);

  const selected = calls?.find((c) => c.id === selectedId) ?? null;

  const replaceCall = (call: GrantCall) =>
    setCalls((prev) => {
      const list = prev ?? [];
      const old = list.find((c) => c.id === call.id);
      const merged = { ...call, applications_count: call.applications_count ?? old?.applications_count ?? 0 };
      const next = old ? list.map((c) => (c.id === call.id ? merged : c)) : [merged, ...list];
      onCount?.(next.length);
      return next;
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

  const filteredCalls = (calls ?? []).filter((c) => {
    if (statusFilter === "open" && !c.is_open) return false;
    if (statusFilter === "published" && c.status !== "published") return false;
    if (statusFilter === "draft" && c.status !== "draft") return false;
    if (statusFilter === "closed" && c.status !== "closed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (c.title || "").toLowerCase().includes(q);
      const matchDesc = (c.description || "").toLowerCase().includes(q);
      const matchTemplate = (c.template_filename || "").toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTemplate;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Pasek filtrów i narzędzi – zsynchronizowany z pozostałymi zakładkami */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Wszystkie", count: calls?.length ?? 0 },
            { id: "open", label: "Trwające", count: calls?.filter((c) => c.is_open).length ?? 0 },
            { id: "published", label: "Opublikowane", count: calls?.filter((c) => c.status === "published").length ?? 0 },
            { id: "draft", label: "Szkice", count: calls?.filter((c) => c.status === "draft").length ?? 0 },
            { id: "closed", label: "Zakończone", count: calls?.filter((c) => c.status === "closed").length ?? 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 shadow-2xs"
                  : "bg-stone-100 dark:bg-white/10 hover:bg-stone-200 dark:hover:bg-white/15 text-stone-600 dark:text-stone-300"
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1 rounded ${
                  statusFilter === tab.id ? "opacity-80" : "opacity-60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Prawa strona: Szukajka + Odśwież + Otwórz nowy nabór */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj naboru..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-white/15 focus:border-stone-900 dark:focus:border-white focus:outline-none text-xs text-stone-900 dark:text-white bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => reload()}
            className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/10 rounded-xl cursor-pointer shrink-0"
            title="Odśwież nabory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 cursor-pointer shrink-0 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy nabór</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs border border-rose-200/60 dark:border-rose-500/20">
          {error}
        </div>
      )}

      {calls === null ? (
        <div className="p-12 text-center text-xs text-stone-400 flex items-center justify-center gap-2 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
          <RefreshCw className="w-4 h-4 animate-spin text-stone-500" />
          <span>Wczytywanie naborów...</span>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="p-12 text-center text-xs text-stone-500 bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs">
          {searchQuery || statusFilter !== "all"
            ? "Brak naborów spełniających kryteria wyszukiwania."
            : "Brak naborów. Kliknij \"Nowy nabór\", aby utworzyć pierwszy nabór grantowy."}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredCalls.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(c.id);
                }
              }}
              className="group bg-white dark:bg-[#1C1E23] rounded-2xl border border-stone-200/80 dark:border-white/10 p-5 shadow-2xs hover:shadow-md hover:border-stone-400/60 dark:hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Lewa strona: Ikonka dokumentu + dane naboru */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Duża ikonka dokumentu */}
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-all">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Badges statusu */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${CALL_STATUS_STYLES[c.status]}`}
                      >
                        {CALL_STATUS_LABELS[c.status]}
                      </span>
                      {c.is_open ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          trwa
                        </span>
                      ) : c.status === "published" ? (
                        <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
                          poza terminem
                        </span>
                      ) : null}

                      {c.template_filename && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md border border-stone-200/60 dark:border-white/10">
                          <FileText className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                          {c.template_filename}
                        </span>
                      )}
                    </div>

                    {/* Tytuł naboru */}
                    <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {c.title}
                    </h3>

                    {/* Opis naboru */}
                    {c.description && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    )}

                    {/* Terminy i pola */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-[11px] text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {formatDateTime(c.starts_at)} – {formatDateTime(c.ends_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        <span>{c.fields.length} pól formularza</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prawa strona: Wnioski i przycisk Zarządzaj */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-white/5">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-200 text-xs font-bold shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    <span>
                      Wnioski:{" "}
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                        {c.applications_count ?? 0}
                      </span>
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white flex items-center gap-0.5 transition-colors">
                    Zarządzaj{" "}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs p-5 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white">Nowy nabór</h2>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Nazwa naboru</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Opis (widoczny dla użytkowników)</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Początek naboru</label>
          <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Koniec naboru</label>
          <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Wzór wniosku (PDF, maks. 10 MB)</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-stone-700 dark:text-stone-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-stone-100 dark:file:bg-white/10 file:text-stone-800 dark:file:text-stone-200 file:text-xs file:font-semibold"
        />
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
          Asystent AI odczyta z PDF listę pól wniosku. Przed publikacją sprawdzisz ją i poprawisz.
        </p>
      </div>

      {error && <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs">{error}</div>}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer">
          Anuluj
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold disabled:opacity-60 cursor-pointer shadow-2xs"
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
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Wszystkie nabory
      </button>

      <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${CALL_STATUS_STYLES[call.status]}`}
            >
              {CALL_STATUS_LABELS[call.status]}
            </span>
            {call.is_open && (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                przyjmuje wnioski
              </span>
            )}
            {call.status === "published" && !call.is_open && (
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                poza terminem naboru
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {call.template_url && (
              <a
                href={call.template_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/10 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                {call.template_filename || "Wzór PDF"}
              </a>
            )}
            <button
              onClick={saveAll}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {busy === "save" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Zapisz
            </button>
            {isDraft && (
              <button
                onClick={publish}
                disabled={!!busy || fields.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors"
              >
                {busy === "publish" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                Opublikuj nabór
              </button>
            )}
            {call.status === "published" && (
              <button
                onClick={() =>
                  confirm("Zamknąć nabór? Użytkownicy nie będą mogli wysyłać wniosków.") &&
                  run("close", () => updateCall(call.id, { status: "closed" }), "Nabór zamknięty.")
                }
                disabled={!!busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs font-semibold cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Zamknij nabór
              </button>
            )}
            {call.status === "closed" && (
              <button
                onClick={() =>
                  run("reopen", () => updateCall(call.id, { ...details(), status: "published" }), "Nabór otwarty ponownie.")
                }
                disabled={!!busy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/10 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                Otwórz ponownie
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs border border-rose-200 dark:border-rose-800/40">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Nazwa naboru</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Opis</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Początek</label>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Koniec</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {isDraft ? (
        <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white">Pola wniosku ({fields.length})</h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Odczytane przez AI z PDF. Sprawdź etykiety, wymagane pola i limity znaków przed publikacją.
              </p>
            </div>
            <button
              onClick={() =>
                confirm("Odczytać pola ponownie? Obecne zmiany w polach zostaną zastąpione.") &&
                run("extract", () => reextractCallFields(call.id), "Ponownie odczytano pola z PDF.")
              }
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
            >
              {busy === "extract" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Odczytaj ponownie z PDF
            </button>
          </div>
          {call.extraction_error && fields.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {call.extraction_error}
            </div>
          )}
          <CallFieldsEditor fields={fields} onChange={setFields} />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1C1E23] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">Złożone wnioski ({applications?.length ?? "…"})</h3>
          {applications === null ? (
            <div className="flex items-center gap-2 text-xs text-stone-400 py-4 justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" /> Wczytywanie...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">Nikt jeszcze nie złożył wniosku.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-800 dark:text-stone-200">
                <thead className="bg-stone-50 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Pomysł / wnioskodawca</th>
                    <th className="py-2.5 px-3">Złożony</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-white/10">
                  {applications.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/60 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900 dark:text-white">{a.idea_title || "-"}</p>
                            <p className="text-[10px] text-stone-400">{a.author_name || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-stone-600 dark:text-stone-400">{formatDateTime(a.submitted_at)}</td>
                      <td className="py-3 px-3">
                        <CustomSelect<ApplicationStatus>
                          value={a.status}
                          onChange={(v) => setStatus(a.id, v)}
                          options={REVIEW_OPTIONS}
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreview(a)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
                            title="Podgląd"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPdfFor(a)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors"
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
          <div className="bg-white dark:bg-[#1C1E23] rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-stone-200 dark:border-white/15 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">{preview.idea_title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {preview.author_name} · złożony {formatDate(preview.submitted_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${APPLICATION_STATUS_STYLES[preview.status]}`}>
                  {APPLICATION_STATUS_LABELS[preview.status]}
                </span>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {call.fields.map((f, i) => (
              <div key={f.id} className="space-y-0.5">
                {f.section && f.section !== call.fields[i - 1]?.section && (
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white pt-2 border-b border-stone-100 dark:border-white/10 pb-1">
                    {f.section}
                  </h4>
                )}
                <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">{f.label}</p>
                <p className="text-xs text-stone-900 dark:text-stone-200 whitespace-pre-wrap">
                  {preview.answers[f.id]?.trim() || <span className="text-stone-400 dark:text-stone-600">(brak odpowiedzi)</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
