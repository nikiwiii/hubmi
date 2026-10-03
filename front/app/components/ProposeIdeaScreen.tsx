import React, { useState } from 'react';
import { User, Idea, ScreenId, ColorTheme, ShapeType } from '../lib/types';
import {
  generateInitialQuestions,
  generateFinalConcept,
  LLMDialogueMessage,
  GeneratedConcept
} from '../lib/llmSimulator';
import { IdeaMockupVisualizer } from './IdeaMockupVisualizer';
import {
  Sparkles,
  Send,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Bot,
  User as UserIcon
} from 'lucide-react';

interface ProposeIdeaScreenProps {
  currentUser: User | null;
  onAddIdea: (newIdea: Omit<Idea, 'id' | 'createdAt' | 'likes' | 'dislikes' | 'testersCount' | 'testersList' | 'commentsCount'>) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const ProposeIdeaScreen: React.FC<ProposeIdeaScreenProps> = ({
  currentUser,
  onAddIdea,
  onNavigate
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawIdea, setRawIdea] = useState('');
  const [dialogueHistory, setDialogueHistory] = useState<LLMDialogueMessage[]>([]);
  const [currentReplyText, setCurrentReplyText] = useState('');
  const [isLlmThinking, setIsLlmThinking] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<GeneratedConcept | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  // Step 1: Start LLM Dialogue
  const handleStartDialogue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim()) return;

    setIsLlmThinking(true);
    setStep(2);

    setTimeout(() => {
      const q = generateInitialQuestions(rawIdea);
      const userInitialMsg: LLMDialogueMessage = {
        id: 'msg-user-init',
        sender: 'user',
        text: rawIdea,
        timestamp: 'Przed chwilą'
      };
      const assistantMsg: LLMDialogueMessage = {
        id: 'msg-ai-1',
        sender: 'assistant',
        text: q.reply,
        suggestions: q.suggestions,
        timestamp: 'Przed chwilą'
      };

      setDialogueHistory([userInitialMsg, assistantMsg]);
      setIsLlmThinking(false);
    }, 900);
  };

  // Step 2: User responds to LLM question
  const handleSendDialogueReply = (replyText: string) => {
    if (!replyText.trim()) return;

    const userMsg: LLMDialogueMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: replyText,
      timestamp: 'Przed chwilą'
    };

    const newHistory = [...dialogueHistory, userMsg];
    setDialogueHistory(newHistory);
    setCurrentReplyText('');
    setIsLlmThinking(true);

    setTimeout(() => {
      // If user has answered at least 1-2 probing queries, finalize concept
      const userRepliesCount = newHistory.filter(m => m.sender === 'user').length;
      if (userRepliesCount >= 2) {
        // Move to Step 3: Generate visual mockup
        const concept = generateFinalConcept(rawIdea, newHistory);
        setGeneratedConcept(concept);
        setStep(3);
        setIsLlmThinking(false);
      } else {
        const nextAiMsg: LLMDialogueMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'assistant',
          text: 'Świetnie! Jeszcze jedno szybkie pytanie: jak chciałbyś, aby prezentowały się zgłoszenia od testerów? Czy wystarczy prosta lista chętnych z numerem telefonu/mailem?',
          suggestions: [
            'Prosta lista chętnych i bezpośredni czat w Hubmi',
            'Możliwość wysyłania grupowych wiadomości o postępach',
            'Weryfikacja przez moderatora przed rozpoczęciem testów'
          ],
          timestamp: 'Przed chwilą'
        };
        setDialogueHistory([...newHistory, nextAiMsg]);
        setIsLlmThinking(false);
      }
    }, 1100);
  };

  // Step 3: Publish idea to live database
  const handlePublish = () => {
    if (!generatedConcept) return;

    const author = currentUser || {
      id: 'user-anna-2',
      name: 'Anna Kowalska',
      email: 'anna.kowalska@hubmi.pl'
    };

    onAddIdea({
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
      status: 'active'
    });

    setIsPublished(true);
    setTimeout(() => {
      onNavigate('discover');
    }, 1500);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
      {/* Title & Progress Tracker */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-[#F5E85A] text-stone-900 text-xs font-bold uppercase tracking-wider">
            Kreator Pomysłów Hubmi
          </span>
          <span className="text-xs text-stone-500 font-semibold">Wsparcie Asystenta AI</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
          Przekształć myśl w gotowy projekt.
        </h1>
        <p className="text-stone-600 text-lg mt-2 font-medium">
          Nasz asystent zada Ci kilka pytań i przygotuje profesjonalną wizualizację ekranu dla społeczności.
        </p>

        {/* Step indicator */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              step === 1
                ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                : 'border-stone-200 bg-white text-stone-500'
            }`}
          >
            <div className="text-xs font-bold uppercase">Krok 1</div>
            <div className="text-sm font-bold truncate">Opisz pomysł</div>
          </div>
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              step === 2
                ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                : 'border-stone-200 bg-white text-stone-500'
            }`}
          >
            <div className="text-xs font-bold uppercase">Krok 2</div>
            <div className="text-sm font-bold truncate">Rozmowa z AI</div>
          </div>
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              step === 3
                ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                : 'border-stone-200 bg-white text-stone-500'
            }`}
          >
            <div className="text-xs font-bold uppercase">Krok 3</div>
            <div className="text-sm font-bold truncate">Wizualizacja & Publikacja</div>
          </div>
        </div>
      </div>

      {/* STEP 1: INITIAL IDEA FORM */}
      {step === 1 && (
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">
          <div className="space-y-2">
            <label className="block text-xl font-bold text-stone-900">
              O czym myślisz? Opisz swój pomysł w kilku zdaniach:
            </label>
            <p className="text-stone-500 text-sm">
              Nie przejmuj się technicznym językiem. Pisz tak, jak opowiadałbyś znajomemu przy herbacie.
            </p>
          </div>

          <form onSubmit={handleStartDialogue} className="space-y-4">
            <textarea
              rows={4}
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="np. Chcę stworzyć aplikację dla działkowców, w której wymieniamy się sadzonkami i wspólnie zamawiamy ziemię ogrodową..."
              className="w-full p-4 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-lg text-stone-900 font-medium transition-colors"
            />

            {/* Quick Inspiration Prompts */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Przykładowe inspiracje (kliknij, aby wstawić):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setRawIdea('Sąsiedzka wypożyczalnia maszyn do renowacji drewna i mebli vintage w dzielnicy.')}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition-colors"
                >
                  🛠️ Wypożyczalnia maszyn vintage
                </button>
                <button
                  type="button"
                  onClick={() => setRawIdea('Prosta aplikacja z przypomnieniem o ciśnieniu krwi i spacerze z dużym czytelnym zegarem.')}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition-colors"
                >
                  ❤️ Asystent zdrowia i spacerów
                </button>
                <button
                  type="button"
                  onClick={() => setRawIdea('Lokalny klub wymiany książek i starych winyli z kameralnymi spotkaniami w kawiarni.')}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition-colors"
                >
                  📚 Wymiana winyli i książek
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!rawIdea.trim()}
              className="w-full sm:w-auto px-8 py-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-2xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Rozpocznij dopracowywanie z Asystentem AI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: INTERACTIVE LLM DIALOGUE */}
      {step === 2 && (
        <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-stone-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F5E85A] flex items-center justify-center text-stone-900 font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Doradca Projektowy Hubmi</h3>
                <p className="text-xs text-stone-500">Zadaje precyzyjne pytania, by dopasować projekt do osób 40+</p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zmień opis</span>
            </button>
          </div>

          {/* Dialogue Messages Window */}
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {dialogueHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#F5E85A] flex items-center justify-center text-stone-900 text-xs shrink-0 font-bold">
                    AI
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-3xl p-5 ${
                    msg.sender === 'user'
                      ? 'bg-stone-900 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-900 rounded-tl-none border border-stone-200'
                  }`}
                >
                  <p className="text-base font-medium whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Suggestion Chips from LLM */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Sugerowane odpowiedzi (kliknij jedną):
                      </p>
                      <div className="flex flex-col gap-2">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendDialogueReply(sug)}
                            className="text-left p-3 rounded-xl bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 text-sm font-medium transition-all hover:border-stone-900 cursor-pointer"
                          >
                            👉 {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-stone-800 text-xs shrink-0 font-bold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLlmThinking && (
              <div className="flex items-center gap-3 text-stone-500 text-sm italic py-2">
                <div className="w-4 h-4 rounded-full border-2 border-stone-500 border-t-transparent animate-spin" />
                <span>Asystent AI analizuje Twoją odpowiedź i przygotowuje kolejny krok...</span>
              </div>
            )}
          </div>

          {/* User Input Bar for replying */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentReplyText}
                onChange={(e) => setCurrentReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendDialogueReply(currentReplyText);
                }}
                placeholder="Wpisz własną odpowiedź lub wybierz z propozycji powyżej..."
                className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900"
              />
              <button
                onClick={() => handleSendDialogueReply(currentReplyText)}
                disabled={!currentReplyText.trim() || isLlmThinking}
                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Odpowiedz</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VISUAL CONCEPT ART & PUBLISH */}
      {step === 3 && generatedConcept && (
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-stone-200 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
                Twój pomysł został dopracowany!
              </h2>
            </div>

            {/* Split Grid: Concept Spec on Left, Generated Visual Mockup on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Concept Specs */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                    {generatedConcept.category}
                  </span>
                  <h3 className="text-3xl font-black text-stone-900 leading-tight">
                    {generatedConcept.title}
                  </h3>
                  <p className="text-base font-semibold text-stone-600 mt-1">
                    {generatedConcept.subtitle}
                  </p>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Krótkie podsumowanie
                  </h4>
                  <p className="text-stone-800 text-sm font-medium leading-relaxed">
                    {generatedConcept.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Kluczowe ułatwienia dla odbiorców:
                  </h4>
                  <ul className="space-y-2">
                    {generatedConcept.keyBenefits.map((ben, i) => (
                      <li key={i} className="flex items-start gap-2 text-stone-800 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePublish}
                    disabled={isPublished}
                    className="flex-1 py-4 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isPublished ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Opublikowano! Przekierowanie...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-[#F5E85A]" />
                        <span>Opublikuj pomysł na platformie Hubmi</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep(2)}
                    className="py-4 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-sm font-bold transition-colors"
                  >
                    Doprecyzuj jeszcze
                  </button>
                </div>
              </div>

              {/* Right Column: Realistic Phone Mockup Visualizer */}
              <div className="lg:col-span-5 flex flex-col items-center">
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
        </div>
      )}
    </div>
  );
};
