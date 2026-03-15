/**
 * Root Layout
 * 
 * Application root with global styles, Inter font, and Navbar integration.
 * Updated with exact Visily specifications and SEO meta tags.
 */

'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/state/auth-store';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import { Providers } from './providers';

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

  // Hydrate auth state from localStorage on mount (also detects stale mock tokens)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    logout();
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <html lang="vi" className={inter.variable}>
      <Head>
        <title>SiroMix - Trộn đề thi nhanh chóng</title>
        <meta name="description" content="Ứng dụng trộn đề thi tự động, giúp giáo viên tạo bộ đề đa dạng nhanh chóng và hiệu quả" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#9a94de" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta property="og:title" content="SiroMix - Trộn đề thi nhanh chóng" />
        <meta property="og:description" content="Ứng dụng trộn đề thi tự động cho giáo viên" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body className={`min-h-screen bg-background-main font-sans antialiased ${inter.className}`}>
        <Providers>
          <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
