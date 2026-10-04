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
  Sun,
  Moon,
  Eye,
  Sparkles,
  Volume2,
  VolumeX,
  Home,
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
    isDarkMode,
    toggleDarkMode,
    isHighContrast,
    toggleHighContrast,
    isSoundEnabled,
    toggleSound,
    openTutorial,
  } = useApp();

  // Derive active screen from route pathname if not explicitly passed
  const detectedScreen: ScreenId | "home" = (() => {
    if (!pathname || pathname === "/") return "home";
    if (pathname.startsWith("/discover")) return "discover";
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

  const navigateTo = (screen: ScreenId | "home") => {
    if (screen === "home") {
      router.push("/");
      return;
    }
    if (onNavigate) {
      onNavigate(screen);
    }
    router.push(`/${screen}`);
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
      <header className="print:hidden sticky top-0 z-40 bg-[#F7F6F1]/95 dark:bg-[#141518]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo - Navigates to Home screen */}
          <button
            type="button"
            onClick={() => router.push("/")}
            title="MiNNO – Strona główna platformy"
            aria-label="MiNNO – Strona główna platformy"
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
              className="text-2xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:via-stone-200 dark:to-stone-400 bg-clip-text text-transparent tracking-tight font-ubuntu"
              style={{ fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif" }}
            >
              MiNNO
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Główna nawigacja"
            className="hidden md:flex items-center gap-1 bg-stone-200/60 dark:bg-white/10 p-1 rounded-2xl"
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
                      ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-2xs font-bold"
                      : "text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Tutorial, Dark Mode, WCAG High Contrast, Sound, Font size, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Samouczek Button */}
            <button
              type="button"
              onClick={openTutorial}
              title="Uruchom interaktywny samouczek platformy z animacjami"
              aria-label="Uruchom samouczek"
              className="min-h-[32px] hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-white/10 bg-white dark:bg-[#1C1E23] text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/10 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>Samouczek</span>
            </button>

            {/* Tryb Ciemny Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? "Przełącz na tryb jasny" : "Włącz tryb ciemny"}
              aria-label={isDarkMode ? "Wyłącz tryb ciemny" : "Włącz tryb ciemny"}
              aria-pressed={isDarkMode}
              className={`min-w-[32px] min-h-[32px] p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode
                  ? "bg-stone-800 text-amber-400 border-stone-700 shadow-2xs"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50 shadow-2xs"
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" aria-hidden="true" />
              )}
            </button>

            {/* WCAG Tryb Wysokiego Kontrastu Toggle (Żółto-Czarny AAA) */}
            <button
              type="button"
              onClick={toggleHighContrast}
              title={
                isHighContrast
                  ? "Wyłącz tryb wysokiego kontrastu"
                  : "Włącz tryb wysokiego kontrastu (WCAG AAA - żółty na czarnym)"
              }
              aria-label={
                isHighContrast
                  ? "Wyłącz wysoki kontrast"
                  : "Włącz wysoki kontrast (WCAG AAA)"
              }
              aria-pressed={isHighContrast}
              className={`min-w-[32px] min-h-[32px] px-2 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isHighContrast
                  ? "bg-yellow-400 text-black border-yellow-400 shadow-md ring-2 ring-yellow-400"
                  : "bg-white text-stone-800 border-stone-300 hover:bg-stone-50 shadow-2xs"
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-[10px] font-black">AAA</span>
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
        className="print:hidden md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6F1]/95 dark:bg-[#141518]/95 backdrop-blur-md border-t border-stone-300 dark:border-white/10 py-1 px-1 transition-colors"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {[
            { id: "home" as const, label: "Start", icon: Home },
            { id: "discover" as ScreenId, label: "Odkrywaj", icon: Compass },
            { id: "matching" as ScreenId, label: "Asystent", icon: Search },
            { id: "knowledge" as ScreenId, label: "Raporty", icon: BookOpen },
            { id: "middleman" as ScreenId, label: "Innowacje", icon: Handshake },
            { id: "propose" as ScreenId, label: "Zaproponuj", icon: PlusCircle },
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
                className={`min-w-[40px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 dark:focus-visible:ring-white ${
                  isActive
                    ? "text-stone-950 dark:text-white font-bold"
                    : "text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white"
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
