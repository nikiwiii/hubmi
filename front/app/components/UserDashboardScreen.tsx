import React from 'react';
import { User, Idea, ScreenId } from '../lib/types';
import {
  Lightbulb,
  Users,
  ThumbsUp,
  MessageSquare,
  Plus,
  Type
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
    bio: 'Twórczyni projektów.'
  };

  const myCreatedIdeas = ideas.filter(
    i => i.authorEmail.toLowerCase() === user.email.toLowerCase() || i.authorId === user.id
  );

  const myTestingIdeas = ideas.filter(
    i => i.testersList.includes(user.email)
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-black/[0.05] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-stone-800 shrink-0"
            style={{ backgroundColor: user.avatarBg }}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900 leading-tight">
                {user.name}
              </span>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('propose')}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy pomysł</span>
          </button>
        </div>
      </div>

      {/* Accessibility Font Toggle Bar */}
      <div className="bg-stone-50 rounded-2xl px-5 py-3 border border-stone-200/60 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-700">Wielkość czcionki w aplikacji:</span>
        <button
          onClick={onToggleFontSize}
          className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 hover:bg-stone-100"
        >
          {isLargeFont ? 'Powiększona (A+)' : 'Standardowa (A)'}
        </button>
      </div>

      {/* SECTION 1: MY CREATED IDEAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-stone-600" />
            <span>Moje Pomysły ({myCreatedIdeas.length})</span>
          </h2>
          <button
            onClick={() => onNavigate('propose')}
            className="text-xs font-semibold text-stone-500 hover:text-stone-900"
          >
            Dodaj kolejny
          </button>
        </div>

        {myCreatedIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center text-xs text-stone-500">
            Brak zgłoszonych pomysłów.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myCreatedIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => onSelectIdea(idea)}
                className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-stone-300 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {idea.category}
                  </span>
                  <span className="text-xs text-stone-400">
                    {idea.createdAt}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {idea.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {idea.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {idea.testersCount} testerów
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: MY TESTING PARTICIPATIONS */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-stone-600" />
          <span>Moje Testy ({myTestingIdeas.length})</span>
        </h2>

        {myTestingIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center text-xs text-stone-500">
            Nie bierzesz udziału w żadnych testach.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myTestingIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Tester
                  </span>
                  <span className="text-xs text-stone-400">{idea.authorName}</span>
                </div>

                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {idea.title}
                </h3>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <button
                    onClick={() => onOpenChatWithAuthor(idea.authorId)}
                    className="flex items-center gap-1 text-xs text-stone-700 hover:text-stone-900 font-medium cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Czat</span>
                  </button>

                  <button
                    onClick={() => onSelectIdea(idea)}
                    className="text-xs font-semibold text-stone-900 underline"
                  >
                    Karta
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
