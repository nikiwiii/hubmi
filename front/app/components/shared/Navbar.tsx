"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Volume2,
  VolumeX,
  Home,
  ChevronDown,
  Check,
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
  } = useApp();

  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const appearanceRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (appearanceRef.current && !appearanceRef.current.contains(e.target as Node)) {
        setIsAppearanceOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAppearanceOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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

  const fontShort =
    fontSizeLevel === "huge" ? "A++" : fontSizeLevel === "large" ? "A+" : "A";

  const hasActiveAppearance = isDarkMode || isHighContrast || fontSizeLevel !== "normal" || !isSoundEnabled;

  return (
    <>
      {/* Top Header Bar */}
      <header className="print:hidden sticky top-0 z-40 bg-[#F7F6F1]/95 dark:bg-[#141518]/95 backdrop-blur-md border-b border-black/10 dark:border-white/10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand Logo - Navigates to Home screen */}
          <button
            type="button"
            onClick={() => router.push("/")}
            title="MiNNO – Strona główna platformy"
            aria-label="MiNNO – Strona główna platformy"
            className="flex items-center gap-2.5 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-stone-900 rounded-xl p-1 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img
                src="/logo.svg"
                alt="Logo MiNNO – Małopolskie Innowacje Społeczne"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className="text-xl font-bold bg-gradient-to-r from-stone-900 via-stone-800 to-stone-600 dark:from-white dark:via-stone-200 dark:to-stone-400 bg-clip-text text-transparent tracking-tight"
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
                  className={`h-8 px-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 ${isActive
                      ? "bg-white dark:bg-stone-900 text-stone-950 dark:text-white shadow-2xs font-bold"
                      : "text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                    }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Appearance Settings Dropdown */}
            <div ref={appearanceRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAppearanceOpen((v) => !v)}
                title="Ustawienia wyglądu i dostępności"
                aria-label="Ustawienia wyglądu"
                aria-expanded={isAppearanceOpen}
                aria-haspopup="menu"
                className={`h-8 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-stone-900 ${hasActiveAppearance || isAppearanceOpen
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950 border-stone-900 dark:border-white shadow-sm"
                    : "bg-white dark:bg-[#1C1E23] text-stone-800 dark:text-stone-200 border-stone-300 dark:border-white/15 hover:bg-stone-50 dark:hover:bg-white/10 shadow-2xs"
                  }`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Wygląd</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${isAppearanceOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Panel */}
              {isAppearanceOpen && (
                <div
                  role="menu"
                  aria-label="Ustawienia wyglądu"
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1C1E23] border border-stone-200/80 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-2.5 border-b border-stone-100 dark:border-white/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Wygląd i dostępność
                    </span>
                  </div>

                  {/* Dark Mode */}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isDarkMode}
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDarkMode
                        ? <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
                        : <Moon className="w-4 h-4 text-stone-600 dark:text-stone-300" aria-hidden="true" />
                      }
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">Tryb ciemny</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">{isDarkMode ? "Aktywny" : "Wyłączony"}</div>
                      </div>
                    </div>
                    {isDarkMode && <Check className="w-4 h-4 text-stone-900 dark:text-white shrink-0" aria-hidden="true" />}
                  </button>

                  {/* High Contrast */}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isHighContrast}
                    onClick={toggleHighContrast}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 flex items-center justify-center rounded text-[9px] font-black shrink-0"
                        style={{ background: isHighContrast ? "#FACC15" : "#000", color: isHighContrast ? "#000" : "#FACC15", border: "1.5px solid #FACC15" }}
                        aria-hidden="true"
                      >
                        AA
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">Wysoki kontrast</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">WCAG AAA – żółty na czarnym</div>
                      </div>
                    </div>
                    {isHighContrast && <Check className="w-4 h-4 text-stone-900 dark:text-white shrink-0" aria-hidden="true" />}
                  </button>

                  {/* Font Size */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleFontSize}
                    title={`Zmień rozmiar tekstu (aktualnie: ${fontLabel}). Skalowanie do 200%`}
                    aria-label={`Skalowanie czcionki: aktualnie ${fontLabel}`}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Type className="w-4 h-4 text-stone-600 dark:text-stone-300 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">Rozmiar tekstu</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">Aktualnie: {fontLabel} – kliknij, aby zmienić</div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-black px-1.5 py-0.5 rounded-lg ${fontSizeLevel !== "normal"
                          ? "bg-stone-900 dark:bg-white text-white dark:text-stone-950"
                          : "bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300"
                        }`}
                    >
                      {fontShort}
                    </span>
                  </button>

                  {/* Sound */}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isSoundEnabled}
                    onClick={toggleSound}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left border-t border-stone-100 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      {isSoundEnabled
                        ? <Volume2 className="w-4 h-4 text-stone-600 dark:text-stone-300" aria-hidden="true" />
                        : <VolumeX className="w-4 h-4 text-stone-400" aria-hidden="true" />
                      }
                      <div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">Dźwięki UI</div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">{isSoundEnabled ? "Powiadomienia dźwiękowe włączone" : "Wyciszone"}</div>
                      </div>
                    </div>
                    {isSoundEnabled && <Check className="w-4 h-4 text-stone-900 dark:text-white shrink-0" aria-hidden="true" />}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationBell currentUser={currentUser} />

            {/* User Profile or Login */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => navigateTo("dashboard")}
                title="Przejdź do profilu użytkownika"
                aria-label={`Profil użytkownika ${currentUser.name || currentUser.email || "Konto"}`}
                className="h-8 flex items-center gap-2 pl-2.5 pr-1 rounded-xl bg-white dark:bg-[#1C1E23] border border-stone-300 dark:border-white/15 hover:border-stone-400 dark:hover:border-white/30 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 dark:text-stone-200 truncate max-w-28">
                  {currentUser.name || currentUser.email || "Konto"}
                </span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-stone-800 shrink-0"
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
                className="h-8 flex items-center gap-1.5 px-3 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl text-xs font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors cursor-pointer"
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
                className={`min-w-[40px] min-h-[44px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-stone-900 dark:focus-visible:ring-white ${isActive
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
