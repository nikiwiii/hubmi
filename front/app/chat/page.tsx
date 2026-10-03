"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChatMessage,
  ChatContact,
  BackendConversation,
  RopsExpert,
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
  fetchExpertsDirectory,
} from "../lib/api";
import {
  Send,
  MessageCircle,
  Plus,
  Shield,
  RefreshCw,
  Lock,
  GraduationCap,
  Sparkles,
  X,
  Mail,
  Building2,
  CheckCircle2,
  ArrowRight,
  Wifi,
} from "lucide-react";
import { useApp } from "../context/AppContext";

function ChatContent() {
  const { currentUser, isLoadingUser } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientFromUrl = searchParams?.get("recipient");
  const topicFromUrl = searchParams?.get("topic");

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
  const [isCreatingNewThread, setIsCreatingNewThread] = useState(
    Boolean(topicFromUrl),
  );
  const [isExpertsModalOpen, setIsExpertsModalOpen] = useState(false);
  const [experts, setExperts] = useState<RopsExpert[]>([]);
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

  // Pobierz katalog ekspertów ROPS
  useEffect(() => {
    fetchExpertsDirectory()
      .then((data) => setExperts(data))
      .catch((err) => console.warn("Katalog ekspertów:", err));
  }, []);

  // 1. Load backend conversations on mount
  useEffect(() => {
    if (!currentUser) return;
    const loadConversations = async () => {
      try {
        const convs = await fetchConversations();
        let allConvs = convs || [];

        // Jeśli w URL jest recipient, a nie ma go na pobranej liście, dociągnij go bezpośrednio
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

        if (allConvs.length > 0) {
          setBackendConversations(allConvs);
          const mappedContacts: ChatContact[] = allConvs.map((c) => ({
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
          } else {
            setActiveContactId(recipientFromUrl);
          }
        }
      } catch (err) {
        console.warn("Backend chat note (using local demo threads):", err);
      }
    };
    loadConversations();
  }, [currentUser, isExpertOrAdmin, recipientFromUrl]);

  // 2. SUPABASE REALTIME: WebSocket na żywo zamiast odpytywania co 3s
  useEffect(() => {
    if (!currentUser || !activeContactId) return;

    // Załaduj stan początkowy wiadomości dla aktywnego kontaktu
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

    // Regularne odpytywanie backendu co 3 sekundy pobierające nowe wiadomości
    const pollInterval = setInterval(loadMessagesInitially, 3000);

    return () => {
      clearInterval(pollInterval);
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

  const handleStartConsultationWithExpert = async (expert: RopsExpert) => {
    try {
      const created = await startExpertConversation({
        topic: `Konsultacja: ${expert.name} (${expert.specialization.slice(0, 35)}...)`,
        initial_message: `Dzień dobry, chciałbym skonsultować założenia innowacji w obszarze: ${expert.specialization}.`,
      });

      const newContact: ChatContact = {
        id: created.id,
        name: `${expert.name} (${expert.title})`,
        role: expert.department,
        avatarBg: expert.avatar_bg || "#FAF4E5",
        lastMessage: created.last_message || "Rozpoczęto konsultację",
        lastMessageTime: "Teraz",
        isOnline: true,
      };

      setBackendConversations((prev) => [created, ...prev]);
      setContacts((prev) => [newContact, ...prev]);
      setActiveContactId(created.id);
      setIsExpertsModalOpen(false);
    } catch (err: any) {
      alert(err?.message || "Nie udało się otworzyć czatu z ekspertem.");
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
      {/* Top Banner */}
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Przycisk Katalogu Ekspertów ROPS */}
          <button
            type="button"
            onClick={() => setIsExpertsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-black/5"
          >
            <GraduationCap className="w-4 h-4 text-stone-700" />
            <span>Katalog Ekspertów ROPS</span>
          </button>

          <button
            onClick={() => setIsCreatingNewThread(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowa wiadomość</span>
          </button>
        </div>
      </div>

      {/* Modal Katalogu Ekspertów i Mentorów ROPS */}
      {isExpertsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-[#EFE5C6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Katalog Ekspertów i Mentorów ROPS Kraków
                  </h3>
                  <p className="text-xs text-stone-500">
                    Wybierz eksperta dziedzinowego do indywidualnej konsultacji
                    lub mentoringu projektu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpertsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {experts.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-2xl border border-black/6 bg-[#FAF9F5] hover:bg-white hover:border-black/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-stone-900">
                        {exp.name}
                      </h4>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Dostępny mentor
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-700">
                      {exp.title} •{" "}
                      <span className="text-stone-500">{exp.department}</span>
                    </p>
                    <p className="text-[11px] text-stone-600 pt-1">
                      <strong>Specjalizacja:</strong> {exp.specialization}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartConsultationWithExpert(exp)}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Napisz do eksperta</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={() => setIsExpertsModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Clean Messenger Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-2xl border border-black/6 shadow-sm overflow-hidden h-155">
        {/* Left Column: Contacts List */}
        <div className="md:col-span-4 border-r border-stone-100 bg-[#FAF9F5] flex flex-col">
          <div className="p-3 border-b border-stone-100 bg-white/50 text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Aktywne dialogi ({contacts.length})</span>
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
                Nie masz jeszcze otwartych rozmów. Rozpocznij bezpośredni dialog
                z ekspertami ROPS Kraków, aby omówić pomysł lub zadać pytanie.
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
              <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs text-stone-800"
                    style={{
                      backgroundColor: activeContact.avatarBg || "#F5E85A",
                    }}
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
                      Wiadomości synchronizowane są automatycznie przez API
                      backendu i bazę danych.
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
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <div
                            className={`flex items-center gap-1 text-[10px] font-mono mt-1 ${
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
              <div className="p-3 border-t border-stone-100 bg-white">
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
                    placeholder="Wpisz wiadomość..."
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200/80 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-xl transition-colors cursor-pointer"
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
