import { Idea, getCategoryThemeAndShape } from './types';
import { API_BASE, getAuthToken } from './api';

export const IDEA_CREATOR_BASE = process.env.NEXT_PUBLIC_IDEA_CREATOR_URL || `${API_BASE}/api/idea-creator`;

export type Stage = 'pomysl' | 'prototyp' | 'przetestowane_rozwiazanie' | 'gotowe_do_wdrozenia';
export type IdeaField = 'tytul' | 'opis' | 'innowacyjnosc' | 'odbiorcy' | 'etap';

export const STAGE_OPTIONS: { value: Stage; label: string; hint: string }[] = [
  { value: 'pomysl', label: 'Pomysł', hint: 'Nic jeszcze nie zostało zbudowane' },
  { value: 'prototyp', label: 'Prototyp / pilotaż', hint: 'Istnieje prototyp lub pilotaż' },
  { value: 'przetestowane_rozwiazanie', label: 'Przetestowane rozwiązanie', hint: 'Sprawdzone w praktyce, np. w mikroskali' },
  { value: 'gotowe_do_wdrozenia', label: 'Gotowe do wdrożenia', hint: 'Przetestowane i gotowe do wdrożenia' },
];

export const FIELD_LABELS: Record<IdeaField, string> = {
  tytul: 'Tytuł',
  opis: 'Opis projektu',
  innowacyjnosc: 'Na czym polega innowacyjność?',
  odbiorcy: 'Dla kogo jest projekt?',
  etap: 'Etap',
};

export function stageLabel(stage: Stage | null | undefined): string {
  return STAGE_OPTIONS.find((s) => s.value === stage)?.label ?? 'Nie wybrano';
}

export interface IdeaFields {
  tytul: string;
  opis: string;
  innowacyjnosc: string;
  odbiorcy: string;
  etap: Stage | null;
}

export const EMPTY_FIELDS: IdeaFields = { tytul: '', opis: '', innowacyjnosc: '', odbiorcy: '', etap: null };

export interface AssistantQuestion {
  id: string;
  field: IdeaField;
  text: string;
}

export interface HistoryEntry {
  field: IdeaField;
  question: string;
  answer: string; // '' = skipped
  accepted: boolean | null;
}

export interface QuestionResult {
  question: AssistantQuestion | null;
  completeness: number | null;
  round: number;
  max_rounds: number;
  done: boolean;
}

export interface RefineResult {
  proposal: IdeaFields;
  changes: { field: IdeaField; summary: string }[];
}

export interface PublishedProject extends IdeaFields {
  id: string;
  category: string;
  user_id: string | null;
  author_name: string | null;
  image_url?: string | null;
  created_at: string | null;
}

export class IdeaCreatorError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, body: unknown, fallback: string, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${IDEA_CREATOR_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new IdeaCreatorError('Brak połączenia z serwerem asystenta. Sprawdź, czy jest uruchomiony.', 0);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // FastAPI returns a string for HTTPException and an array for validation errors (422).
    const message = typeof err.detail === 'string' ? err.detail : fallback;
    throw new IdeaCreatorError(message, res.status);
  }
  return res.json();
}

export function fetchNextQuestion(fields: IdeaFields, history: HistoryEntry[]): Promise<QuestionResult> {
  return request('/assistant/questions', { ...fields, history }, 'Nie udało się pobrać pytania od asystenta.');
}

export function refineField(fields: IdeaFields, question: AssistantQuestion, answer: string): Promise<RefineResult> {
  return request('/assistant/refine', { ...fields, question, answer }, 'Nie udało się przygotować propozycji.');
}

export function publishProject(fields: IdeaFields, category?: string, image?: string): Promise<PublishedProject> {
  return request(
    '/projects',
    { ...fields, category: category || undefined, image: image || undefined },
    'Sprawdź, czy wszystkie pola są wypełnione.',
    true
  );
}

export interface GeneratedImage {
  image: string; // data URL
  prompt: string;
  model: string;
}

export function generateImage(fields: IdeaFields, category?: string): Promise<GeneratedImage> {
  return request(
    '/generate_image',
    { ...fields, category: category || undefined },
    'Uzupełnij przynajmniej tytuł lub opis, aby wygenerować obraz.'
  );
}

export function mapProjectToIdea(p: PublishedProject): Idea {
  const { theme, shape } = getCategoryThemeAndShape(p.category);
  const opis = p.opis || '';
  return {
    id: p.id,
    title: p.tytul,
    subtitle: `Etap: ${stageLabel(p.etap)}`,
    authorId: p.user_id || '',
    authorName: p.author_name || 'Użytkownik minno',
    authorEmail: `${p.user_id}@minno.pl`,
    category: p.category || 'general',
    summary: opis.slice(0, 140) + (opis.length > 140 ? '...' : ''),
    description: opis,
    targetAudience: p.odbiorcy || '',
    keyBenefits: p.innowacyjnosc ? [p.innowacyjnosc] : [],
    likes: 0,
    dislikes: 0,
    userVote: null,
    testersCount: 0,
    testersList: [],
    colorTheme: theme,
    geometricShape: shape,
    visualMockupUrl: p.image_url || undefined,
    status: 'active',
    createdAt: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    commentsCount: 0,
  };
}
