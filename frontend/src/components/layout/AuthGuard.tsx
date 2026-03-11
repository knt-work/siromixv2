/**
 * AuthGuard Template Component
 * 
 * Protects routes by checking authentication state.
 * Redirects to login or shows fallback for unauthenticated users.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/state/auth-store';
import { Spinner } from '@/components/ui/Spinner';

export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, setRedirectPath } = useAuthStore();

  useEffect(() => {
    // Only redirect if not loading, not authenticated, no fallback, and redirectTo is provided
    if (!isLoading && !isAuthenticated && !fallback && redirectTo) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== redirectTo) {
        setRedirectPath(currentPath);
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, fallback, redirectTo, router, setRedirectPath]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" variant="primary" label="Đang kiểm tra xác thực..." />
      </div>
    );
  }

  // Show fallback or nothing if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  // Render protected content
  return <>{children}</>;
};
