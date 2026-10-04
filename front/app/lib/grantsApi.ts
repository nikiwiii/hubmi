import { getAuthToken } from './api';
import { IDEA_CREATOR_BASE, IdeaCreatorError } from './ideaCreatorApi';

export type FieldType = 'short_text' | 'long_text' | 'number' | 'date';
export type CallStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: 'Krótki tekst',
  long_text: 'Długi tekst',
  number: 'Liczba / kwota',
  date: 'Data',
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  draft: 'Szkic',
  published: 'Opublikowany',
  closed: 'Zamknięty',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Szkic',
  submitted: 'Złożony',
  under_review: 'W ocenie',
  accepted: 'Zaakceptowany',
  rejected: 'Odrzucony',
};

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft: 'bg-stone-100 text-stone-700',
  submitted: 'bg-sky-50 text-sky-700',
  under_review: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

export interface CallField {
  id: string;
  label: string;
  section: string;
  help: string;
  type: FieldType;
  required: boolean;
  max_chars: number | null;
}

export interface GrantCall {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: CallStatus;
  template_url: string | null;
  template_filename: string | null;
  fields: CallField[];
  created_at: string | null;
  is_open: boolean;
  applications_count: number | null;
  extraction_error: string | null;
}

export interface GrantApplication {
  id: string;
  call_id: string;
  idea_id: string | null;
  user_id: string;
  author_name: string | null;
  idea_title: string | null;
  answers: Record<string, string>;
  ai_filled: string[];
  status: ApplicationStatus;
  admin_comment: string | null;
  created_at: string | null;
  updated_at: string | null;
  submitted_at: string | null;
  call: GrantCall | null;
}

export interface AssistTurn {
  question: string;
  answer: string;
}

export interface CallUpdate {
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  status?: CallStatus;
  fields?: CallField[];
}

async function call<T>(method: string, path: string, body?: unknown, fallback = 'Wystąpił błąd. Spróbuj ponownie.'): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${IDEA_CREATOR_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new IdeaCreatorError('Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.', 0);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = typeof err.detail === 'string' ? err.detail : fallback;
    throw new IdeaCreatorError(message, res.status);
  }
  return res.json();
}

// ----- in-memory cache for calls & applications -----

let cachedAllCalls: GrantCall[] | null = null;
let cachedOpenCalls: GrantCall[] | null = null;
let cachedMyApplications: GrantApplication[] | null = null;
const cachedCallApplications: Record<string, GrantApplication[] | undefined> = {};

let pendingAllCallsPromise: Promise<GrantCall[]> | null = null;
let pendingOpenCallsPromise: Promise<GrantCall[]> | null = null;
let pendingMyApplicationsPromise: Promise<GrantApplication[]> | null = null;
const pendingCallApplicationsPromise: Record<string, Promise<GrantApplication[]> | undefined> = {};

export function invalidateGrantsCache(): void {
  cachedAllCalls = null;
  cachedOpenCalls = null;
  cachedMyApplications = null;
  for (const key of Object.keys(cachedCallApplications)) {
    delete cachedCallApplications[key];
  }
}

// ----- calls -----

export const fetchOpenCalls = (forceRefresh = false): Promise<GrantCall[]> => {
  if (!forceRefresh && cachedOpenCalls !== null) {
    return Promise.resolve(cachedOpenCalls);
  }
  if (pendingOpenCallsPromise) {
    return pendingOpenCallsPromise;
  }
  pendingOpenCallsPromise = call<GrantCall[]>('GET', '/calls/open')
    .then((data) => {
      cachedOpenCalls = data;
      return data;
    })
    .finally(() => {
      pendingOpenCallsPromise = null;
    });
  return pendingOpenCallsPromise;
};

export const fetchAllCalls = (forceRefresh = false): Promise<GrantCall[]> => {
  if (!forceRefresh && cachedAllCalls !== null) {
    return Promise.resolve(cachedAllCalls);
  }
  if (pendingAllCallsPromise) {
    return pendingAllCallsPromise;
  }
  pendingAllCallsPromise = call<GrantCall[]>('GET', '/calls')
    .then((data) => {
      cachedAllCalls = data;
      return data;
    })
    .finally(() => {
      pendingAllCallsPromise = null;
    });
  return pendingAllCallsPromise;
};

export const fetchCall = (id: string) => call<GrantCall>('GET', `/calls/${id}`);

export async function createCall(data: { title: string; description: string; starts_at: string; ends_at: string; template: File }) {
  const form = new FormData();
  form.append('title', data.title);
  form.append('description', data.description);
  form.append('starts_at', data.starts_at);
  form.append('ends_at', data.ends_at);
  form.append('template', data.template);
  const result = await call<GrantCall>('POST', '/calls', form, 'Nie udało się utworzyć naboru.');
  invalidateGrantsCache();
  return result;
}

export const updateCall = async (id: string, update: CallUpdate) => {
  const result = await call<GrantCall>('PATCH', `/calls/${id}`, update, 'Nie udało się zapisać naboru.');
  invalidateGrantsCache();
  return result;
};

export const reextractCallFields = async (id: string) => {
  const result = await call<GrantCall>('POST', `/calls/${id}/extract-fields`, undefined, 'Nie udało się odczytać pól z PDF.');
  invalidateGrantsCache();
  return result;
};

export const fetchCallApplications = (id: string, forceRefresh = false): Promise<GrantApplication[]> => {
  const existing = cachedCallApplications[id];
  if (!forceRefresh && existing !== undefined) {
    return Promise.resolve(existing);
  }
  const pending = pendingCallApplicationsPromise[id];
  if (pending) {
    return pending;
  }
  const promise = call<GrantApplication[]>('GET', `/calls/${id}/applications`)
    .then((data) => {
      cachedCallApplications[id] = data;
      return data;
    })
    .finally(() => {
      delete pendingCallApplicationsPromise[id];
    });
  pendingCallApplicationsPromise[id] = promise;
  return promise;
};

// ----- applications -----

export const createApplication = async (callId: string, ideaId: string) => {
  const result = await call<GrantApplication>(
    'POST',
    '/applications',
    { call_id: callId, idea_id: ideaId },
    'Nie udało się przygotować wniosku.',
  );
  invalidateGrantsCache();
  return result;
};

export const fetchMyApplications = (forceRefresh = false): Promise<GrantApplication[]> => {
  if (!forceRefresh && cachedMyApplications !== null) {
    return Promise.resolve(cachedMyApplications);
  }
  if (pendingMyApplicationsPromise) {
    return pendingMyApplicationsPromise;
  }
  pendingMyApplicationsPromise = call<GrantApplication[]>('GET', '/applications/mine')
    .then((data) => {
      cachedMyApplications = data;
      return data;
    })
    .finally(() => {
      pendingMyApplicationsPromise = null;
    });
  return pendingMyApplicationsPromise;
};

export const fetchApplication = (id: string) => call<GrantApplication>('GET', `/applications/${id}`);

export const saveApplication = async (id: string, answers: Record<string, string>) => {
  const result = await call<GrantApplication>('PATCH', `/applications/${id}`, { answers }, 'Nie udało się zapisać wniosku.');
  if (cachedMyApplications) {
    cachedMyApplications = cachedMyApplications.map((a) => (a.id === id ? { ...a, ...result } : a));
  }
  return result;
};

export const submitApplication = async (id: string) => {
  const result = await call<GrantApplication>('POST', `/applications/${id}/submit`, undefined, 'Nie udało się wysłać wniosku.');
  invalidateGrantsCache();
  return result;
};

export const updateApplicationStatus = async (id: string, status: ApplicationStatus, adminComment?: string) => {
  const result = await call<GrantApplication>('PATCH', `/applications/${id}/status`, { status, admin_comment: adminComment });
  invalidateGrantsCache();
  return result;
};

export const assistQuestion = (id: string, fieldId: string, history: AssistTurn[]) =>
  call<{ question: string | null; done: boolean }>(
    'POST',
    `/applications/${id}/assist/question`,
    { field_id: fieldId, history },
    'Asystent nie mógł przygotować pytania.',
  );

export const assistDraft = (id: string, fieldId: string, history: AssistTurn[]) =>
  call<{ value: string }>(
    'POST',
    `/applications/${id}/assist/draft`,
    { field_id: fieldId, history },
    'Asystent nie mógł przygotować propozycji.',
  );

/**
 * The PDF endpoint needs the bearer token, so the file is fetched as a blob. Blob URLs only resolve
 * in the document that created them, so it is shown in an in-page iframe or downloaded, never opened in a new tab.
 */
export async function fetchApplicationPdf(id: string): Promise<Blob> {
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(`${IDEA_CREATOR_BASE}/applications/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new IdeaCreatorError('Brak połączenia z serwerem.', 0);
  }
  if (!res.ok) throw new IdeaCreatorError('Nie udało się wygenerować PDF.', res.status);
  return res.blob();
}

export function pdfFileName(id: string, title?: string | null): string {
  const slug = (title || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `wniosek-${slug || id.slice(0, 8)}.pdf`;
}

export function downloadUrl(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** `datetime-local` input value <-> ISO string (UTC). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}
