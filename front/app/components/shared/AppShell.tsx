'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { useApp } from '../../context/AppContext';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLargeFont, toggleFontSize, ideas, navigate } = useApp();

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
