'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionSync } from '@/components/auth/SessionSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <SessionSync />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
