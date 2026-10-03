"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatMessage, ChatContact, BackendConversation } from "../lib/types";
import {
  INITIAL_CONTACTS,
  getChatMessages,
  sendChatMessage,
} from "../lib/chatStore";
import {
  fetchConversations,
  pollConversationMessages,
  sendConversationMessage,
  startExpertConversation,
} from "../lib/api";
import {
  Send,
  MessageCircle,
  Plus,
  Shield,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";

function ChatContent() {
  const { currentUser, isLoadingUser } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientFromUrl = searchParams?.get("recipient");

  // ── ALL HOOKS FIRST (Rules of Hooks) ──────────────────────────────────────
  const [backendConversations, setBackendConversations] = useState<
    BackendConversation[]
  >([]);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>(
    recipientFromUrl || "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isCreatingNewThread, setIsCreatingNewThread] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const [isPollingActive, setIsPollingActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = currentUser?.id || "";
  const currentUserName = currentUser?.name || "";
  const isExpertOrAdmin = currentUser?.role === "admin";

  // Auth guard — redirect to /auth when not logged in
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, isLoadingUser, router]);

  // Sync activeContactId from URL param
  useEffect(() => {
    if (recipientFromUrl) {
      setActiveContactId(recipientFromUrl);
    }
  }, [recipientFromUrl]);

  // 1. Load backend conversations on mount
  useEffect(() => {
    if (!currentUser) return;
    const loadConversations = async () => {
      try {
        const convs = await fetchConversations();
        if (convs && convs.length > 0) {
          setBackendConversations(convs);
          const mappedContacts: ChatContact[] = convs.map((c) => ({
            id: c.id,
            name: isExpertOrAdmin
              ? `${c.user_name} (${c.topic})`
              : c.assigned_admin_name || "Ekspert ROPS Kraków",
            role: c.topic || "Konsultacje innowacji społecznych",
            avatarBg: isExpertOrAdmin ? "#A4B3F6" : "#F5E85A",
            lastMessage: c.last_message || "Rozpoczęto rozmowę",
            lastMessageTime: c.last_message_at
              ? new Date(c.last_message_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Teraz",
            unreadCount: isExpertOrAdmin ? c.unread_by_admin : c.unread_by_user,
            isOnline: true,
          }));
          setContacts(mappedContacts);
          if (!recipientFromUrl) {
            setActiveContactId(mappedContacts[0].id);
          }
        }
      } catch (err) {
        console.warn("Backend chat note (using local demo threads):", err);
      }
    };
    loadConversations();
  }, [currentUser, isExpertOrAdmin, recipientFromUrl]);

  // 2. Polling co 3 sekundy
  useEffect(() => {
    if (!currentUser || !activeContactId) return;
    let isMounted = true;

    const fetchLatest = async () => {
      setIsPollingActive(true);
      const isBackendConv = backendConversations.some(
        (c) => c.id === activeContactId,
      );
      if (isBackendConv) {
        try {
          const pollRes = await pollConversationMessages(activeContactId);
          if (isMounted && pollRes.messages) {
            const mapped: ChatMessage[] = pollRes.messages.map((m) => ({
              id: m.id,
              senderId: m.sender_id,
              senderName: m.sender_name,
              receiverId: activeContactId,
              text: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }));
            setMessages(mapped);
          }
        } catch {
          // Fallback
        }
      } else {
        const allMsgs = getChatMessages();
        const conversation = allMsgs.filter(
          (m) =>
            (m.senderId === currentUserId &&
              m.receiverId === activeContactId) ||
            (m.senderId === activeContactId && m.receiverId === currentUserId),
        );
        if (isMounted) setMessages(conversation);
      }
      setTimeout(() => {
        if (isMounted) setIsPollingActive(false);
      }, 500);
    };

    fetchLatest();
    const intervalId = setInterval(fetchLatest, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeContactId, backendConversations, currentUserId, currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── EARLY RETURNS (after all hooks) ───────────────────────────────────────
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm font-medium">Sprawdzanie sesji...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-stone-500">
        <Lock className="w-8 h-8 text-stone-300" />
        <p className="text-sm font-medium">
          Zaloguj się, aby korzystać z czatu.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Przejdź do logowania
        </button>
      </div>
    );
  }

  const activeContact =
    contacts.find((c) => c.id === activeContactId) || contacts[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !activeContact) return;

    setInputText("");

    const isBackendConv = backendConversations.some(
      (c) => c.id === activeContactId,
    );

    if (isBackendConv) {
      try {
        const sent = await sendConversationMessage(
          activeContactId,
          text.trim(),
        );
        setMessages((prev) => [
          ...prev,
          {
            id: sent.id,
            senderId: sent.sender_id,
            senderName: sent.sender_name,
            receiverId: activeContactId,
            text: sent.content,
            timestamp: new Date(sent.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        return;
      } catch (e) {
        console.warn("Backend send failed, using local fallback:", e);
      }
    }

    // Local fallback
    sendChatMessage(
      currentUserId,
      currentUserName,
      activeContactId,
      text.trim(),
    );
    const all = getChatMessages();
    const conversation = all.filter(
      (m) =>
        (m.senderId === currentUserId && m.receiverId === activeContactId) ||
        (m.senderId === activeContactId && m.receiverId === currentUserId),
    );
    setMessages(conversation);
  };

  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      const created = await startExpertConversation({
        topic: newTopic.trim(),
        initial_message: newInitialMsg.trim() || undefined,
      });

      const newContact: ChatContact = {
        id: created.id,
        name: created.assigned_admin_name || "Ekspert ROPS Kraków",
        role: created.topic,
        avatarBg: "#F5E85A",
        lastMessage: created.last_message || "Otwarto nowy wątek",
        lastMessageTime: "Teraz",
        isOnline: true,
      };

      setBackendConversations((prev) => [created, ...prev]);
      setContacts((prev) => [newContact, ...prev]);
      setActiveContactId(created.id);
      setIsCreatingNewThread(false);
      setNewTopic("");
      setNewInitialMsg("");
    } catch (err: any) {
      alert(err?.message || "Nie udało się utworzyć wątku.");
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EFE5C6] flex items-center justify-center text-stone-900 font-bold">
            <Shield className="w-5 h-5 text-stone-800" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Platforma Aktywnej Komunikacji (ROPS Kraków)
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Bezpośredni dialog z ekspertami i mentorami innowacji społecznych.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingNewThread(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Napisz do eksperta</span>
          </button>
        </div>
      </div>

      {/* New Thread Modal */}
      {isCreatingNewThread && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-stone-900">
              Otwórz zapytanie do eksperta ROPS Kraków
            </h3>
            <form onSubmit={handleCreateNewConversation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Temat rozmowy / obszar problemu
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="np. Dofinansowanie dla klubu seniora"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Wiadomość początkowa (opcjonalnie)
                </label>
                <textarea
                  rows={3}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  placeholder="Opisz krótko swoje pytanie do ekspertów..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-stone-900 focus:outline-none text-sm text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewThread(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Rozpocznij dialog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Minimalist Messenger Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-4xl border border-black/6 shadow-sm overflow-hidden h-155">
        {/* Left Column: Contacts List */}
        <div className="md:col-span-4 border-r border-stone-100 bg-[#FAF9F5] flex flex-col">
          <div className="p-3 border-b border-stone-100 bg-white/50 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Aktywne dialogi ({contacts.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100/80">
            {contacts.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-stone-600">
                  Brak aktywnych dialogów
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Kliknij przycisk powyżej, aby napisać do eksperta.
                </p>
              </div>
            ) : (
              contacts.map((contact) => {
                const isSelected = contact.id === activeContactId;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContactId(contact.id)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-stone-200/50" : "hover:bg-stone-100/60"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-stone-800 shrink-0 text-sm relative"
                      style={{ backgroundColor: contact.avatarBg || "#F5E85A" }}
                    >
                      {contact.name?.charAt(0) || "?"}
                      {contact.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {contact.name}
                        </p>
                        <span className="text-[10px] text-stone-400">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 truncate mt-0.5">
                        {contact.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-stone-200/60 flex items-center justify-center text-stone-400 mb-3 shadow-2xs">
                <MessageCircle className="w-7 h-7 text-stone-400 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">
                Brak aktywnego dialogu
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mb-5 leading-relaxed">
                Nie masz jeszcze otwartych rozmów. Rozpocznij bezpośredni dialog z ekspertami ROPS Kraków, aby omówić pomysł lub zadać pytanie.
              </p>
              <button
                onClick={() => setIsCreatingNewThread(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Napisz do eksperta</span>
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs text-stone-800"
                    style={{ backgroundColor: activeContact.avatarBg || "#F5E85A" }}
                  >
                    {activeContact.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 leading-tight">
                      {activeContact.name}
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      {activeContact.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Aktywny"
                  />
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    online
                  </span>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FCFBF8]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                    <MessageCircle className="w-8 h-8 mb-2 stroke-1 text-stone-300" />
                    <p className="text-sm font-medium text-stone-500">
                      Napisz do eksperta ({activeContact.name})
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      Odpowiedzi pojawią się automatycznie co 3 sekundy.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm font-medium leading-relaxed ${
                            isMe
                              ? "bg-stone-900 text-white rounded-br-xs"
                              : "bg-stone-100 text-stone-900 rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 px-1">
                          {m.timestamp}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              <div className="px-4 py-2 bg-stone-50/60 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() =>
                    handleSendMessage(
                      "Dzień dobry! Jak mogę zgłosić pomysł do inkubatora ROPS Kraków?",
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  Jak zgłosić pomysł do inkubatora?
                </button>
                <button
                  onClick={() =>
                    handleSendMessage(
                      "Jakie formy dofinansowania są obecnie dostępne dla seniorów?",
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  Dostępne formy dofinansowania
                </button>
                <button
                  onClick={() =>
                    handleSendMessage(
                      "Chętnie wezmę udział w testowaniu prototypu.",
                    )
                  }
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors cursor-pointer"
                >
                  Chętnie przetestuję prototyp
                </button>
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-white border-t border-stone-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Wpisz treść wiadomości do eksperta..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 focus:border-stone-800 focus:outline-none text-sm text-stone-900"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-stone-400">Ładowanie czatu...</div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
