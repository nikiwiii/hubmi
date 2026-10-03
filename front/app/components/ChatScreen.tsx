import React, { useState, useEffect, useRef } from "react";
import { User, ChatMessage, ChatContact } from "../lib/types";
import {
  INITIAL_CONTACTS,
  getChatMessages,
  sendChatMessage,
} from "../lib/chatStore";
import { Send, MessageCircle } from "lucide-react";

interface ChatScreenProps {
  currentUser: User | null;
  initialRecipientId?: string | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  initialRecipientId,
}) => {
  const currentUserId = currentUser?.id || "user-anna-2";
  const currentUserName = currentUser?.name || "Anna Kowalska";

  const [contacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>(
    initialRecipientId || INITIAL_CONTACTS[0].id,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1-second polling mechanism running silently
  useEffect(() => {
    const fetchLatest = () => {
      const allMsgs = getChatMessages();
      const conversation = allMsgs.filter(
        (m) =>
          (m.senderId === currentUserId && m.receiverId === activeContactId) ||
          (m.senderId === activeContactId && m.receiverId === currentUserId),
      );
      setMessages(conversation);
    };

    fetchLatest();

    const intervalId = setInterval(() => {
      fetchLatest();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentUserId, activeContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeContact =
    contacts.find((c) => c.id === activeContactId) || contacts[0];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    sendChatMessage(
      currentUserId,
      currentUserName,
      activeContactId,
      text.trim(),
    );
    setInputText("");

    const all = getChatMessages();
    const conversation = all.filter(
      (m) =>
        (m.senderId === currentUserId && m.receiverId === activeContactId) ||
        (m.senderId === activeContactId && m.receiverId === currentUserId),
    );
    setMessages(conversation);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Clean Minimalist Messenger Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-4xl border border-black/6 shadow-sm overflow-hidden h-155">
        {/* Left Column: Contacts List */}
        <div className="md:col-span-4 border-r border-stone-100 bg-[#FAF9F5] flex flex-col">
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100/80">
            {contacts.map((contact) => {
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
                    style={{ backgroundColor: contact.avatarBg }}
                  >
                    {contact.name.charAt(0)}
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
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {/* Minimal Header */}
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-xs text-stone-800"
                style={{ backgroundColor: activeContact.avatarBg }}
              >
                {activeContact.name.charAt(0)}
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

            <div
              className="w-2 h-2 rounded-full bg-emerald-500"
              title="Aktywny"
            />
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FCFBF8]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <MessageCircle className="w-8 h-8 mb-2 stroke-1 text-stone-300" />
                <p className="text-sm font-medium text-stone-500">
                  Napisz do {activeContact.name}
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

          {/* Quick suggestions (clean, no verbose labels) */}
          <div className="px-4 py-2 bg-stone-50/60 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() =>
                handleSendMessage("Chętnie wezmę udział w testach.")
              }
              className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors"
            >
              Chętnie wezmę udział w testach
            </button>
            <button
              onClick={() =>
                handleSendMessage("Kiedy planowane jest spotkanie?")
              }
              className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors"
            >
              Kiedy planowane jest spotkanie?
            </button>
            <button
              onClick={() => handleSendMessage("Świetny pomysł!")}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-700 whitespace-nowrap transition-colors"
            >
              Świetny pomysł!
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
                placeholder="Wiadomość..."
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
        </div>
      </div>
    </div>
  );
};
