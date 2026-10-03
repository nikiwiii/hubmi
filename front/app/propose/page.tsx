'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Check,
  X,
  SkipForward,
  Send,
  Square,
  RotateCcw,
  Loader2,
  Lock,
  RefreshCw,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  FileText,
  Users,
  CheckCircle2,
  Edit3,
  Sliders,
  Eye,
  Layers,
  HelpCircle,
  Compass
} from 'lucide-react';
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

  // 4 KROKI FORMULARZA: 1 -> 2 -> 3 -> 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [fields, setFields] = useState<IdeaFields>({
    ...EMPTY_FIELDS,
    etap: 'pomysl',
  });
  const [category, setCategory] = useState('Społeczność & Życie');
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
  const [showAiAssistant, setShowAiAssistant] = useState(false);

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

  // Walidacja poszczególnych kroków
  const isStep1Valid = fields.tytul.trim().length >= 3 && fields.opis.trim().length >= 10;
  const isStep2Valid = fields.innowacyjnosc.trim().length >= 4 && fields.odbiorcy.trim().length >= 3;
  const isStep3Valid = !!fields.etap;
  const canPublish = isStep1Valid && isStep2Valid && isStep3Valid;
  const canGenerateImage = !!fields.tytul.trim() || !!fields.opis.trim();

  const canGoToStep = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Valid;
    if (targetStep === 3) return isStep1Valid && isStep2Valid;
    if (targetStep === 4) return isStep1Valid && isStep2Valid && isStep3Valid;
    return false;
  };

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

  // ---------- loop asystenta AI ----------

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
      setQuestion(null);
      setPhase('answering');
      setError({
        message: e instanceof IdeaCreatorError ? e.message : 'Coś poszło nie tak.',
        retry: () => askNext(current, currentHistory),
      });
    }
  };

  const startLoop = () => {
    setShowAiAssistant(true);
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
    setNotice('Zakończono pracę z asystentem. Możesz sprawdzić podsumowanie i opublikować projekt.');
  };

  // ---------- Generowanie obrazu AI ----------

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

  // ---------- Publikacja ----------

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

  const loopActive = phase !== 'edit';
  const roundNumber = Math.min(history.length + 1, MAX_ROUNDS);

  return (
    <div className="py-6 px-4 sm:px-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Nagłówek Sekcji */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95] select-none">
            <span className="block text-stone-900">Zaproponuj Pomysł</span>
            <span className="block text-stone-300">Stwórz Innowację</span>
          </div>
        </div>
      </div>

      {/* PASEK KROKÓW (STEPPER - 4 KROKI) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-black/5 shadow-2xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, title: 'Krok 1', label: 'Tytuł i opis', isValid: isStep1Valid },
            { num: 2, title: 'Krok 2', label: 'Innowacja & Dla kogo', isValid: isStep2Valid },
            { num: 3, title: 'Krok 3', label: 'Kategoria & Etap', isValid: isStep3Valid },
            { num: 4, title: 'Krok 4', label: 'Podsumowanie', isValid: canPublish },
          ].map((s, idx, arr) => {
            const isClickable = canGoToStep(s.num as 1 | 2 | 3 | 4);
            const isCurrent = step === s.num;
            const isCompleted = step > s.num && s.isValid;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => isClickable && setStep(s.num as 1 | 2 | 3 | 4)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2.5 text-left transition-all ${
                    isClickable ? 'cursor-pointer group' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-stone-900 text-white shadow-xs'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.num}
                  </div>
                  <div className="hidden md:block">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                      {s.title}
                    </span>
                    <span className={`text-xs font-bold ${isCurrent ? 'text-stone-900' : 'text-stone-600'}`}>
                      {s.label}
                    </span>
                  </div>
                </button>

                {idx < arr.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 sm:mx-3 rounded-full transition-all ${
                      step > s.num ? 'bg-stone-900' : 'bg-stone-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KROK 1: TYTUŁ I OPIS POMYSŁU */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="bg-white rounded-[28px] p-6 sm:p-9 border border-black/5 shadow-2xs space-y-6">
          <div className="border-b border-black/5 pb-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-wider inline-block mb-1.5">
              Krok 1 z 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Podstawowe informacje o pomyśle
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Podaj zwięzły tytuł oraz opis problemu, który chcesz rozwiązać w swojej okolicy.
            </p>
          </div>

          {/* Tytuł */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-stone-500" />
                <span>Tytuł pomysłu *</span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                {fields.tytul.length} / 80 znaków
              </span>
            </div>
            <input
              type="text"
              maxLength={80}
              value={fields.tytul}
              onChange={(e) => updateField('tytul', e.target.value)}
              placeholder="np. Sąsiedzka lodówka, Ogród pokoleń, Kawiarenka naprawcza..."
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-[#FAF9F5]/40 focus:bg-white text-stone-900 text-base font-semibold placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            />
          </div>

          {/* Opis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Opis pomysłu *</span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                min. 10 znaków
              </span>
            </div>
            <textarea
              rows={5}
              value={fields.opis}
              onChange={(e) => updateField('opis', e.target.value)}
              placeholder="Opisz sytuację: skąd wziął się pomysł, na czym polega problem i jak wyobrażasz sobie codzienne funkcjonowanie tego rozwiązania..."
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-[#FAF9F5]/40 focus:bg-white text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            />
          </div>

          {/* Wskazówka pomocnicza */}
          <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/5 flex items-start gap-3 text-xs text-stone-600 leading-relaxed">
            <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
              i
            </div>
            <div>
              Nie martw się, jeśli opis nie jest jeszcze perfekcyjny. W kolejnym kroku sprecyzujesz, co jest w nim innowacyjnego oraz kto z niego skorzysta.
            </div>
          </div>

          {/* Nawigacja kroku 1 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-3 border-t border-black/5">
            <button
              onClick={() => isStep1Valid && setStep(2)}
              disabled={!isStep1Valid}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs self-end sm:self-auto"
            >
              <span>Dalej: Innowacja i odbiorcy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KROK 2: NA CZYM POLEGA & DLA KOGO (WARTOŚĆ I ODBIORCY) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="bg-white rounded-[28px] p-6 sm:p-9 border border-black/5 shadow-2xs space-y-6">
          <div className="border-b border-black/5 pb-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-wider inline-block mb-1.5">
              Krok 2 z 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Innowacyjność i odbiorcy
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Wyjaśnij, co wyróżnia Twój pomysł oraz dla kogo jest on przeznaczony.
            </p>
          </div>

          {/* Na czym polega innowacyjność */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <span>Na czym polega innowacja? *</span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                minimum 4 znaki
              </span>
            </div>
            <textarea
              rows={4}
              value={fields.innowacyjnosc}
              onChange={(e) => updateField('innowacyjnosc', e.target.value)}
              placeholder="np. Łączymy młodzież z seniorami w relacji mistrz-uczeń; wykorzystujemy nieużywaną przestrzeń w remizie; upraszczamy procedury do jednego telefonu sąsiedzkiego..."
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-[#FAF9F5]/40 focus:bg-white text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            />
          </div>

          {/* Dla kogo jest ten projekt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-500" />
                <span>Dla kogo jest ten projekt? (Grupa docelowa) *</span>
              </label>
              <span className="text-[11px] text-stone-400 font-mono">
                minimum 3 znaki
              </span>
            </div>
            <textarea
              rows={3}
              value={fields.odbiorcy}
              onChange={(e) => updateField('odbiorcy', e.target.value)}
              placeholder="np. Samotni seniorzy 60+, opiekunowie osób z niepełnosprawnościami, rodziny z małymi dziećmi z sołectwa..."
              className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 bg-[#FAF9F5]/40 focus:bg-white text-stone-900 text-sm leading-relaxed placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all"
            />
          </div>

          {/* Nawigacja kroku 2 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/5">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wróć do kroku 1</span>
            </button>

            <button
              onClick={() => isStep2Valid && setStep(3)}
              disabled={!isStep2Valid}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>Dalej: Kategoria i etap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KROK 3: KATEGORIA I ETAP ROZWOJU */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="bg-white rounded-[28px] p-6 sm:p-9 border border-black/5 shadow-2xs space-y-6">
          <div className="border-b border-black/5 pb-4">
            <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-wider inline-block mb-1.5">
              Krok 3 z 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Etap rozwoju i kategoria
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              Zaznacz, na jakim etapie jest obecnie Twoja inicjatywa oraz w jakiej kategorii najlepiej się odnajdzie.
            </p>
          </div>

          {/* Kafelki etapu */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-500" />
              <span>Etap pomysłu *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {STAGE_OPTIONS.map((s) => {
                const isSelected = fields.etap === s.value;
                return (
                  <div
                    key={s.value}
                    onClick={() => updateField('etap', s.value)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900/[0.03] ring-2 ring-stone-900/10 shadow-2xs'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-stone-900 block leading-tight">
                        {s.label}
                      </span>
                      <span className="text-xs text-stone-500 mt-1 block leading-snug">
                        {s.hint}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wybór kategorii */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-500" />
              <span>Kategoria projektu</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nawigacja kroku 3 */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/5">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wróć do kroku 2</span>
            </button>

            <button
              onClick={() => isStep3Valid && setStep(4)}
              disabled={!isStep3Valid}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <span>Dalej: Podsumowanie i opcje</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KROK 4: PODSUMOWANIE, OPCJE AI, PODGLĄD I PUBLIKACJA */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Podsumowanie wprowadzonych treści z kroków 1, 2 i 3 */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-wider inline-block mb-1">
                  Krok 4 z 4
                </span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-stone-700" />
                  <h3 className="text-base font-bold text-stone-900">
                    Podsumowanie danych projektu
                  </h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/4 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Tytuł
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edytuj</span>
                  </button>
                </div>
                <p className="font-bold text-stone-900 text-sm">{fields.tytul || '(brak tytułu)'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/4 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Kategoria & Etap
                  </span>
                  <button
                    onClick={() => setStep(3)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edytuj</span>
                  </button>
                </div>
                <p className="font-semibold text-stone-800">
                  {category} · {fields.etap ? stageLabel(fields.etap) : 'Nie wybrano'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/4 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Opis projektu
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edytuj</span>
                  </button>
                </div>
                <p className="text-stone-700 leading-relaxed line-clamp-3">{fields.opis || '(brak)'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/4 space-y-1 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Innowacyjność & Odbiorcy
                  </span>
                  <button
                    onClick={() => setStep(2)}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edytuj</span>
                  </button>
                </div>
                <p className="text-stone-700 leading-relaxed line-clamp-3">
                  <strong className="text-stone-900">Innowacja:</strong> {fields.innowacyjnosc || '-'}
                  <br />
                  <strong className="text-stone-900">Dla kogo:</strong> {fields.odbiorcy || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Opcje AI: Wizualizacja oraz Asystent doszlifowania */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opcja 1: Wizualizacja AI */}
            <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Wizualizacja AI</h4>
                    <span className="text-[11px] text-stone-400 font-medium">Opcjonalnie</span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Wygeneruj poglądowy obraz dla karty projektu na podstawie wprowadzonego tytułu i opisu.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {imageError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {imageError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!canGenerateImage || isGeneratingImage}
                  className="w-full px-4 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generuję obraz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                      <span>{generatedImage ? 'Wygeneruj obraz ponownie' : 'Stwórz obraz AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Opcja 2: Asystent AI do doszlifowania treści */}
            <div className="bg-white rounded-[28px] p-6 border border-black/5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-ubuntu font-bold text-xs">
                    m
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Asystent Treści AI</h4>
                    <span className="text-[11px] text-stone-400 font-medium">Opcjonalnie</span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Asystent zada 1–2 pytania doprecyzowujące i pomoże ubrać pomysł w profesjonalny język wnioskowy.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={startLoop}
                  disabled={loopActive}
                  className="w-full px-4 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                  <span>{history.length > 0 ? 'Kontynuuj z asystentem' : 'Doszlifuj treść z AI'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PANEL ASYSTENTA AI (PO ROZWINIĘCIU) */}
          {(loopActive || notice || error || (showAiAssistant && question)) && (
            <div
              ref={assistantPanelRef}
              className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                  {loopActive ? `Asystent AI · Pytanie ${roundNumber} z ${MAX_ROUNDS}` : 'Asystent AI'}
                </span>
                {loopActive && (
                  <button
                    onClick={stopLoop}
                    className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-3 h-3" />
                    <span>Zakończ</span>
                  </button>
                )}
              </div>

              {notice && <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl">{notice}</p>}

              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between gap-3 text-xs text-red-700">
                  <p>{error.message}</p>
                  <button
                    onClick={error.retry}
                    className="shrink-0 px-2.5 py-1 bg-white border border-red-200 rounded-lg font-semibold text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Ponów</span>
                  </button>
                </div>
              )}

              {phase === 'loadingQuestion' && (
                <p className="text-xs text-stone-400 italic flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Asystent analizuje Twój pomysł...
                </p>
              )}

              {(phase === 'answering' || phase === 'loadingRefine') && question && (
                <div className="space-y-3">
                  <div className="rounded-2xl p-4 bg-[#FAF9F5] border border-black/4 text-stone-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Dotyczy: {FIELD_LABELS[question.field]}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold mt-1">{question.text}</p>
                  </div>
                  <textarea
                    rows={3}
                    value={answer}
                    disabled={phase === 'loadingRefine'}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Wpisz odpowiedź..."
                    className="w-full p-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:outline-none text-xs sm:text-sm text-stone-900 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitAnswer}
                      disabled={!answer.trim() || phase === 'loadingRefine'}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {phase === 'loadingRefine' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{phase === 'loadingRefine' ? 'Przetwarzam...' : 'Odpowiedz i ulepsz'}</span>
                    </button>
                    <button
                      onClick={skipQuestion}
                      disabled={phase === 'loadingRefine'}
                      className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Pomiń
                    </button>
                  </div>
                </div>
              )}

              {phase === 'reviewing' && refined && (
                <div className="space-y-3">
                  {refined.changes.map((change) => (
                    <div key={change.field} className="space-y-2">
                      <p className="text-xs font-bold text-stone-900">
                        Proponowana zmiana: {FIELD_LABELS[change.field]}
                      </p>
                      <p className="text-[11px] text-stone-500">{change.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl p-3 bg-stone-50 border border-stone-200">
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Przed:</span>
                          <p className="text-stone-600 mt-1">{fieldValueLabel(change.field, fields)}</p>
                        </div>
                        <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Po zmianie:</span>
                          <p className="text-stone-900 font-medium mt-1">
                            {fieldValueLabel(change.field, refined.proposal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => decide(true)}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Zaakceptuj zmianę</span>
                    </button>
                    <button
                      onClick={() => decide(false)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Odrzuć</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PODGLĄD KARTY (FISZKI) */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                Podgląd karty po opublikowaniu
              </span>
              {generatedImage && !isGeneratingImage && (
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Usuń wygenerowany obraz</span>
                </button>
              )}
            </div>

            <div className="relative max-w-sm mx-auto">
              <IdeaCard idea={previewIdea} />
              {isGeneratingImage && (
                <div className="absolute inset-0 rounded-[28px] bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-stone-700">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-900" />
                  <span className="text-xs font-semibold">Generuję wizualizację...</span>
                </div>
              )}
            </div>
          </div>

          {/* PASEK AKCJI KOŃCOWEJ */}
          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-black/5 shadow-2xs space-y-4">
            {publishError && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                {publishError}
              </p>
            )}

            {!fields.etap && (
              <p className="text-xs text-stone-500 text-center">
                Wybierz etap projektu w kroku 3, aby móc go opublikować.
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Wróć do kroku 3</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publikuję projekt...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Opublikuj pomysł w minno</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
