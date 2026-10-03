import { ChatMessage, ChatContact } from './types';

export const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'user-admin-1',
    name: 'Marek Nowak (Koordynator)',
    role: 'Administrator Hubmi',
    avatarBg: '#F5E85A',
    lastMessage: 'Cześć! Jak możemy pomóc w rozwoju Twojego pomysłu?',
    lastMessageTime: '12:15',
    unreadCount: 0,
    isOnline: true
  },
  {
    id: 'user-jan-3',
    name: 'Jan Wiśniewski',
    role: 'Tester & Inżynier',
    avatarBg: '#98C5AE',
    lastMessage: 'Chętnie sprawdzę wersję próbną kosiarki sąsiedzkiej.',
    lastMessageTime: '11:40',
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 'user-lois-5',
    name: 'Lois Marshall',
    role: 'Twórczyni Klubu Rozmów',
    avatarBg: '#F5E85A',
    lastMessage: 'Najbliższe spotkanie w czwartek o 18:00.',
    lastMessageTime: 'Wczoraj',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'user-henrietta-6',
    name: 'Henrietta Blake',
    role: 'Autorka Asystenta Leków',
    avatarBg: '#A4B3F6',
    lastMessage: 'Dziękuję za zgłoszenie do testów głośnomówiących!',
    lastMessageTime: 'Wczoraj',
    unreadCount: 0,
    isOnline: true
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'user-admin-1',
    senderName: 'Marek Nowak (Koordynator)',
    receiverId: 'user-anna-2',
    text: 'Dzień dobry Pani Anno! Widziałem Pani projekt Sąsiedzkiej Narzędziowni – to znakomity pomysł dla naszej okolicy.',
    timestamp: '11:30'
  },
  {
    id: 'msg-2',
    senderId: 'user-anna-2',
    senderName: 'Anna Kowalska',
    receiverId: 'user-admin-1',
    text: 'Dziękuję Panie Marku! Zgłosiło się już 29 chętnych osób do testów.',
    timestamp: '11:35'
  },
  {
    id: 'msg-3',
    senderId: 'user-admin-1',
    senderName: 'Marek Nowak (Koordynator)',
    receiverId: 'user-anna-2',
    text: 'Cześć! Jak możemy pomóc w rozwoju Twojego pomysłu?',
    timestamp: '12:15'
  },
  {
    id: 'msg-4',
    senderId: 'user-jan-3',
    senderName: 'Jan Wiśniewski',
    receiverId: 'user-anna-2',
    text: 'Dzień dobry, mam w garażu wertykulator do trawnika, którego chętnie użyczę do wspólnej bazy!',
    timestamp: '11:38'
  },
  {
    id: 'msg-5',
    senderId: 'user-jan-3',
    senderName: 'Jan Wiśniewski',
    receiverId: 'user-anna-2',
    text: 'Chętnie sprawdzę wersję próbną kosiarki sąsiedzkiej.',
    timestamp: '11:40'
  }
];

const STORAGE_MESSAGES_KEY = 'hubmi_chat_messages_v1';

export function getChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  try {
    const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(stored);
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save messages', e);
  }
}

export function sendChatMessage(
  senderId: string,
  senderName: string,
  receiverId: string,
  text: string
): ChatMessage {
  const current = getChatMessages();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    senderId,
    senderName,
    receiverId,
    text,
    timestamp: timeStr
  };

  const updated = [...current, newMsg];
  saveChatMessages(updated);

  // Trigger simulated smart reply after a brief delay if sent to mock user
  if (receiverId !== senderId) {
    scheduleSimulatedReply(receiverId, senderId, text);
  }

  return newMsg;
}

// Scheduled reply that simulates real conversational responses arriving during 1s polling
function scheduleSimulatedReply(fromUserId: string, toUserId: string, userPrompt: string) {
  setTimeout(() => {
    const current = getChatMessages();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    let replyText = 'Dziękuję za wiadomość! Przeanalizuję to i odezwę się niebawem.';
    let senderName = 'Społeczność Hubmi';

    if (fromUserId === 'user-admin-1') {
      senderName = 'Marek Nowak (Koordynator)';
      replyText = `Świetna uwaga odnośnie: "${userPrompt.slice(0, 35)}...". Zanotowałem w bazie projektów, wspieramy ten kierunek!`;
    } else if (fromUserId === 'user-jan-3') {
      senderName = 'Jan Wiśniewski';
      replyText = 'Doskonałe podejście. Jako tester 40+ zwracam uwagę przede wszystkim na przejrzyste litery i prosty przycisk akcji.';
    } else if (fromUserId === 'user-henrietta-6') {
      senderName = 'Henrietta Blake';
      replyText = 'Dokładnie tak, prostota to klucz. Dobre rozwiązania nie potrzebują skomplikowanych instrukcji!';
    } else if (fromUserId === 'user-lois-5') {
      senderName = 'Lois Marshall';
      replyText = 'Bardzo chętnie poruszymy ten temat na naszym najbliższym czwartkowym spotkaniu przy kawie.';
    }

    const replyMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: fromUserId,
      senderName,
      receiverId: toUserId,
      text: replyText,
      timestamp: timeStr
    };

    saveChatMessages([...current, replyMsg]);
  }, 2200);
}
