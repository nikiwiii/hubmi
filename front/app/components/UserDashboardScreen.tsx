import React from 'react';
import { User, Idea, ScreenId } from '../lib/types';
import {
  Lightbulb,
  Users,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Settings,
  Shield,
  ExternalLink
} from 'lucide-react';

interface UserDashboardScreenProps {
  currentUser: User | null;
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
  onOpenChatWithAuthor: (authorId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  isLargeFont: boolean;
  onToggleFontSize: () => void;
}

export const UserDashboardScreen: React.FC<UserDashboardScreenProps> = ({
  currentUser,
  ideas,
  onSelectIdea,
  onOpenChatWithAuthor,
  onNavigate,
  isLargeFont,
  onToggleFontSize
}) => {
  const user = currentUser || {
    id: 'user-anna-2',
    name: 'Anna Kowalska',
    email: 'anna.kowalska@hubmi.pl',
    role: 'creator' as const,
    avatarBg: '#A4B3F6',
    createdAt: '2026-02-10',
    status: 'active' as const,
    bio: 'Entuzjastka ogrodnictwa i prostych rozwiązań technologicznych. 48 lat.'
  };

  // Ideas created by this user
  const myCreatedIdeas = ideas.filter(
    i => i.authorEmail.toLowerCase() === user.email.toLowerCase() || i.authorId === user.id
  );

  // Ideas where this user is signed up as a tester
  const myTestingIdeas = ideas.filter(
    i => i.testersList.includes(user.email)
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-[36px] p-6 sm:p-10 border border-stone-200 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black text-stone-900 shadow-sm shrink-0"
            style={{ backgroundColor: user.avatarBg }}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-stone-100 text-stone-800 text-xs font-bold rounded-full uppercase tracking-wider">
                Rola: {user.role.toUpperCase()}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                Członek od: {user.createdAt}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight mt-1">
              {user.name}
            </h1>
            <p className="text-stone-500 text-sm font-medium mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => onNavigate('propose')}
            className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#F5E85A]" />
            <span>Nowy Pomysł z AI</span>
          </button>

          {user.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-5 py-3.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border border-yellow-300 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Panel Zarządcy (CRUD)</span>
            </button>
          )}
        </div>
      </div>

      {/* 40+ Accessibility & Usability Preferences Card */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-stone-700" />
            <span>Ułatwienia Dostępności dla Osób 40+</span>
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Dostosuj wielkość liter na całej stronie do swoich preferencji wzrokowych.
          </p>
        </div>

        <button
          onClick={onToggleFontSize}
          className="px-5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-100 transition-colors flex items-center gap-2"
        >
          <span>Wielkość liter:</span>
          <span className="px-2 py-0.5 bg-stone-900 text-white rounded-md text-xs font-mono">
            {isLargeFont ? 'Powiększone (A+)' : 'Standardowe (A)'}
          </span>
        </button>
      </div>

      {/* SECTION 1: MY CREATED IDEAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-black text-stone-900">
              Moje Zgłoszone Pomysły ({myCreatedIdeas.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('propose')}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            <span>Dodaj kolejny</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myCreatedIdeas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
            <p className="text-stone-700 font-bold text-base">Nie zgłosiłeś jeszcze żadnego własnego pomysłu.</p>
            <p className="text-stone-500 text-sm">Opisz swoją myśl w kilku słowach, a nasz asystent AI pomoże Ci przygotować projekt!</p>
            <button
              onClick={() => onNavigate('propose')}
              className="mt-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#F5E85A]" />
              <span>Stwórz pierwszy pomysł</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCreatedIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => onSelectIdea(idea)}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800">
                    {idea.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {idea.status === 'testing' ? 'Faza testów' : 'Aktywny w społeczności'}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-stone-900 leading-tight">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {idea.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-bold text-stone-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {idea.likes} polubień
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Users className="w-3.5 h-3.5" />
                      {idea.testersCount} chętnych testerów
                    </span>
                  </div>

                  <span className="text-stone-900 underline flex items-center gap-1">
                    Szczegóły
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MY TESTING PARTICIPATIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-black text-stone-900">
              Projekty, w których biorę udział jako Tester ({myTestingIdeas.length})
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discover')}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            <span>Przeglądaj więcej</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myTestingIdeas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
            <p className="text-stone-700 font-bold text-base">Nie jesteś jeszcze zapisany na żadne testy.</p>
            <p className="text-stone-500 text-sm">Przejdź do zakładki &quot;Odkrywaj&quot; i zaznacz &quot;Chcę brać udział w testach&quot; przy projektach, które Cię interesują.</p>
            <button
              onClick={() => onNavigate('discover')}
              className="mt-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold"
            >
              Przeglądaj pomysły do testowania
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTestingIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    Jesteś Testerem
                  </span>
                  <span className="text-xs text-stone-400">Autor: {idea.authorName}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                    {idea.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <button
                    onClick={() => onOpenChatWithAuthor(idea.authorId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Czat z autorem</span>
                  </button>

                  <button
                    onClick={() => onSelectIdea(idea)}
                    className="text-xs font-bold text-stone-900 underline"
                  >
                    Karta projektu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
