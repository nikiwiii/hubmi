import { useState, useEffect } from "react";
import { ChatContact, INITIAL_CONTACTS } from "./mock-data";

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "user-anna-2": [
    {
      id: "m1",
      sender: "them",
      text: "Cześć! Dziękuję za zainteresowanie Sąsiedzką Narzędziownią!",
      time: "12:30",
    },
    {
      id: "m2",
      sender: "them",
      text: "Wiertarka udarowa i glebogryzarka są wolne w tę sobotę. Pasuje Ci odbiór około 11:00?",
      time: "12:35",
    },
    {
      id: "m3",
      sender: "me",
      text: "Tak, świetnie! Chętnie przetestuję też procedurę rezerwacji w aplikacji.",
      time: "12:40",
    },
  ],
  "user-lois-5": [
    {
      id: "m1",
      sender: "them",
      text: "Dzień dobry! Najbliższe spotkanie Klubu Mądrości jest w czwartek o 18:00.",
      time: "Wczoraj",
    },
    {
      id: "m2",
      sender: "me",
      text: "Super, czy przygotować jakiś konkretny temat na dyskusję?",
      time: "Wczoraj",
    },
  ],
  "user-henrietta-6": [
    {
      id: "m1",
      sender: "them",
      text: "Dziękuję za zgłoszenie do testów wersji głosowej asystenta leków!",
      time: "2 dni temu",
    },
  ],
  "user-jan-3": [
    {
      id: "m1",
      sender: "them",
      text: "Dodałem nową trasę w okolicach Drawska. Daj znać jak oceniasz punkty postojowe!",
      time: "3 dni temu",
    },
  ],
};

let storeContacts: ChatContact[] = [...INITIAL_CONTACTS];
let storeMessages: Record<string, Message[]> = { ...INITIAL_MESSAGES };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function useChatStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const getContact = (id: string): ChatContact | undefined => {
    return storeContacts.find((c) => c.id === id);
  };

  const getMessages = (contactId: string): Message[] => {
    return storeMessages[contactId] || [];
  };

  const sendMessage = (contactId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: "me",
      text: trimmed,
      time: "Teraz",
    };

    storeMessages = {
      ...storeMessages,
      [contactId]: [...(storeMessages[contactId] || []), newMessage],
    };

    storeContacts = storeContacts.map((c) =>
      c.id === contactId
        ? { ...c, lastMessage: trimmed, lastMessageTime: "Teraz" }
        : c,
    );

    notify();
  };

  const markAsRead = (contactId: string) => {
    storeContacts = storeContacts.map((c) =>
      c.id === contactId ? { ...c, unreadCount: 0 } : c,
    );
    notify();
  };

  return {
    contacts: storeContacts,
    getContact,
    getMessages,
    sendMessage,
    markAsRead,
  };
}
