import React from 'react';
import { ScreenId, User } from '../lib/types';
import {
  Compass,
  PlusCircle,
  Vote,
  MessageCircle,
  Shield,
  User as UserIcon,
  LogIn,
  Type
} from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  currentUser: User | null;
  isLargeFont: boolean;
  onToggleFontSize: () => void;
  unreadCount?: number;
  ideasCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  isLargeFont,
  onToggleFontSize
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#F7F6F1]/90 backdrop-blur-md border-b border-black/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold text-base">
              H
            </div>
            <span className="text-xl font-bold text-stone-900 tracking-tight">Hubmi</span>
          </div>

          {/* Desktop Navigation Links (Clean & Minimal) */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1 rounded-2xl">
            <button
              onClick={() => onNavigate('discover')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentScreen === 'discover'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Odkrywaj
            </button>
            <button
              onClick={() => onNavigate('propose')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentScreen === 'propose'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Zaproponuj
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentScreen === 'browse'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Przeglądaj
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentScreen === 'chat'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Czat
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pulpit
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  currentScreen === 'admin'
                    ? 'bg-stone-900 text-white'
                    : 'bg-[#EFE5C6] text-stone-800 hover:bg-[#E7DAC0]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </nav>

          {/* Right Controls: Font Size Accessibility, User Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFontSize}
              title={isLargeFont ? 'Zmień na czcionkę standardową' : 'Powiększ czcionkę (A+)'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLargeFont
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isLargeFont ? 'A+' : 'A'}</span>
            </button>

            {currentUser ? (
              <div
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 cursor-pointer transition-colors"
              >
                <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-stone-800"
                  style={{ backgroundColor: currentUser.avatarBg }}
                >
                  {currentUser.name.charAt(0)}
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Zaloguj</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Dock (clean & minimal) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6F1]/95 backdrop-blur-md border-t border-stone-200 py-1.5 px-3">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => onNavigate('discover')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer ${
              currentScreen === 'discover' ? 'text-stone-900 font-bold' : 'text-stone-400'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px]">Odkrywaj</span>
          </button>

          <button
            onClick={() => onNavigate('propose')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer ${
              currentScreen === 'propose' ? 'text-stone-900 font-bold' : 'text-stone-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px]">Zaproponuj</span>
          </button>

          <button
            onClick={() => onNavigate('browse')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer ${
              currentScreen === 'browse' ? 'text-stone-900 font-bold' : 'text-stone-400'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span className="text-[10px]">Przeglądaj</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer ${
              currentScreen === 'chat' ? 'text-stone-900 font-bold' : 'text-stone-400'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px]">Czat</span>
          </button>

          <button
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'auth')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-all cursor-pointer ${
              currentScreen === 'dashboard' || currentScreen === 'auth' ? 'text-stone-900 font-bold' : 'text-stone-400'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px]">{currentUser ? 'Pulpit' : 'Konto'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
