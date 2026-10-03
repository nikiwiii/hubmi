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
  Type,
  Smartphone,
  Monitor
} from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  currentUser: User | null;
  isLargeFont: boolean;
  onToggleFontSize: () => void;
  isPhoneFrameView: boolean;
  onTogglePhoneFrame: () => void;
  unreadCount?: number;
  ideasCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  isLargeFont,
  onToggleFontSize,
  isPhoneFrameView,
  onTogglePhoneFrame,
  unreadCount = 0,
  ideasCount
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#F4F4F0]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center text-white font-black text-xl shadow-md">
              H
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900 tracking-tight">Hubmi</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-bold text-stone-500 uppercase tracking-widest">
                Platforma Pomysłów 40+
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-stone-200/60 p-1.5 rounded-2xl">
            <button
              onClick={() => onNavigate('discover')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentScreen === 'discover'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Odkrywaj
            </button>
            <button
              onClick={() => onNavigate('propose')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentScreen === 'propose'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F5E85A]" />
              Zaproponuj z AI
            </button>
            <button
              onClick={() => onNavigate('browse')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentScreen === 'browse'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Ocena & Testy
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentScreen === 'chat'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Czat (co 1s)
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Mój Pulpit
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  currentScreen === 'admin'
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-yellow-200/80 text-yellow-900 hover:bg-yellow-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin (CRUD)
              </button>
            )}
          </nav>

          {/* Right Controls: Font Size Accessibility, Mockup View Toggle, User Profile */}
          <div className="flex items-center gap-2">
            {/* Font Size Toggle for 40+ audience */}
            <button
              onClick={onToggleFontSize}
              title={isLargeFont ? 'Zmień na czcionkę standardową' : 'Powiększ czcionkę (Ułatwienie 40+)'}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isLargeFont
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{isLargeFont ? 'A+ Duże' : 'A Normalne'}</span>
            </button>

            {/* Frame view toggle matching reference mockup */}
            <button
              onClick={onTogglePhoneFrame}
              title="Przełącz widok makiety telefonu (ze zdjęcia) / pełny ekran"
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {isPhoneFrameView ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-stone-600" />
                  <span>Pełny ekran</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-stone-600" />
                  <span>Kadr telefonu</span>
                </>
              )}
            </button>

            {/* User status avatar / Auth */}
            {currentUser ? (
              <div
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 cursor-pointer transition-colors shadow-sm"
              >
                <span className="hidden md:inline-block text-xs font-bold text-stone-800 truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-stone-900"
                  style={{ backgroundColor: currentUser.avatarBg }}
                >
                  {currentUser.name.charAt(0)}
                </div>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-stone-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Zaloguj</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile / Photo-styled Bottom Navigation Dock */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F4F4F0]/95 backdrop-blur-xl border-t border-stone-300 p-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => onNavigate('discover')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentScreen === 'discover'
                ? 'text-stone-950 font-black scale-105'
                : 'text-stone-400 font-semibold'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Odkrywaj</span>
          </button>

          <button
            onClick={() => onNavigate('propose')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentScreen === 'propose'
                ? 'text-stone-950 font-black scale-105'
                : 'text-stone-400 font-semibold'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] tracking-tight">Kreator AI</span>
          </button>

          <button
            onClick={() => onNavigate('browse')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentScreen === 'browse'
                ? 'text-stone-950 font-black scale-105'
                : 'text-stone-400 font-semibold'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">Ocena</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
              currentScreen === 'chat'
                ? 'text-stone-950 font-black scale-105'
                : 'text-stone-400 font-semibold'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-3" />
            <span className="text-[10px] tracking-tight">Czat</span>
          </button>

          <button
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'auth')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentScreen === 'dashboard' || currentScreen === 'auth'
                ? 'text-stone-950 font-black scale-105'
                : 'text-stone-400 font-semibold'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{currentUser ? 'Pulpit' : 'Konto'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
