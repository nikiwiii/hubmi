import {
  User,
  Idea,
  MatchResponse,
  BackendConversation,
  BackendMessage,
  InnovationRecord,
  InstitutionProfile,
  ServiceCard,
  ServiceCardResponse,
  getCategoryThemeAndShape,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "hubmi_jwt_token_v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getHeaders(includeAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * Centralny wrapper fetch z automatyczną obsługą błędu 401 (wygaśnięcie tokenu).
 * Przy statusie 401 czyści token i przekierowuje do /auth (z pominięciem endpointów logowania).
 */
async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, options);

  const isAuthEndpoint =
    url.includes("/api/login/user") ||
    url.includes("/api/login/admin") ||
    url.includes("/api/login/register");

  if (res.status === 401 && !isAuthEndpoint) {
    // Token wygasł lub jest nieprawidłowy w zapytaniach wymagających autoryzacji
    setAuthToken(null);
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/auth")
    ) {
      window.location.href = "/auth";
    }
  }

  return res;
}

// ==========================================
// 1. AUTH & PROFILES API (/api/login)
// ==========================================
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at?: string;
  };
  role?: string;
  user_id?: string;
  name?: string;
  full_name?: string;
  email?: string;
}

export function extractErrorMessage(errData: any, fallback: string): string {
  if (!errData) return fallback;
  if (typeof errData === "string") {
    if (errData.includes("[object Object]") || errData.includes("object Object")) {
      return fallback;
    }
    return errData;
  }
  if (typeof errData.detail === "string") {
    const detailLower = errData.detail.toLowerCase();
    if (
      detailLower.includes("password") ||
      (detailLower.includes("hasło") && (detailLower.includes("krótki") || detailLower.includes("znaki")))
    ) {
      return "Za krótkie hasło!";
    }
    return errData.detail;
  }
  if (Array.isArray(errData.detail)) {
    const isPasswordError = errData.detail.some((item: any) => {
      const loc = item?.loc;
      const type = item?.type;
      const msg = item?.msg;
      const locMatch = Array.isArray(loc)
        ? loc.some((l: any) => String(l).toLowerCase().includes("password"))
        : String(loc).toLowerCase().includes("password");
      const typeMatch = String(type).toLowerCase().includes("string_too_short");
      const msgMatch =
        String(msg).toLowerCase().includes("password") ||
        String(msg).toLowerCase().includes("hasło") ||
        String(msg).toLowerCase().includes("least 4 characters");
      return locMatch || (typeMatch && locMatch) || msgMatch;
    });
    if (isPasswordError) {
      return "Za krótkie hasło!";
    }
    const firstMsg = errData.detail[0]?.msg;
    if (typeof firstMsg === "string") {
      return firstMsg;
    }
    if (typeof errData.detail[0] === "string") {
      return errData.detail[0];
    }
  }
  if (typeof errData.detail === "object" && errData.detail !== null) {
    if (typeof errData.detail.msg === "string") return errData.detail.msg;
    if (typeof errData.detail.message === "string") return errData.detail.message;
  }
  if (typeof errData.message === "string") {
    if (errData.message.includes("[object Object]") || errData.message.includes("object Object")) {
      return fallback;
    }
    return errData.message;
  }
  return fallback;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  const res = await apiFetch(`${API_BASE}/api/login/user`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Błąd logowania użytkownika."));
  }

  const data: LoginResponse = await res.json();
  setAuthToken(data.access_token);

  const userId = data.user?.id || data.user_id || `user-${Date.now()}`;
  const userEmail = data.user?.email || data.email || email;
  const userName =
    data.user?.full_name ||
    data.name ||
    data.full_name ||
    userEmail.split("@")[0];
  const userRole = data.user?.role || data.role;
  const isAdmin =
    userRole === "admin" || userEmail.toLowerCase().includes("admin");

  return {
    id: userId,
    email: userEmail,
    name: userName,
    role: isAdmin ? "admin" : "creator",
    avatarBg: isAdmin ? "#F5E85A" : "#A4B3F6",
    createdAt:
      data.user?.created_at?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    status: "active",
  };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<User> {
  const res = await apiFetch(`${API_BASE}/api/login/admin`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Błąd logowania administratora."));
  }

  const data: LoginResponse = await res.json();
  setAuthToken(data.access_token);

  const userId = data.user?.id || data.user_id || `admin-${Date.now()}`;
  const userEmail = data.user?.email || data.email || email;
  const userName =
    data.user?.full_name ||
    data.name ||
    data.full_name ||
    "Główny Administrator";

  return {
    id: userId,
    email: userEmail,
    name: userName,
    role: "admin",
    avatarBg: "#F5E85A",
    createdAt:
      data.user?.created_at?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    status: "active",
  };
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: string = "user",
): Promise<User> {
  const res = await apiFetch(`${API_BASE}/api/login/register`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ email, password, full_name: name, role }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Błąd rejestracji konta."));
  }

  // After registration, log the user in to get JWT token
  if (role === "admin") {
    return loginAdmin(email, password);
  }
  return loginUser(email, password);
}

export async function fetchCurrentProfile(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await apiFetch(`${API_BASE}/api/login/me`, {
      method: "GET",
      headers: getHeaders(true),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const userRole = data.role === "admin" ? "admin" : "creator";
    const userName =
      data.full_name || data.name || data.email?.split("@")[0] || "Użytkownik";
    return {
      id: data.id,
      email: data.email,
      name: userName,
      role: userRole,
      avatarBg: userRole === "admin" ? "#F5E85A" : "#A4B3F6",
      createdAt: data.created_at?.split("T")[0] || "2026-03-01",
      status: "active",
    };
  } catch {
    return null;
  }
}

// ==========================================
// 2. IDEAS & REACTIONS API (/api/ideas)
// ==========================================
export interface BackendIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  user_id: string;
  author_name: string;
  image_url?: string | null;
  created_at: string;
  likes_count: number;
  volunteers_count: number;
  dislikes_count: number;
  my_reactions: string[];
}

export function mapBackendIdeaToFrontend(b: BackendIdea): Idea {
  const { theme, shape } = getCategoryThemeAndShape(
    b.category || "Społeczność",
  );
  return {
    id: b.id,
    title: b.title,
    subtitle: b.category ? `Kategoria: ${b.category}` : "Innowacja społeczna",
    authorId: b.user_id,
    authorName: b.author_name || "Użytkownik minno",
    authorEmail: `${b.user_id}@minno.pl`,
    category: b.category || "Społeczność",
    summary:
      b.description.slice(0, 140) + (b.description.length > 140 ? "..." : ""),
    description: b.description,
    targetAudience: "Mieszkańcy i społeczność lokalna",
    keyBenefits: [
      "Wsparcie ekspertów ROPS",
      "Możliwość dofinansowania",
      "Otwarte testy prototypu",
    ],
    likes: b.likes_count || 0,
    dislikes: b.dislikes_count || 0,
    userVote: b.my_reactions?.includes("like")
      ? "like"
      : b.my_reactions?.includes("dislike")
        ? "dislike"
        : null,
    testersCount: b.volunteers_count || 0,
    testersList: b.my_reactions?.includes("volunteer") ? ["current_user"] : [],
    colorTheme: theme,
    geometricShape: shape,
    visualMockupUrl: b.image_url || undefined,
    status: "active",
    createdAt: b.created_at ? b.created_at.split("T")[0] : "2026-03-01",
    commentsCount: 0,
  };
}

export async function fetchIdeasFromBackend(): Promise<Idea[]> {
  const res = await apiFetch(`${API_BASE}/api/ideas/`, {
    method: "GET",
    headers: getHeaders(true),
  });

  if (!res.ok) {
    throw new Error("Failed to load ideas from backend");
  }

  const data: BackendIdea[] = await res.json();
  return data.map(mapBackendIdeaToFrontend);
}

export async function createIdeaOnBackend(data: {
  title: string;
  description: string;
  category?: string;
}): Promise<Idea> {
  const res = await apiFetch(`${API_BASE}/api/ideas/`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się dodać pomysłu.");
  }

  const created: BackendIdea = await res.json();
  return mapBackendIdeaToFrontend(created);
}

export async function deleteIdeaOnBackend(ideaId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/ideas/${ideaId}`, {
    method: "DELETE",
    headers: getHeaders(true),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się usunąć pomysłu.");
  }
}

export async function toggleIdeaReaction(
  ideaId: string,
  reactionType: "like" | "volunteer" | "dislike",
): Promise<{
  likes: number;
  volunteers: number;
  dislikes: number;
  active: boolean;
}> {
  const res = await apiFetch(`${API_BASE}/api/ideas/${ideaId}/react`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({ reaction_type: reactionType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zareagować na pomysł.");
  }

  const data = await res.json();
  return {
    likes: data.likes_count,
    volunteers: data.volunteers_count,
    dislikes: data.dislikes_count,
    active: data.active,
  };
}

// ==========================================
// 3. MATCHING & RAG CHATBOT API (/api/matching)
// ==========================================
export interface MatchingChatOptions {
  category?: string;
  powiat?: string;
  reporterType?: string;
}

export async function sendMatchingChat(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  options?: MatchingChatOptions,
): Promise<MatchResponse> {
  const res = await apiFetch(`${API_BASE}/api/matching/chat`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({
      message,
      conversation_history: history,
      category: options?.category,
      powiat: options?.powiat,
      reporter_type: options?.reporterType || "Mieszkaniec",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Błąd zapytania do chatbota innowacji.");
  }

  return await res.json();
}

export async function fetchInnovations(): Promise<any[]> {
  const res = await apiFetch(`${API_BASE}/api/matching/innovations`, {
    method: "GET",
    headers: getHeaders(false),
  });

  if (!res.ok) {
    throw new Error("Błąd pobierania innowacji.");
  }

  return await res.json();
}

export async function searchInnovations(
  search: string,
  limit = 30,
): Promise<InnovationRecord[]> {
  const url = new URL(`${API_BASE}/api/innovations`);
  if (search.trim()) url.searchParams.set("search", search.trim());
  url.searchParams.set("limit", String(limit));
  const res = await apiFetch(url.toString(), {
    method: "GET",
    headers: getHeaders(false),
  });
  if (!res.ok) {
    throw new Error("Błąd pobierania innowacji.");
  }
  return await res.json();
}

export async function fetchInnovationById(
  innovationId: string,
): Promise<InnovationRecord> {
  const res = await apiFetch(
    `${API_BASE}/api/innovations/${encodeURIComponent(innovationId)}`,
    { method: "GET", headers: getHeaders(false) },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, "Nie znaleziono innowacji."));
  }
  return await res.json();
}

// ==========================================
// 3b. MIDDLEMAN INNOWACJI API (/api/middleman)
// ==========================================
async function postMiddleman<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(`${API_BASE}/api/middleman/${path}`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      extractErrorMessage(err, "Asystent AI nie przygotował karty usługi. Spróbuj ponownie."),
    );
  }
  return await res.json();
}

export function adaptInnovation(
  innovationId: string,
  profile: InstitutionProfile,
): Promise<ServiceCardResponse> {
  return postMiddleman("adapt", { innovation_id: innovationId, profile });
}

export function refineServiceCard(
  innovationId: string,
  profile: InstitutionProfile,
  card: ServiceCard,
  instruction: string,
): Promise<ServiceCardResponse> {
  return postMiddleman("refine", {
    innovation_id: innovationId,
    profile,
    card,
    instruction,
  });
}

// ==========================================
// 4. ROPS KRAKÓW CHAT API (/api/chat)
// ==========================================
export async function startExpertConversation(data: {
  idea_id?: string;
  idea_title?: string;
  topic?: string;
  initial_message?: string;
}): Promise<BackendConversation> {
  const res = await apiFetch(`${API_BASE}/api/chat/conversations`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się otworzyć czatu z ekspertem.");
  }

  return await res.json();
}

export async function fetchConversations(
  statusFilter?: string,
): Promise<BackendConversation[]> {
  const url = new URL(`${API_BASE}/api/chat/conversations`);
  if (statusFilter) url.searchParams.set("status", statusFilter);

  const res = await apiFetch(url.toString(), {
    method: "GET",
    headers: getHeaders(true),
  });

  if (!res.ok) {
    throw new Error("Błąd pobierania listy rozmów.");
  }

  return await res.json();
}

export async function fetchConversationDetails(
  conversationId: string,
): Promise<BackendConversation> {
  const res = await apiFetch(
    `${API_BASE}/api/chat/conversations/${conversationId}`,
    {
      method: "GET",
      headers: getHeaders(true),
    },
  );

  if (!res.ok) {
    throw new Error("Błąd pobierania szczegółów rozmowy.");
  }

  return await res.json();
}

export async function pollConversationMessages(
  conversationId: string,
  afterId?: string,
  since?: string,
): Promise<{
  messages: BackendMessage[];
  last_polled_at: string;
  new_messages_count: number;
  assigned_admin_name?: string;
}> {
  const url = new URL(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
  );
  if (afterId) url.searchParams.set("after_id", afterId);
  if (since) url.searchParams.set("since", since);

  const res = await apiFetch(url.toString(), {
    method: "GET",
    headers: getHeaders(true),
  });

  if (!res.ok) {
    throw new Error("Błąd odpytywania wiadomości.");
  }

  return await res.json();
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
): Promise<BackendMessage> {
  const res = await apiFetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ content }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Błąd wysyłania wiadomości.");
  }

  return await res.json();
}

export async function updateConversationStatus(
  conversationId: string,
  status: "open" | "in_progress" | "closed",
): Promise<BackendConversation> {
  const res = await apiFetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/status`,
    {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Błąd zmiany statusu rozmowy.");
  }

  return await res.json();
}

/**
 * Pobiera aktualną listę wskaźników z bazy Supabase poprzez backend API.
 */
export async function getLiveIndicators(): Promise<any> {
  const res = await apiFetch(`${API_BASE}/api/indicators`, {
    headers: getHeaders(false),
  });
  if (!res.ok) {
    throw new Error("Błąd pobierania wskaźników z serwera.");
  }
  return await res.json();
}

/**
 * Wymusza odświeżenie pamięci podręcznej wskaźników w backendzie.
 */
export async function refreshIndicatorsCache(): Promise<void> {
  await apiFetch(`${API_BASE}/api/indicators/refresh`, {
    method: "POST",
    headers: getHeaders(false),
  });
}

