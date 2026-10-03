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
    id: 'user-admin-1',
    email: 'admin@hubmi.pl',
    name: 'Marek Nowak (Koordynator)',
    role: 'admin',
    avatarBg: '#F5E85A', // yellow
    createdAt: '2026-01-15',
    status: 'active',
    bio: 'Administrator platformy Hubmi, opiekun projektów dla dojrzałych twórców.'
  },
  {
    id: 'user-anna-2',
    email: 'anna.kowalska@hubmi.pl',
    name: 'Anna Kowalska',
    role: 'creator',
    avatarBg: '#A4B3F6', // periwinkle
    createdAt: '2026-02-10',
    status: 'active',
    bio: 'Entuzjastka ogrodnictwa i prostych rozwiązań technologicznych. 48 lat.'
  },
  {
    id: 'user-jan-3',
    email: 'jan.wisniewski@hubmi.pl',
    name: 'Jan Wiśniewski',
    role: 'tester',
    avatarBg: '#98C5AE', // sage green
    createdAt: '2026-02-28',
    status: 'active',
    bio: 'Doświadczony majsterkowicz, emerytowany inżynier mechanik. Chętnie testuje nowe pomysły.'
  },
  {
    id: 'user-elzbieta-4',
    email: 'elzbieta.dabrowska@hubmi.pl',
    name: 'Elżbieta Dąbrowska',
    role: 'creator',
    avatarBg: '#C58BFA', // lilac
    createdAt: '2026-03-05',
    status: 'active',
    bio: 'Organizatorka wypraw rowerowych i warsztatów kulinarnych.'
  }
];

const STORAGE_USERS_KEY = 'hubmi_users_v1';
const STORAGE_CURRENT_USER_KEY = 'hubmi_current_user_v1';

export function getUsers(): User[] {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(stored);
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
  if (typeof window === 'undefined') return INITIAL_USERS[1]; // default to Anna
  try {
    const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!stored) {
      // Default to Anna Kowalska for immediate pleasant experience
      const defaultUser = INITIAL_USERS[1];
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_USERS[1];
  }
}

export function setCurrentUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    } else {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to set current user', e);
  }
}
