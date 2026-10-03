'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { useApp } from '../../context/AppContext';
import { RefreshCw } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoadingUser, isLargeFont, toggleFontSize, ideas, navigate } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname?.startsWith('/auth');
  const isKnowledgePage = pathname?.startsWith('/knowledge');
  const isMatchingPage = pathname?.startsWith('/matching');
  const isPublicPage = isAuthPage || isKnowledgePage || isMatchingPage;

  useEffect(() => {
    if (!isLoadingUser && !currentUser && !isPublicPage) {
      router.push('/auth');
    }
  }, [currentUser, isLoadingUser, isPublicPage, router]);

  // If on auth page, render clean page without Navbar or bottom navigation
  if (isAuthPage) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F4F4F0]">
        {children}
      </main>
    );
  }

  // While checking session or redirecting unauthenticated users on protected pages
  if (!isKnowledgePage && !isMatchingPage && (isLoadingUser || !currentUser)) {
    return (
      <>
        <Navbar
          currentUser={null}
          isLargeFont={isLargeFont}
          onToggleFontSize={toggleFontSize}
          ideasCount={ideas.length}
          onNavigate={navigate}
        />
        <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-stone-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <p className="text-sm font-medium">
            {isLoadingUser ? 'Sprawdzanie sesji...' : 'Przekierowywanie do logowania...'}
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar
        currentUser={currentUser}
        isLargeFont={isLargeFont}
        onToggleFontSize={toggleFontSize}
        ideasCount={ideas.length}
        onNavigate={navigate}
      />
      <main className="flex-1 pb-20 md:pb-8">
        {children}
      </main>
    </>
  );
};
