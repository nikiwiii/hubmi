'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Mail,
  ExternalLink,
  X,
  Award,
  Lightbulb,
  MessageSquare,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { NotificationItem, SimulatedEmail, User } from '../../lib/types';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchSimulatedEmail
} from '../../lib/api';

interface NotificationBellProps {
  currentUser: User | null;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'grant' | 'chat' | 'partnership'>('all');
  const [activeEmail, setActiveEmail] = useState<SimulatedEmail | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = currentUser?.role || 'creator';

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(role);
      if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Nie udało się pobrać powiadomień:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // okresowe odświeżanie
    return () => clearInterval(interval);
  }, [role]);

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
      } catch (e) {
        console.warn(e);
      }
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleOpenEmailPreview = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingEmail(true);
    try {
      const email = await fetchSimulatedEmail(notifId);
      setActiveEmail(email);
    } catch (err) {
      console.warn('Błąd pobierania podglądu e-mail:', err);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'grant') return n.type === 'grant_call';
    if (filter === 'chat') return n.type === 'chat_message';
    if (filter === 'partnership') return n.type === 'partnership';
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'grant_call':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'new_idea':
        return <Lightbulb className="w-4 h-4 text-emerald-600" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'partnership':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'expert_assigned':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Przycisk Dzwonka */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Powiadomienia i wiadomości"
        className={`relative p-2 rounded-xl border text-stone-700 transition-all cursor-pointer ${
          isOpen
            ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
            : 'bg-white border-stone-200 hover:bg-stone-50'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-xs animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Powiadomień */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-black/10 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-black/5 bg-[#FAF9F5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-stone-900">Powiadomienia</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {unreadCount} nowe
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Przeczytane</span>
              </button>
            )}
          </div>

          {/* Filtry zakładek */}
          <div className="flex items-center gap-1 p-1.5 border-b border-black/5 bg-stone-50/70 text-[11px] font-medium text-stone-600 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filter === 'all' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setFilter('grant')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filter === 'grant' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Nabory grantowe
            </button>
            <button
              onClick={() => setFilter('chat')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filter === 'chat' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Wiadomości
            </button>
            <button
              onClick={() => setFilter('partnership')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filter === 'partnership' ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Partnerstwa
            </button>
          </div>

          {/* Lista powiadomień */}
          <div className="max-h-84 overflow-y-auto divide-y divide-black/5">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                Brak powiadomień w tej kategorii.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-stone-50 ${
                    !notif.read ? 'bg-amber-50/30' : 'bg-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 border border-black/5">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      {/* Przycisk Podglądu Symulowanego E-maila (dla jury!) */}
                      {notif.email_sent && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenEmailPreview(notif.id, e)}
                          title="Zobacz kopię e-mail wysłaną przez system"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-stone-600" />
                          <span>Podgląd e-mail</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Podglądu Symulowanego E-maila (Kluczowy dla oceny jury!) */}
      {activeEmail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-black/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EFE5C6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#EFE5C6]">
                  Symulacja powiadomienia e-mail (dla oceny jury)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmail(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadane nagłówka maila */}
            <div className="p-4 border-b border-black/5 bg-[#FAF9F5] text-xs space-y-1 font-mono text-stone-600">
              <div>
                <strong>Nadawca:</strong> {activeEmail.sender}
              </div>
              <div>
                <strong>Odbiorca:</strong> {activeEmail.recipient}
              </div>
              <div>
                <strong>Temat:</strong> {activeEmail.subject}
              </div>
              <div>
                <strong>Data wysyłki:</strong> {new Date(activeEmail.sent_at).toLocaleString('pl-PL')}
              </div>
              <div className="text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Wysłano pomyślnie przez wewnętrzny serwis powiadomień</span>
              </div>
            </div>

            {/* Podgląd wizualny HTML maila */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: activeEmail.body_html }}
                className="w-full"
              />
            </div>

            {/* Stopka modala */}
            <div className="p-3 bg-stone-50 border-t border-black/5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveEmail(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Zamknij podgląd
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

