import { Idea, ColorTheme, ShapeType } from './types';

export interface LLMDialogueMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
  timestamp: string;
}

export interface GeneratedConcept {
  title: string;
  subtitle: string;
  category: string;
  summary: string;
  description: string;
  targetAudience: string;
  keyBenefits: string[];
  colorTheme: ColorTheme;
  geometricShape: ShapeType;
  mockupGraphicType: 'app-preview' | 'product-card';
}

export function generateInitialQuestions(userIdea: string): {
  reply: string;
  suggestions: string[];
} {
  const lower = userIdea.toLowerCase();
  
  if (lower.includes('ogród') || lower.includes('roslin') || lower.includes('działk') || lower.includes('narzedz')) {
    return {
      reply: `Twój pomysł ogrodowy brzmi fantastycznie! Aby go dopracować, powiedz mi:\n\n1. Kto będzie głównym użytkownikiem – osoby z domków jednorodzinnych czy działkowcy ROD?\n2. Co powinno być na pierwszym ekranie, aby nikt nie musiał szukać instrukcji?`,
      suggestions: [
        'Działkowcy ROD i właściciele małych ogródków przydomowych',
        'Jeden duży przycisk "Pożycz narzędzie" i kalendarz dni wolnych',
        'Możliwość dodawania zdjęć narzędzi bezpośrednio z aparatu telefonu'
      ]
    };
  }

  if (lower.includes('zdrow') || lower.includes('lek') || lower.includes('senior') || lower.includes('lekarz') || lower.includes('opiek')) {
    return {
      reply: `Rozwiązania ułatwiające dbanie o zdrowie są niezwykle potrzebne! Pomóż mi doprecyzować:\n\n1. Jak aplikacja powinna powiadamiać o ważnych sprawach (dźwięk, duży napis, czytelny głos)?\n2. Czy opiekun lub ktoś z rodziny powinien mieć wgląd w postępy?`,
      suggestions: [
        'Ciepły, naturalny głos lektora po polsku i bardzo duże litery',
        'Powiadomienie SMS do bliskiej osoby tylko w razie braku reakcji',
        'Maksymalnie 2 ekrany w całej aplikacji bez skomplikowanego menu'
      ]
    };
  }

  return {
    reply: `To bardzo obiecujący pomysł! Aby nadać mu idealną formę dopasowaną do dojrzałych użytkowników (40+):\n\n1. Jaka jest najważniejsza korzyść, którą użytkownik odczuje już pierwszego dnia?\n2. Jaki styl interfejsu preferujesz: maksymalnie uproszczony z dużymi przyciskami czy bogaty w opisy?`,
    suggestions: [
      'Maksymalna prostota: 3 duże kafelki i wysoka czytelność',
      'Oszczędność czasu i brak konieczności zapamiętywania haseł',
      'Ciepła, estetyczna kolorystyka i jasne wyjaśnienia każdego kroku'
    ]
  };
}

export function generateFinalConcept(userIdea: string, dialogueHistory: LLMDialogueMessage[]): GeneratedConcept {
  const combinedText = userIdea + ' ' + dialogueHistory.map(m => m.text).join(' ');
  const lower = combinedText.toLowerCase();

  let category = 'Społeczność & Życie';
  let colorTheme: ColorTheme = 'yellow';
  let geometricShape: ShapeType = 'donut';

  if (lower.includes('ogród') || lower.includes('ziemi') || lower.includes('narzedz') || lower.includes('eko')) {
    category = 'Dom i Ogród';
    colorTheme = 'sage';
    geometricShape = 'v-shape';
  } else if (lower.includes('zdrow') || lower.includes('lek') || lower.includes('serc') || lower.includes('ruch')) {
    category = 'Zdrowie i Bezpieczeństwo';
    colorTheme = 'lavender';
    geometricShape = 'cloud';
  } else if (lower.includes('podróż') || lower.includes('kamper') || lower.includes('rower') || lower.includes('wypraw')) {
    category = 'Podróże i Pasje';
    colorTheme = 'cyan';
    geometricShape = 'wave';
  } else if (lower.includes('mebl') || lower.includes('sztuk') || lower.includes('rękodzieł') || lower.includes('drewn')) {
    category = 'Rzemiosło i Pasje';
    colorTheme = 'lilac';
    geometricShape = 'crescent';
  } else if (lower.includes('pieniądz') || lower.includes('biznes') || lower.includes('księg') || lower.includes('prac')) {
    category = 'Praca i Finanse';
    colorTheme = 'pink';
    geometricShape = 'diamond';
  }

  // Derive elegant title
  const words = userIdea.trim().split(/\s+/);
  const titleCandidate = words.slice(0, 5).join(' ');
  const capitalizedTitle = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);

  return {
    title: capitalizedTitle.length > 3 ? capitalizedTitle : 'Innowacyjny Projekt Społeczny',
    subtitle: 'Rozwiązanie zaprojektowane z myślą o prostocie i wygodzie 40+',
    category,
    summary: `Projekt skupiony na: ${userIdea.slice(0, 140)}... Przyjazny, intuicyjny interfejs bez barier cyfrowych.`,
    description: `Koncepcja odpowiada na realne potrzeby dojrzałych użytkowników. W oparciu o zebrane szczegóły: ${dialogueHistory.filter(m => m.sender === 'user').map(m => m.text).join('. ')}. Wszystkie elementy zostały dostosowane do bezproblemowej obsługi jedną ręką z wyraźnymi kontrastami.`,
    targetAudience: 'Osoby 40+ ceniące wygodę, przejrzystość i praktyczne rozwiązania bez zbędnego żargonu.',
    keyBenefits: [
      'Duże, czytelne elementy interfejsu (WCAG AAA)',
      'Brak konieczności nauki skomplikowanych gestów',
      'Wsparcie społeczności i bezpośredni kontakt z twórcą',
      'Prywatność i bezpieczeństwo danych'
    ],
    colorTheme,
    geometricShape,
    mockupGraphicType: 'app-preview'
  };
}
