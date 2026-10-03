import { ChatMessage, ChatContact } from './types';

export const INITIAL_CONTACTS: ChatContact[] = [];

export const INITIAL_MESSAGES: ChatMessage[] = [];

const STORAGE_MESSAGES_KEY = 'hubmi_chat_messages_v1';

export function getChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
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

  return newMsg;
}
