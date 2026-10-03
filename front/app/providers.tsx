'use client';

import React from 'react';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/shared/AppShell';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
