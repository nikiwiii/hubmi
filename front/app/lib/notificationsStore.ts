import { NotificationItem } from './types';

const STORAGE_READ_NOTIFS_KEY = 'hubmi_read_notifications_v1';

export const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-grant-1',
    title: 'Nowy nabór grantowy ROPS Kraków!',
    message: "Rozpoczął się nabór w projekcie 'Małopolski Inkubator Innowacji Społecznych'. Granty do 50 000 zł na rozwiązania dla seniorów.",
    type: 'grant_call',
    read: false,
    created_at: '2026-10-03T18:00:00Z',
    link: '/knowledge',
    email_sent: true,
    email_recipient: 'mieszkaniec@malopolska.pl',
    email_subject: '[ROPS Kraków] Nowy nabór wniosków na innowacje społeczne (granty do 50 000 zł)'
  },
  {
    id: 'notif-idea-admin-1',
    title: 'Nowy pomysł zgłoszony przez mieszkańca',
    message: "Użytkownik dodał pomysł: 'Mobilny punkt wsparcia seniora w sołectwie'. Sprawdź zgłoszenie i przypisz mentora.",
    type: 'new_idea',
    read: false,
    created_at: '2026-10-03T18:45:00Z',
    link: '/admin',
    email_sent: true,
    email_recipient: 'admin@rops.krakow.pl',
    email_subject: '[MiNNO / Hubmi] Zgłoszono nowy pomysł mieszkańca w powiecie tarnowskim'
  },
  {
    id: 'notif-chat-1',
    title: 'Odpowiedź od eksperta ROPS Kraków',
    message: 'mgr Anna Kowalska odpisała na Twoje zapytanie dotyczące dofinansowania teleopieki w gminie.',
    type: 'chat_message',
    read: false,
    created_at: '2026-10-03T19:15:00Z',
    link: '/chat',
    email_sent: true,
    email_recipient: 'tworca@hubmi.org',
    email_subject: '[MiNNO / ROPS] mgr Anna Kowalska odpowiedziała na Twoją wiadomość na czacie'
  },
  {
    id: 'notif-partner-1',
    title: 'Zapytanie o partnerstwo NGO',
    message: "Stowarzyszenie 'Pomocna Dłoń' wyraziło chęć partnerstwa przy realizacji projektu opieki sąsiedzkiej.",
    type: 'partnership',
    read: false,
    created_at: '2026-10-03T19:30:00Z',
    link: '/discover',
    email_sent: true,
    email_recipient: 'tworca@hubmi.org',
    email_subject: '[MiNNO / Partnerstwa] Nowe zgłoszenie chęci partnerstwa od NGO'
  },
  {
    id: 'notif-expert-assigned-1',
    title: 'Przypisano mentora ROPS do pomysłu',
    message: 'dr inż. Michał Stankiewicz został przypisany jako Twój mentor ds. dostępności architektonicznej.',
    type: 'expert_assigned',
    read: false,
    created_at: '2026-10-03T20:00:00Z',
    link: '/chat',
    email_sent: true,
    email_recipient: 'tworca@hubmi.org',
    email_subject: '[MiNNO / ROPS] Twój pomysł otrzymał mentora merytorycznego'
  }
];

export function getStoredReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_READ_NOTIFS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch (e) {
    console.warn('Błąd odczytu przeczytanych powiadomień z localStorage:', e);
  }
  return new Set();
}

export function markStoredNotificationAsRead(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredReadIds();
    current.add(id);
    localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Błąd zapisu przeczytanego powiadomienia do localStorage:', e);
  }
}

export function markAllStoredNotificationsAsRead(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredReadIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Błąd zapisu wszystkich przeczytanych powiadomień do localStorage:', e);
  }
}

export function applyReadState(items: NotificationItem[]): NotificationItem[] {
  const readIds = getStoredReadIds();
  return items.map((item) => ({
    ...item,
    read: Boolean(item.read || readIds.has(item.id))
  }));
}

export function getInitialNotifications(role: string = 'creator'): NotificationItem[] {
  const isAdminOrExpert = role === 'admin' || role === 'expert';
  const filtered = FALLBACK_NOTIFICATIONS.filter((n) => {
    if (n.id === 'notif-grant-1') return true;
    if (isAdminOrExpert) {
      return n.id === 'notif-idea-admin-1';
    }
    return n.id !== 'notif-idea-admin-1';
  });
  return applyReadState(filtered);
}
