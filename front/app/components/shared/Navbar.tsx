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
  SunMoon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useApp } from "../../context/AppContext";

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
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    fontSizeLevel,
    toggleFontSize,
    isHighContrast,
    toggleHighContrast,
    isSoundEnabled,
    toggleSound,
  } = useApp();

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

  const fontLabel =
    fontSizeLevel === "huge"
      ? "200% (A++)"
      : fontSizeLevel === "large"
      ? "150% (A+)"
      : "100% (A)";

  return (
    <>
      {/* Top Header Bar */}
      <header className="print:hidden sticky top-0 z-40 bg-[#F7F6F1]/95 backdrop-blur-md border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo - Semantic button with accessible label */}
          <button
            type="button"
            onClick={() => navigateTo("discover")}
            aria-label="MiNNO – Strona główna"
            className="flex items-center gap-2.5 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-stone-900 rounded-xl p-1"
          >
            <div className="w-8.5 h-8.5 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img
                src="/logo.svg"
                alt="Logo MiNNO – Małopolskie Innowacje Społeczne"
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

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Główna nawigacja"
            className="hidden md:flex items-center gap-1 bg-stone-200/60 p-1 rounded-2xl"
          >
            {[
              { id: "discover" as ScreenId, label: "Odkrywaj" },
              { id: "matching" as ScreenId, label: "Asystent" },
              { id: "middleman" as ScreenId, label: "Innowacje" },
              { id: "knowledge" as ScreenId, label: "Raporty" },
              { id: "propose" as ScreenId, label: "Zaproponuj" },
              { id: "chat" as ScreenId, label: "Czat" },
            ].map((link) => {
              const isActive = activeScreen === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigateTo(link.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[32px] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 ${
                    isActive
                      ? "bg-white text-stone-950 shadow-2xs font-bold"
                      : "text-stone-700 hover:text-stone-950 hover:bg-white/50"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: WCAG Toolbar (Contrast, Font size, Sound), Notifications, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WCAG High Contrast Toggle */}
            <button
              type="button"
              onClick={toggleHighContrast}
              title={
                isHighContrast
                  ? "Wyłącz tryb wysokiego kontrastu"
                  : "Włącz tryb wysokiego kontrastu (WCAG AAA)"
              }
              aria-label={
                isHighContrast
                  ? "Wyłącz wysoki kontrast"
                  : "Włącz wysoki kontrast (WCAG AAA)"
              }
              aria-pressed={isHighContrast}
              className={`min-w-[32px] min-h-[32px] p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                isHighContrast
                  ? "bg-yellow-400 text-black border-yellow-400 font-bold"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50"
              }`}
            >
              <SunMoon className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* WCAG Audio Feedback Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={
                isSoundEnabled
                  ? "Dźwiękowe potwierdzenia formularzy: Włączone"
                  : "Dźwiękowe potwierdzenia formularzy: Wyciszone"
              }
              aria-label={
                isSoundEnabled
                  ? "Wycisz powiadomienia dźwiękowe formularzy"
                  : "Włącz powiadomienia dźwiękowe formularzy"
              }
              aria-pressed={isSoundEnabled}
              className={`min-w-[32px] min-h-[32px] p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                isSoundEnabled
                  ? "bg-white text-stone-800 border-stone-300 hover:bg-stone-50"
                  : "bg-stone-200 text-stone-500 border-stone-300"
              }`}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {/* Notification Bell */}
            <NotificationBell currentUser={currentUser} />

            {/* WCAG 1.4.4 Font Scaling Button (100% / 150% / 200%) */}
            <button
              type="button"
              onClick={toggleFontSize}
              title={`Zmień rozmiar tekstu (aktualnie: ${fontLabel}). Skalowanie do 200%`}
              aria-label={`Skalowanie czcionki: aktualnie ${fontLabel}`}
              className={`min-h-[32px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                fontSizeLevel !== "normal"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50"
              }`}
            >
              <Type className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {fontSizeLevel === "huge"
                  ? "A++"
                  : fontSizeLevel === "large"
                  ? "A+"
                  : "A"}
              </span>
            </button>

            {/* User Profile or Login */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => navigateTo("dashboard")}
                title="Przejdź do profilu użytkownika"
                aria-label={`Profil użytkownika ${currentUser.name || currentUser.email || "Konto"}`}
                className="min-h-[32px] flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-white border border-stone-300 hover:border-stone-400 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 truncate max-w-28">
                  {currentUser.name || currentUser.email || "Konto"}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-stone-800 shrink-0"
                  style={{
                    backgroundColor: currentUser.avatarBg || "#A4B3F6",
                  }}
                  aria-hidden="true"
                >
                  {(currentUser.name || currentUser.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo("auth")}
                className="min-h-[32px] flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Zaloguj</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (WCAG 2.2 compliant target size >= 44x44px and >= 4.5:1 contrast) */}
      <nav
        aria-label="Nawigacja mobilna"
        className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6F1]/95 backdrop-blur-md border-t border-stone-300 py-1 px-2"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { id: "discover" as ScreenId, label: "Odkrywaj", icon: Compass },
            { id: "matching" as ScreenId, label: "Asystent", icon: Search },
            { id: "middleman" as ScreenId, label: "Innowacje", icon: Handshake },
            { id: "knowledge" as ScreenId, label: "Raporty", icon: BookOpen },
            { id: "propose" as ScreenId, label: "Zaproponuj", icon: PlusCircle },
            { id: "chat" as ScreenId, label: "Czat", icon: MessageCircle },
            {
              id: (currentUser ? "dashboard" : "auth") as ScreenId,
              label: currentUser ? "Konto" : "Zaloguj",
              icon: UserIcon,
            },
          ].map((item) => {
            const isActive =
              activeScreen === item.id ||
              (item.id === "dashboard" && activeScreen === "auth");
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-[44px] min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 ${
                  isActive
                    ? "text-stone-950 font-bold"
                    : "text-stone-700 hover:text-stone-950"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-[10px] leading-tight font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
