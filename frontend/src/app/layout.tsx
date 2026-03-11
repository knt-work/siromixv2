/**
 * Root Layout
 * 
 * Application root with global styles, Inter font, and Navbar integration.
 * Updated with exact Visily specifications.
 */

'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/state/auth-store';
import { useRouter } from 'next/navigation';

// Configure Inter font with Vietnamese support
const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, checkAuth, logout } = useAuthStore();
  const router = useRouter();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <html lang="vi" className={inter.variable}>
      <body className={`min-h-screen bg-background-main font-sans antialiased ${inter.className}`}>
        <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <main>{children}</main>
      </body>
    </html>
  );
}
