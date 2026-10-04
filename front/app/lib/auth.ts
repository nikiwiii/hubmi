import { User } from './types';

// SHA-256 Hash helper using Web Crypto API
export async function computeSha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple deterministic fallback for non-crypto environments
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export const INITIAL_USERS: User[] = [
  {
    id: "a25b7015-322a-42d5-88f2-153a0ae7e116",
    name: "Administrator",
    email: "admin@hubmi.com",
    role: "admin",
    avatarBg: "#F5E85A",
    createdAt: "2026-03-01",
    status: "active",
  },
  {
    id: "72cd5970-144f-460f-9eff-84ca8dc7c7f8",
    name: "Jan Tester",
    email: "tester@gmail.com",
    role: "tester",
    avatarBg: "#CAD7CE",
    createdAt: "2026-03-05",
    status: "active",
  },
  {
    id: "38c11c1b-c0d7-45dc-af89-50b28a96fc27",
    name: "Tester ROPS",
    email: "tester_46fc8d@hubmi.pl",
    role: "tester",
    avatarBg: "#CAD7CE",
    createdAt: "2026-03-10",
    status: "active",
  },
  {
    id: "f0c40d39-f6ac-402c-b9e7-29e6a68e1233",
    name: "Jan Kowalski",
    email: "user@hubmi.com",
    role: "creator",
    avatarBg: "#A4B3F6",
    createdAt: "2026-03-12",
    status: "active",
  },
  {
    id: "a9f4ba9b-f94f-4f1b-83b7-87f216a1e8c4",
    name: "Arkadiusz",
    email: "askupien8@gmail.com",
    role: "creator",
    avatarBg: "#A4B3F6",
    createdAt: "2026-03-15",
    status: "active",
  },
];

const STORAGE_USERS_KEY = 'hubmi_users_v2';
const STORAGE_CURRENT_USER_KEY = 'hubmi_current_user_v2';

export function getUsers(): User[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    if (!stored) {
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    // Clean up legacy key if present
    localStorage.removeItem('hubmi_current_user_v1');
    const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!stored) {
      return null;
    }
    const parsed: User = JSON.parse(stored);
    if (parsed && !parsed.name) {
      parsed.name = parsed.email ? parsed.email.split('@')[0] : 'Użytkownik';
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      localStorage.removeItem('hubmi_current_user_v1');
    } else {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}
