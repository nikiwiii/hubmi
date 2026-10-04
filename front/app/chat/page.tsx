"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChatMessage,
  ChatContact,
  BackendConversation,
} from "../lib/types";
import {
  INITIAL_CONTACTS,
  getChatMessages,
  sendChatMessage,
} from "../lib/chatStore";
import {
  fetchConversations,
  fetchConversationDetails,
  pollConversationMessages,
  sendConversationMessage,
  startExpertConversation,
  updateConversationStatus,
  deleteConversation,
} from "../lib/api";
import {
  Send,
  MessageCircle,
  Plus,
  Shield,
  RefreshCw,
  Lock,
  Search,
  Tag,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";

function formatChatTime(dateStr?: string) {
  if (!dateStr) return "Teraz";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  } catch {
    return dateStr;
  }
}

function ChatContent() {
  const { currentUser, isLoadingUser } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientFromUrl = searchParams?.get("recipient");
  const topicFromUrl = searchParams?.get("topic");

  // ── HOOKS & STATE ──────────────────────────────────────────────────────────
  const [backendConversations, setBackendConversations] = useState<
    BackendConversation[]
  >([]);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>(
    recipientFromUrl || "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );
  const [isCreatingNewThread, setIsCreatingNewThread] = useState(
    Boolean(topicFromUrl),
  );
  const [newTopic, setNewTopic] = useState(topicFromUrl || "");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = currentUser?.id || "";
  const currentUserName = currentUser?.name || "";
  const isExpertOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "expert";

  // Auth guard — redirect to /auth when not logged in
  useEffect(() => {
    if (!isLoadingUser && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, isLoadingUser, router]);

  // Sync activeContactId and newTopic from URL params
  useEffect(() => {
    if (recipientFromUrl) {
      setActiveContactId(recipientFromUrl);
    }
    if (topicFromUrl) {
      setNewTopic(topicFromUrl);
      setIsCreatingNewThread(true);
    }
  }, [recipientFromUrl, topicFromUrl]);

  // 1. Load backend conversations on mount
  useEffect(() => {
    if (!currentUser) return;
    const loadConversations = async () => {
      try {
        const convs = await fetchConversations();
        let allConvs = convs || [];

        // Jeśli w URL jest recipient, a nie ma go na liście, dociągnij bezpośrednio
        if (
          recipientFromUrl &&
          !allConvs.some((c) => c.id === recipientFromUrl)
        ) {
          try {
            const direct = await fetchConversationDetails(recipientFromUrl);
            if (direct) {
              allConvs = [direct, ...allConvs];
            }
          } catch (e) {
            console.warn("Nie udało się pobrać konwersacji z parametru URL:", e);
          }
        }

        // Deduplikacja wg unikalnego ID
        const uniqueMap = new Map<string, BackendConversation>();
        allConvs.forEach((c) => uniqueMap.set(c.id, c));
        const uniqueConvs = Array.from(uniqueMap.values());

        if (uniqueConvs.length > 0) {
          setBackendConversations(uniqueConvs);
          const mappedContacts: ChatContact[] = uniqueConvs.map((c) => {
            const displayName = isExpertOrAdmin
              ? c.user_name || "Mieszkaniec"
              : c.assigned_admin_name || "Ekspert ROPS Kraków";
            const topicLabel =
              c.topic ||
              (c.idea_title
                ? `Projekt: ${c.idea_title}`
                : "Konsultacje innowacji");

            return {
              id: c.id,
              name: displayName,
              userName: c.user_name || "Mieszkaniec",
              topic: topicLabel,
              status: c.status,
              ideaTitle: c.idea_title,
              role: topicLabel,
              avatarBg: isExpertOrAdmin ? "#E0E7FF" : "#F5E85A",
              lastMessage: c.last_message || "Rozpoczęto rozmowę",
              lastMessageTime: formatChatTime(c.last_message_at),
              unreadCount: isExpertOrAdmin
                ? c.unread_by_admin
                : c.unread_by_user,
              isOnline: true,
            };
          });
          setContacts(mappedContacts);

          setActiveContactId((prev) => {
            if (prev && uniqueConvs.some((c) => c.id === prev)) return prev;
            return mappedContacts[0].id;
          });
        } else {
          setBackendConversations([]);
          setContacts([]);
        }
      } catch (err) {
        console.warn("Backend chat note (using local demo threads):", err);
      }
    };
    loadConversations();
  }, [currentUser, isExpertOrAdmin, recipientFromUrl]);

  // 2. POLLING: Pobieranie wiadomości z aktywnego wątku co 3 sekundy
  useEffect(() => {
    if (!currentUser || !activeContactId) return;

    const loadMessagesInitially = async () => {
      const isBackendConv = backendConversations.some(
        (c) => c.id === activeContactId,
      );
      if (isBackendConv) {
        try {
          const pollRes = await pollConversationMessages(activeContactId);
          if (pollRes.messages) {
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
        } catch (e) {
          console.warn("Błąd ładowania wiadomości:", e);
        }
      } else {
        const allMsgs = getChatMessages();
        const conversation = allMsgs.filter(
          (m) =>
            (m.senderId === currentUserId &&
              m.receiverId === activeContactId) ||
            (m.senderId === activeContactId && m.receiverId === currentUserId),
        );
        setMessages(conversation);
      }
    };

    loadMessagesInitially();

    const pollInterval = setInterval(loadMessagesInitially, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [activeContactId, backendConversations, currentUserId, currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── EARLY RETURNS ──────────────────────────────────────────────────────────
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [
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
          ];
        });

        // Zaktualizuj preview na liście kontaktów
        setContacts((prev) =>
          prev.map((c) =>
            c.id === activeContactId
              ? {
                  ...c,
                  lastMessage: text.trim(),
                  lastMessageTime: "Teraz",
                }
              : c,
          ),
        );
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

      const displayName = isExpertOrAdmin
        ? created.user_name || "Mieszkaniec"
        : created.assigned_admin_name || "Ekspert ROPS Kraków";
      const topicLabel =
        created.topic ||
        (created.idea_title
          ? `Projekt: ${created.idea_title}`
          : "Konsultacje innowacji");

      const newContact: ChatContact = {
        id: created.id,
        name: displayName,
        userName: created.user_name || "Mieszkaniec",
        topic: topicLabel,
        status: created.status,
        ideaTitle: created.idea_title,
        role: topicLabel,
        avatarBg: isExpertOrAdmin ? "#E0E7FF" : "#F5E85A",
        lastMessage: created.last_message || "Otwarto nowy wątek",
        lastMessageTime: "Teraz",
        isOnline: true,
      };

      setBackendConversations((prev) => [
        created,
        ...prev.filter((c) => c.id !== created.id),
      ]);
      setContacts((prev) => [
        newContact,
        ...prev.filter((c) => c.id !== created.id),
      ]);
      setActiveContactId(created.id);
      setIsCreatingNewThread(false);
      setNewTopic("");
      setNewInitialMsg("");
    } catch (err: any) {
      alert(err?.message || "Nie udało się utworzyć wątku.");
    }
  };

  const handleToggleStatus = async (convId: string, currentStatus?: string) => {
    const newStatus = currentStatus === "closed" ? "open" : "closed";
    try {
      const updated = await updateConversationStatus(convId, newStatus);
      setBackendConversations((prev) =>
        prev.map((c) => (c.id === convId ? updated : c)),
      );
      setContacts((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, status: updated.status } : c,
        ),
      );
    } catch (err: any) {
      alert(err?.message || "Nie udało się zmienić statusu.");
    }
  };

  const handleDeleteConversation = async (
    convId: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę rozmowę wraz ze wszystkimi wiadomościami?",
      )
    ) {
      return;
    }
    try {
      await deleteConversation(convId);
      setBackendConversations((prev) => prev.filter((c) => c.id !== convId));
      setContacts((prev) => {
        const next = prev.filter((c) => c.id !== convId);
        if (activeContactId === convId) {
          setActiveContactId(next[0]?.id || "");
        }
        return next;
      });
    } catch (err: any) {
      alert(err?.message || "Nie udało się usunąć rozmowy.");
    }
  };

  // Filtrowanie listy kontaktów / wątków
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      contact.name.toLowerCase().includes(query) ||
      (contact.topic && contact.topic.toLowerCase().includes(query)) ||
      (contact.lastMessage &&
        contact.lastMessage.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "open" && contact.status !== "closed") ||
      (statusFilter === "closed" && contact.status === "closed");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
      {/* Top Banner (Przycisk wyboru mentorów został usunięty na życzenie) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFE5C6] flex items-center justify-center text-stone-900 font-bold shrink-0">
            <Shield className="w-5 h-5 text-stone-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">
                Platforma Komunikacji i Mentoringu (ROPS Kraków)
              </h2>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Bezpośredni dialog mieszkańców, ekspertów regionalnych i mentorów
              innowacji społecznych.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingNewThread(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowa wiadomość</span>
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

      {/* Main Messenger Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden min-h-[580px] h-[calc(100vh-230px)] max-h-[780px]">
        {/* Left Column: Contacts List */}
        <div className="md:col-span-4 border-r border-stone-200/80 bg-[#FAF9F5] flex flex-col min-w-0">
          {/* Header & Search */}
          <div className="p-3 border-b border-stone-200/80 bg-white/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">
                Wątki dialogu ({filteredContacts.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj osoby lub tematu..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-100/80 border border-stone-200/70 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-400 transition-all"
              />
            </div>
            {/* Filter chips */}
            <div className="flex items-center gap-1 pt-0.5">
              {(["all", "open", "closed"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-200/60"
                  }`}
                >
                  {filter === "all"
                    ? "Wszystkie"
                    : filter === "open"
                      ? "Otwarte"
                      : "Zakończone"}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-200/60">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-stone-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-stone-600">
                  Brak pasujących rozmów
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {searchQuery
                    ? "Zmień kryteria wyszukiwania."
                    : "Kliknij 'Nowa wiadomość', aby rozpocząć dialog."}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = contact.id === activeContactId;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveContactId(contact.id)}
                    className={`w-full p-3 flex items-start gap-3 text-left transition-all cursor-pointer relative group ${
                      isSelected
                        ? "bg-white border-l-4 border-stone-900 shadow-2xs"
                        : "hover:bg-white/60"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-stone-800 shrink-0 text-xs relative shadow-2xs mt-0.5"
                      style={{ backgroundColor: contact.avatarBg || "#F5E85A" }}
                    >
                      {contact.name?.charAt(0) || "?"}
                      {contact.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {contact.name}
                        </p>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {contact.lastMessageTime}
                        </span>
                      </div>

                      {/* Temat jako czytelny badge */}
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-700 bg-stone-200/70 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                          <Tag className="w-2.5 h-2.5 text-stone-500 shrink-0" />
                          <span className="truncate">
                            {contact.topic || "Konsultacja"}
                          </span>
                        </span>
                        {contact.status === "closed" && (
                          <span className="text-[9px] font-semibold text-stone-400 bg-stone-100 px-1 py-0.5 rounded shrink-0">
                            Zamknięte
                          </span>
                        )}
                      </div>

                      {/* Ostatnia wiadomość */}
                      <p className="text-xs text-stone-500 truncate mt-1 leading-snug">
                        {contact.lastMessage}
                      </p>
                    </div>

                    {Boolean(contact.unreadCount && contact.unreadCount > 0) && (
                      <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="md:col-span-8 flex flex-col h-full bg-white min-w-0">
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-stone-200/60 flex items-center justify-center text-stone-400 mb-3 shadow-2xs">
                <MessageCircle className="w-7 h-7 text-stone-400 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-1">
                Brak aktywnego dialogu
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mb-5 leading-relaxed">
                Wybierz wątek z listy po lewej stronie lub rozpocznij nowe
                zapytanie do ekspertów ROPS Kraków.
              </p>
              <button
                onClick={() => setIsCreatingNewThread(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Napisz wiadomość</span>
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-stone-200/80 bg-stone-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-stone-800 text-sm shadow-2xs shrink-0"
                    style={{
                      backgroundColor: activeContact.avatarBg || "#F5E85A",
                    }}
                  >
                    {activeContact.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-900 leading-tight">
                        {activeContact.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          activeContact.status === "closed"
                            ? "bg-stone-200 text-stone-600"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeContact.status === "closed"
                              ? "bg-stone-400"
                              : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        {activeContact.status === "closed"
                          ? "Zamknięta"
                          : "Aktywny dialog"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Tag className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="text-xs text-stone-600 font-medium truncate max-w-sm sm:max-w-md">
                        {activeContact.topic || "Konsultacja innowacji społecznych"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleStatus(activeContact.id, activeContact.status)
                    }
                    title={
                      activeContact.status === "closed"
                        ? "Wznów wątek"
                        : "Zakończ wątek"
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      {activeContact.status === "closed"
                        ? "Wznów wątek"
                        : "Zakończ wątek"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(activeContact.id, e)}
                    title="Usuń tę rozmowę"
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FCFBF8]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                    <MessageCircle className="w-8 h-8 mb-2 stroke-1 text-stone-300" />
                    <p className="text-sm font-medium text-stone-500">
                      Napisz do rozmówcy ({activeContact.name})
                    </p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs">
                      Rozmowa jest synchronizowana na żywo. Odpowiedzi pojawią
                      się tutaj automatycznie.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-stone-500">
                            {isMe ? "Ty" : m.senderName}
                          </span>
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs ${
                            isMe
                              ? "bg-stone-900 text-white rounded-tr-xs"
                              : "bg-white border border-stone-200/90 text-stone-900 rounded-tl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <div
                            className={`flex items-center gap-1 text-[10px] mt-1.5 ${
                              isMe
                                ? "text-stone-300 justify-end"
                                : "text-stone-400"
                            }`}
                          >
                            <span>{m.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-stone-200/80 bg-white">
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
                    placeholder="Wpisz wiadomość... (Enter, aby wysłać)"
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl transition-colors cursor-pointer shrink-0"
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
        <div className="flex items-center justify-center h-96 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm font-medium">Ładowanie komunikatora...</span>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
