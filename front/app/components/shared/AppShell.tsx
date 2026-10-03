"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { useApp } from "../../context/AppContext";
import { Loader2 } from "lucide-react";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    currentUser,
    setCurrentUser,
    isLoadingUser,
    isLargeFont,
    toggleFontSize,
    ideas,
    navigate,
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/auth" || pathname?.startsWith("/auth");

  useEffect(() => {
    if (!isLoadingUser) {
      if (!currentUser && !isAuthPage) {
        // Niezalogowany użytkownik próbuje wejść na chronioną stronę -> przekieruj do /auth
        const redirectParam =
          pathname && pathname !== "/"
            ? `?redirect=${encodeURIComponent(pathname)}`
            : "";
        router.replace(`/auth${redirectParam}`);
      } else if (currentUser && isAuthPage) {
        // Zalogowany użytkownik wszedł na /auth -> przekieruj na stronę główną
        router.replace("/");
      }
    }
  }, [currentUser, isLoadingUser, isAuthPage, pathname, router]);

  // Jeśli użytkownik jest na stronie /auth
  if (isAuthPage) {
    if (currentUser) {
      return null;
    }
    return (
      <main className="min-h-screen flex flex-col bg-[#F4F4F0]">
        {children}
      </main>
    );
  }

  // Podczas sprawdzania sesji użytkownika
  if (isLoadingUser) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#F7F6F1] gap-3 text-stone-600">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Weryfikacja autoryzacji...
        </p>
      </main>
    );
  }

  // Jeśli użytkownik nie jest zalogowany (i nie jest na /auth) – nic nie renderujemy, przekierowanie w toku
  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    setCurrentUser(null);
    router.replace("/auth");
  };

  // Użytkownik jest zalogowany – pełny dostęp do aplikacji
  return (
    <>
      <Navbar
        currentUser={currentUser}
        isLargeFont={isLargeFont}
        onToggleFontSize={toggleFontSize}
        ideasCount={ideas.length}
        onNavigate={navigate}
      />
      <main className="flex-1 pb-20 md:pb-8">{children}</main>
    </>
  );
};
