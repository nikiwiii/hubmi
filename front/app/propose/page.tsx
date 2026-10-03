'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, X, SkipForward, Send, Square, RotateCcw, Loader2, Lock, RefreshCw, ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IdeaCard } from '../components/shared/IdeaCard';
import {
  AssistantQuestion,
  EMPTY_FIELDS,
  FIELD_LABELS,
  GeneratedImage,
  HistoryEntry,
  IdeaCreatorError,
  IdeaField,
  IdeaFields,
  RefineResult,
  STAGE_OPTIONS,
  Stage,
  fetchNextQuestion,
  generateImage,
  mapProjectToIdea,
  publishProject,
  refineField,
  stageLabel,
} from '../lib/ideaCreatorApi';

type Phase = 'edit' | 'loadingQuestion' | 'answering' | 'loadingRefine' | 'reviewing';

const MAX_ROUNDS = 10;

const CATEGORIES = [
  'Społeczność & Życie',
  'Dom i Ogród',
  'Zdrowie i Bezpieczeństwo',
  'Podróże i Pasje',
  'Rzemiosło i Pasje',
  'Praca i Finanse',
];

const TEXT_FIELDS: { key: Exclude<IdeaField, 'etap'>; placeholder: string; rows: number }[] = [
  { key: 'tytul', placeholder: 'np. Sąsiedzka lodówka', rows: 1 },
  { key: 'opis', placeholder: 'Jaki problem rozwiązuje projekt i jak działa?', rows: 4 },
  { key: 'innowacyjnosc', placeholder: 'Czym różni się od istniejących rozwiązań?', rows: 3 },
  { key: 'odbiorcy', placeholder: 'Kto skorzysta z projektu?', rows: 2 },
];

function fieldValueLabel(field: IdeaField, fields: IdeaFields): string {
  return field === 'etap' ? stageLabel(fields.etap) : fields[field] || '(puste)';
}

export default function ProposePage() {
  const { currentUser, isLoadingUser, addPublishedIdea, selectIdea } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, isLoadingUser, router]);

  const [fields, setFields] = useState<IdeaFields>(EMPTY_FIELDS);
  const [category, setCategory] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [question, setQuestion] = useState<AssistantQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [refined, setRefined] = useState<RefineResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const assistantPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'answering' || phase === 'reviewing') {
      assistantPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [phase, question]);

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
        <p className="text-sm font-medium">Zaloguj się, aby zaproponować pomysł.</p>
        <button
          onClick={() => router.push('/auth')}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Przejdź do logowania
        </button>
      </div>
    );
  }

  const loopActive = phase !== 'edit';
  const isLoading = phase === 'loadingQuestion' || phase === 'loadingRefine';
  const canPublish =
    !!fields.tytul.trim() && !!fields.opis.trim() && !!fields.innowacyjnosc.trim() && !!fields.odbiorcy.trim() && !!fields.etap;
  const canGenerateImage = !!fields.tytul.trim() || !!fields.opis.trim();

  const previewIdea = {
    ...mapProjectToIdea({
      ...fields,
      tytul: fields.tytul.trim() || 'Tytuł projektu',
      id: 'preview',
      category: category || 'general',
      user_id: currentUser.id,
      author_name: currentUser.name,
      created_at: null,
    }),
    visualMockupUrl: generatedImage?.image,
  };

  const updateField = (key: keyof IdeaFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: key === 'etap' ? ((value || null) as Stage | null) : value }));
  };

  // ---------- loop ----------

  const askNext = async (current: IdeaFields, currentHistory: HistoryEntry[]) => {
    setError(null);
    setRefined(null);
    setAnswer('');
    setPhase('loadingQuestion');
    try {
      const res = await fetchNextQuestion(current, currentHistory);
      if (res.done || !res.question) {
        setQuestion(null);
        setPhase('edit');
        setNotice(
          currentHistory.length >= MAX_ROUNDS
            ? `Wykorzystano wszystkie ${MAX_ROUNDS} pytań. Możesz jeszcze ręcznie poprawić pola i opublikować projekt.`
            : 'Asystent nie ma więcej pytań – opis wygląda na kompletny.'
        );
        return;
      }
      setQuestion(res.question);
      setPhase('answering');
    } catch (e) {
      // Stay in the loop with the form locked, so the retry uses the same fields.
      setQuestion(null);
      setPhase('answering');
      setError({
        message: e instanceof IdeaCreatorError ? e.message : 'Coś poszło nie tak.',
        retry: () => askNext(current, currentHistory),
      });
    }
  };

  const startLoop = () => {
    setNotice(null);
    setHistory([]);
    askNext(fields, []);
  };

  const finishRound = (entry: HistoryEntry, nextFields: IdeaFields, roundNotice: string | null = null) => {
    const nextHistory = [...history, entry];
    setHistory(nextHistory);
    setNotice(roundNotice);
    askNext(nextFields, nextHistory);
  };

  const submitAnswer = async () => {
    if (!question || !answer.trim()) return;
    setError(null);
    setNotice(null);
    setPhase('loadingRefine');
    try {
      const res = await refineField(fields, question, answer.trim());
      if (res.changes.length === 0) {
        finishRound(
          { field: question.field, question: question.text, answer: answer.trim(), accepted: null },
          fields,
          'Odpowiedź nie wymagała zmian w treści. Kolejne pytanie:'
        );
        return;
      }
      setRefined(res);
      setPhase('reviewing');
    } catch (e) {
      setPhase('answering');
      setError({
        message: e instanceof IdeaCreatorError ? e.message : 'Coś poszło nie tak.',
        retry: submitAnswer,
      });
    }
  };

  const skipQuestion = () => {
    if (!question) return;
    finishRound({ field: question.field, question: question.text, answer: '', accepted: null }, fields);
  };

  const decide = (accepted: boolean) => {
    if (!question || !refined) return;
    const nextFields = accepted ? refined.proposal : fields;
    if (accepted) setFields(nextFields);
    finishRound({ field: question.field, question: question.text, answer: answer.trim(), accepted }, nextFields);
  };

  const stopLoop = () => {
    setPhase('edit');
    setQuestion(null);
    setRefined(null);
    setError(null);
    setNotice('Zakończono pracę z asystentem. Możesz poprawić pola ręcznie i opublikować projekt.');
  };

  // ---------- image ----------

  const handleGenerateImage = async () => {
    if (!canGenerateImage) return;
    setImageError(null);
    setIsGeneratingImage(true);
    try {
      setGeneratedImage(await generateImage(fields, category));
    } catch (e) {
      setImageError(e instanceof IdeaCreatorError ? e.message : 'Nie udało się wygenerować obrazu.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ---------- publish ----------

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishError(null);
    setIsPublishing(true);
    try {
      const project = await publishProject(fields, category, generatedImage?.image);
      const idea = mapProjectToIdea(project);
      addPublishedIdea(idea);
      selectIdea(idea);
    } catch (e) {
      if (e instanceof IdeaCreatorError && e.status === 401) {
        setPublishError('Sesja wygasła lub nie jesteś zalogowany. Zaloguj się ponownie.');
      } else {
        setPublishError(e instanceof IdeaCreatorError ? e.message : 'Nie udało się opublikować projektu.');
      }
      setIsPublishing(false);
    }
  };

  // ---------- render ----------

  const highlighted = question?.field;
  const roundNumber = Math.min(history.length + 1, MAX_ROUNDS);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Zaproponuj Pomysł</h1>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.05] shadow-2xs space-y-4">
        {TEXT_FIELDS.map(({ key, placeholder, rows }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-stone-900 mb-1">{FIELD_LABELS[key]}</label>
            <textarea
              rows={rows}
              value={fields[key]}
              disabled={loopActive}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={placeholder}
              className={`w-full p-3 rounded-2xl border text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition-colors disabled:bg-stone-50 disabled:text-stone-600 ${
                highlighted === key ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200'
              }`}
            />
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">{FIELD_LABELS.etap}</label>
            <select
              value={fields.etap ?? ''}
              disabled={loopActive}
              onChange={(e) => updateField('etap', e.target.value)}
              className={`w-full p-3 rounded-2xl border bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900 disabled:bg-stone-50 ${
                highlighted === 'etap' ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200'
              }`}
            >
              <option value="">Wybierz etap...</option>
              {STAGE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} – {s.hint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">Kategoria (opcjonalnie)</label>
            <select
              value={category}
              disabled={loopActive}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-2xl border border-stone-200 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900 disabled:bg-stone-50"
            >
              <option value="">Ogólna</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {phase === 'edit' && (
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={startLoop}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{history.length > 0 ? 'Zacznij od nowa z asystentem AI' : 'Popraw z asystentem AI'}</span>
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={!canGenerateImage || isGeneratingImage}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-900 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              <span>
                {isGeneratingImage ? 'Generuję obraz...' : generatedImage ? 'Wygeneruj obraz ponownie' : 'Wygeneruj obraz'}
              </span>
            </button>
            <button
              onClick={handlePublish}
              disabled={!canPublish || isPublishing}
              className="px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{isPublishing ? 'Publikuję...' : 'Opublikuj projekt'}</span>
            </button>
          </div>
        )}

        {phase === 'edit' && !canPublish && (
          <p className="text-xs text-stone-500">Aby opublikować, wypełnij wszystkie pola i wybierz etap.</p>
        )}
        {publishError && <p className="text-xs text-red-600 font-medium">{publishError}</p>}
      </div>

      {/* ASSISTANT */}
      {(loopActive || notice || error) && (
        <div
          ref={assistantPanelRef}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.05] shadow-2xs space-y-4 scroll-mt-24"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {loopActive ? `Asystent AI · pytanie ${roundNumber} z ${MAX_ROUNDS}` : 'Asystent AI'}
            </span>
            {loopActive && (
              <button
                onClick={stopLoop}
                disabled={isLoading}
                className="text-xs text-stone-500 hover:text-stone-900 disabled:opacity-40 flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                <span>Zakończ</span>
              </button>
            )}
          </div>

          {notice && <p className="text-sm text-stone-600">{notice}</p>}

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between gap-3">
              <p className="text-sm text-red-700">{error.message}</p>
              <button
                onClick={error.retry}
                className="shrink-0 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Spróbuj ponownie</span>
              </button>
            </div>
          )}

          {phase === 'loadingQuestion' && (
            <p className="text-sm text-stone-400 italic flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Asystent analizuje Twój pomysł...
            </p>
          )}

          {(phase === 'answering' || phase === 'loadingRefine') && question && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4 bg-stone-100 text-stone-900">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  {FIELD_LABELS[question.field]}
                </span>
                <p className="text-sm font-medium mt-1">{question.text}</p>
              </div>
              <textarea
                rows={3}
                value={answer}
                disabled={phase === 'loadingRefine'}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitAnswer();
                }}
                placeholder="Twoja odpowiedź..."
                className="w-full p-3 rounded-2xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || phase === 'loadingRefine'}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {phase === 'loadingRefine' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{phase === 'loadingRefine' ? 'Przygotowuję propozycję...' : 'Odpowiedz'}</span>
                </button>
                <button
                  onClick={skipQuestion}
                  disabled={phase === 'loadingRefine'}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Pomiń</span>
                </button>
              </div>
            </div>
          )}

          {phase === 'reviewing' && refined && (
            <div className="space-y-3">
              {refined.changes.map((change) => (
                <div key={change.field} className="space-y-2">
                  <p className="text-sm font-semibold text-stone-900">
                    Proponowana zmiana: {FIELD_LABELS[change.field]}
                  </p>
                  <p className="text-xs text-stone-500">{change.summary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded-2xl p-3 bg-stone-50 border border-stone-200">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Obecnie</span>
                      <p className="text-sm text-stone-500 whitespace-pre-line mt-1">
                        {fieldValueLabel(change.field, fields)}
                      </p>
                    </div>
                    <div className="rounded-2xl p-3 bg-emerald-50 border border-emerald-200">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Propozycja</span>
                      <p className="text-sm text-stone-900 whitespace-pre-line mt-1">
                        {fieldValueLabel(change.field, refined.proposal)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => decide(true)}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Akceptuj</span>
                </button>
                <button
                  onClick={() => decide(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Odrzuć</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARD PREVIEW */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.05] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Podgląd fiszki po publikacji
          </span>
          {generatedImage && !isGeneratingImage && (
            <button
              onClick={() => setGeneratedImage(null)}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Usuń obraz</span>
            </button>
          )}
        </div>

        {imageError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{imageError}</p>
            <button
              onClick={handleGenerateImage}
              disabled={!canGenerateImage || isGeneratingImage}
              className="shrink-0 px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-1 disabled:opacity-40"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Spróbuj ponownie</span>
            </button>
          </div>
        )}

        <div className="relative max-w-sm mx-auto">
          <IdeaCard idea={previewIdea} />
          {isGeneratingImage && (
            <div className="absolute inset-0 rounded-[28px] bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-stone-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Asystent tworzy wizualizację...</span>
            </div>
          )}
        </div>

        {!generatedImage && !isGeneratingImage && (
          <p className="text-xs text-stone-500 text-center">
            Kliknij „Wygeneruj obraz”, aby AI przygotowało wizualizację pomysłu na podstawie wypełnionych pól.
          </p>
        )}

        {generatedImage && (
          <details className="text-xs text-stone-500">
            <summary className="cursor-pointer font-semibold hover:text-stone-900">Prompt użyty do wygenerowania obrazu</summary>
            <p className="mt-2 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 leading-relaxed">
              {generatedImage.prompt}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
