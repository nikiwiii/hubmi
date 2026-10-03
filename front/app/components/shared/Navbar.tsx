"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ScreenId, User } from "../../lib/types";
import {
  Compass,
  PlusCircle,
  MessageCircle,
  User as UserIcon,
  LogIn,
  Type,
  BookOpen,
  Search,
  Handshake,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface NavbarProps {
  currentScreen?: ScreenId;
  onNavigate?: (screen: ScreenId) => void;
  currentUser: User | null;
  isLargeFont: boolean;
  onToggleFontSize: () => void;
  unreadCount?: number;
  ideasCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  isLargeFont,
  onToggleFontSize,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = currentUser?.role === "admin";

  // Derive active screen from route pathname if not explicitly passed
  const detectedScreen: ScreenId = (() => {
    if (!pathname) return currentScreen || "discover";
    if (pathname.startsWith("/matching")) return "matching";
    if (pathname.startsWith("/middleman")) return "middleman";
    if (pathname.startsWith("/knowledge")) return "knowledge";
    if (pathname.startsWith("/testing")) return "admin";
    if (pathname.startsWith("/propose")) return "propose";
    if (pathname.startsWith("/chat")) return "chat";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/auth")) return "auth";
    return "discover";
  })();

  const activeScreen = currentScreen || detectedScreen;

  const navigateTo = (screen: ScreenId) => {
    if (onNavigate) {
      onNavigate(screen);
    }
    const path = screen === "discover" ? "/" : `/${screen}`;
    router.push(path);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="print:hidden sticky top-0 z-40 bg-[#F7F6F1]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => navigateTo("discover")}
            aria-label="MiNNO - Przejdź do strony głównej"
            className="flex items-center gap-2.5 cursor-pointer select-none group text-left border-none bg-transparent p-1 -ml-1 rounded-xl focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <div className="w-8.5 h-8.5 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img
                src="/logo.svg"
                alt="Logo platformy MiNNO Małopolskie Innowacje"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-2xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 bg-clip-text text-transparent tracking-tight font-ubuntu"
              style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
            >
              MiNNO
            </span>
          </button>

          {/* Desktop Navigation Links (Clean & Minimal) */}
          <nav
            aria-label="Główne menu nawigacji"
            className="hidden md:flex items-center gap-1 bg-stone-200/50 p-1 rounded-2xl"
          >
            <button
              type="button"
              onClick={() => navigateTo("discover")}
              aria-current={activeScreen === "discover" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "discover"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Odkrywaj
            </button>
            <button
              type="button"
              onClick={() => navigateTo("matching")}
              aria-current={activeScreen === "matching" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "matching"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Asystent
            </button>
            <button
              type="button"
              onClick={() => navigateTo("middleman")}
              aria-current={activeScreen === "middleman" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "middleman"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Innowacje
            </button>
            <button
              type="button"
              onClick={() => navigateTo("knowledge")}
              aria-current={activeScreen === "knowledge" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "knowledge"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Raporty
            </button>
            <button
              type="button"
              onClick={() => navigateTo("propose")}
              aria-current={activeScreen === "propose" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "propose"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Zaproponuj
            </button>
            <button
              type="button"
              onClick={() => navigateTo("chat")}
              aria-current={activeScreen === "chat" ? "page" : undefined}
              className={`min-h-[34px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeScreen === "chat"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-900 hover:bg-white/40"
              }`}
            >
              Czat
            </button>
          </nav>

          {/* Right Controls: Notifications, Font Size Accessibility, User Profile */}
          <div className="flex items-center gap-2">
            <NotificationBell currentUser={currentUser} />

            <button
              type="button"
              onClick={onToggleFontSize}
              aria-label={
                isLargeFont
                  ? "Zmień na czcionkę standardową (aktualnie powiększona)"
                  : "Powiększ czcionkę w aplikacji (tryb dostępności A+)"
              }
              aria-pressed={isLargeFont}
              title={
                isLargeFont
                  ? "Zmień na czcionkę standardową"
                  : "Powiększ czcionkę (A+)"
              }
              className={`min-h-[36px] min-w-[36px] flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLargeFont
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50"
              }`}
            >
              <Type className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-bold">{isLargeFont ? "A+" : "A"}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateTo("dashboard")}
                  aria-label={`Mój profil i konto: ${currentUser.name || currentUser.email}`}
                  title="Przejdź do profilu użytkownika"
                  className="min-h-[36px] flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 cursor-pointer transition-colors shadow-2xs text-left"
                >
                  <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 truncate max-w-28">
                    {currentUser.name || currentUser.email || "Konto"}
                  </span>
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-stone-800"
                    style={{
                      backgroundColor: currentUser.avatarBg || "#A4B3F6",
                    }}
                  >
                    {(currentUser.name || currentUser.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo("auth")}
                aria-label="Zaloguj się do platformy"
                className="min-h-[36px] min-w-[70px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Zaloguj</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Nawigacja mobilna"
        className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6F1]/95 backdrop-blur-md border-t border-stone-200 py-1 px-2"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            type="button"
            onClick={() => navigateTo("discover")}
            aria-label="Odkrywaj innowacje"
            aria-current={activeScreen === "discover" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "discover"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Compass className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Odkrywaj</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("matching")}
            aria-label="Asystent dopasowania"
            aria-current={activeScreen === "matching" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "matching"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Asystent</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("middleman")}
            aria-label="Innowacje i usługi"
            aria-current={activeScreen === "middleman" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "middleman"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Handshake className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Innowacje</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("knowledge")}
            aria-label="Baza wiedzy i raporty"
            aria-current={activeScreen === "knowledge" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "knowledge"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Raporty</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("propose")}
            aria-label="Zaproponuj nowy pomysł"
            aria-current={activeScreen === "propose" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "propose"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <PlusCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Zaproponuj</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("chat")}
            aria-label="Czat z innowatorami"
            aria-current={activeScreen === "chat" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "chat"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">Czat</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo(currentUser ? "dashboard" : "auth")}
            aria-label={currentUser ? "Mój profil i konto" : "Zaloguj się"}
            aria-current={activeScreen === "dashboard" || activeScreen === "auth" ? "page" : undefined}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 transition-all cursor-pointer ${
              activeScreen === "dashboard" || activeScreen === "auth"
                ? "text-stone-900 font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <UserIcon className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px]">
              {currentUser ? "Konto" : "Zaloguj"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
