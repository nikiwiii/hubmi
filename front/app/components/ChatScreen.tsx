import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatContact } from '../lib/types';
import {
  INITIAL_CONTACTS,
  getChatMessages,
  sendChatMessage
} from '../lib/chatStore';
import {
  Send,
  Radio,
  Clock,
  User as UserIcon,
  Circle,
  MessageCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface ChatScreenProps {
  currentUser: User | null;
  initialRecipientId?: string | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  initialRecipientId
}) => {
  const currentUserId = currentUser?.id || 'user-anna-2';
  const currentUserName = currentUser?.name || 'Anna Kowalska';

  const [contacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>(
    initialRecipientId || INITIAL_CONTACTS[0].id
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Polling states
  const [pollTick, setPollTick] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Strictly implement 1-second polling mechanism (1000ms)
  useEffect(() => {
    // Initial fetch
    const fetchLatest = () => {
      const allMsgs = getChatMessages();
      // Filter messages between current user and active contact
      const conversation = allMsgs.filter(
        m =>
          (m.senderId === currentUserId && m.receiverId === activeContactId) ||
          (m.senderId === activeContactId && m.receiverId === currentUserId)
      );
      setMessages(conversation);

      const d = new Date();
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      setLastPollTime(timeStr);
      setPollTick(prev => prev + 1);
    };

    fetchLatest();

    // 1-second interval polling
    const intervalId = setInterval(() => {
      fetchLatest();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentUserId, activeContactId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    sendChatMessage(currentUserId, currentUserName, activeContactId, text.trim());
    setInputText('');
    
    // Immediate local refresh
    const all = getChatMessages();
    const conversation = all.filter(
      m =>
        (m.senderId === currentUserId && m.receiverId === activeContactId) ||
        (m.senderId === activeContactId && m.receiverId === currentUserId)
    );
    setMessages(conversation);
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-4">
      {/* Top Banner explaining the 1s polling mechanism */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span>Czat Społeczności Hubmi</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Polling (co 1s)
              </span>
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Wiadomości są automatycznie synchronizowane co sekundę.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>Ostatnie odpytanie: <strong>{lastPollTime || '--:--:--'}</strong></span>
          <span className="text-stone-300">|</span>
          <span className="text-emerald-600 font-bold">Cykl #{pollTick}</span>
        </div>
      </div>

      {/* Main Chat Interface: Contacts Sidebar + Active Thread */}
      <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-[36px] border border-stone-200 shadow-xl overflow-hidden min-h-[580px]">
        {/* Left Column: Contacts List */}
        <div className="md:col-span-4 border-r border-stone-200 bg-stone-50/50 flex flex-col">
          <div className="p-4 border-b border-stone-200 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Rozmówcy ({contacts.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {contacts.map((contact) => {
              const isSelected = contact.id === activeContactId;
              return (
                <button
                  key={contact.id}
                  onClick={() => setActiveContactId(contact.id)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-stone-200/60 font-bold'
                      : 'hover:bg-stone-100'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-stone-900 shrink-0 relative"
                    style={{ backgroundColor: contact.avatarBg }}
                  >
                    {contact.name.charAt(0)}
                    {contact.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {contact.name}
                      </p>
                      <span className="text-[11px] text-stone-400">
                        {contact.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                      {contact.role}
                    </p>
                    <p className="text-xs text-stone-600 truncate mt-1">
                      {contact.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Conversation Messages */}
        <div className="md:col-span-8 flex flex-col h-[600px] bg-white">
          {/* Active Contact Header */}
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-stone-900"
                style={{ backgroundColor: activeContact.avatarBg }}
              >
                {activeContact.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">{activeContact.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{activeContact.role}</span>
                </div>
              </div>
            </div>

            <span className="text-xs text-stone-400 font-medium">
              Szyfrowana komunikacja Hubmi
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stone-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <MessageCircle className="w-10 h-10 mb-2 stroke-1" />
                <p className="font-bold text-stone-700">Rozpocznij nową rozmowę z {activeContact.name}</p>
                <p className="text-xs mt-1">Wpisz wiadomość poniżej. Odpowiedź nadejdzie błyskawicznie.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] font-bold text-stone-400 mb-1 px-1">
                      {isMe ? 'Ty' : m.senderName} • {m.timestamp}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-3xl p-4 text-base font-medium shadow-sm leading-relaxed ${
                        isMe
                          ? 'bg-stone-900 text-white rounded-br-none'
                          : 'bg-white text-stone-900 rounded-bl-none border border-stone-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Response Chips (Optimized for 40+ usability) */}
          <div className="px-4 py-2 bg-stone-100/60 border-t border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
              Szybka treść:
            </span>
            <button
              onClick={() => handleSendMessage('Chętnie dołączę do testów prototypu!')}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-stone-200 border border-stone-300 text-xs font-semibold text-stone-800 whitespace-nowrap transition-colors"
            >
              👍 Chętnie dołączę do testów
            </button>
            <button
              onClick={() => handleSendMessage('Kiedy planujecie pierwsze spotkanie online?')}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-stone-200 border border-stone-300 text-xs font-semibold text-stone-800 whitespace-nowrap transition-colors"
            >
              📅 Kiedy spotkanie online?
            </button>
            <button
              onClick={() => handleSendMessage('Bardzo podoba mi się ten pomysł, gratulacje!')}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-stone-200 border border-stone-300 text-xs font-semibold text-stone-800 whitespace-nowrap transition-colors"
            >
              👏 Gratulacje, świetny pomysł!
            </button>
          </div>

          {/* Send Input Bar */}
          <div className="p-4 bg-white border-t border-stone-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Wpisz treść wiadomości..."
                className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-stone-200 focus:border-stone-900 focus:outline-none text-base text-stone-900 font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-2xl font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Wyślij</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
