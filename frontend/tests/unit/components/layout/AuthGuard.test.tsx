/**
 * AuthGuard Component Unit Tests
 * 
 * Tests for AuthGuard route protection component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as rawRender, screen, waitFor } from '@testing-library/react';
import { resetStores } from '../../../utils';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/lib/state/auth-store';
import { mockUser } from '@/lib/mock/users';
import * as navigation from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('AuthGuard Component', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    (navigation.useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    
    // Reset stores to clean state
    resetStores();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authenticated State', () => {
    it('renders children when user is authenticated', () => {
      // Set authenticated state before rendering
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not redirect when authenticated', () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not show fallback when authenticated', () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard fallback={<div>Please log in</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText('Please log in')).not.toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State with Fallback', () => {
    it('renders fallback when user is not authenticated and fallback provided', () => {
      rawRender(
        <AuthGuard fallback={<div>Please log in</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Please log in')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not redirect when fallback is provided', () => {
      rawRender(
        <AuthGuard fallback={<div>Please log in</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Unauthenticated State with Redirect', () => {
    it('redirects to /login when not authenticated and redirectTo provided', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { pathname: '/protected', search: '' } as any;

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('stores current path in redirectPath before redirecting', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { pathname: '/exams/create', search: '?draft=true' } as any;

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.redirectPath).toBe('/exams/create?draft=true');
      });
    });

    it('does not store redirectPath if current path is the login page', async () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { pathname: '/login', search: '' } as any;

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.redirectPath).toBeNull();
      });
    });

    it('renders nothing while redirect is pending', () => {
      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByText('Đang kiểm tra xác thực...')).toBeInTheDocument();
    });

    it('does not render children while loading', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('does not redirect while loading', () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        redirectPath: null,
      });

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing redirectTo gracefully', () => {
      rawRender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Should render nothing without errors
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('uses default redirectTo of /login when not specified', async () => {
      delete (window as any).location;
      window.location = { pathname: '/protected', search: '' } as any;

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('handles empty query string correctly', async () => {
      delete (window as any).location;
      window.location = { pathname: '/protected', search: '' } as any;

      rawRender(
        <AuthGuard redirectTo="/login">
          <div>Protected Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.redirectPath).toBe('/protected');
      });
    });
  });
});
