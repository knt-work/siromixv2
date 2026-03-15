/**
 * SessionSync Unit Tests
 *
 * Tests:
 * 1. Authenticated session with idToken calls GET /api/v1/me with Bearer header
 * 2. Successful /api/v1/me response calls authStore.login(user, idToken)
 * 3. Failed /api/v1/me calls signOut(), shows error modal, calls console.error
 * 4. staleMockSession=true shows toast and clears the flag
 * 5. Unauthenticated session + isAuthenticated=true calls authStore.logout()
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/state/auth-store';
import { SessionSync } from '@/components/auth/SessionSync';
import type { User } from '@/types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// next-auth/react — controlled per test
let mockSessionStatus = 'loading';
let mockSessionData: { idToken?: string } | null = null;
const mockSignOut = vi.fn().mockResolvedValue(undefined);

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: mockSessionStatus, data: mockSessionData }),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Toast context — capture showToast calls
const mockShowToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockUser: User = {
  user_id: 'user-001',
  google_id: 'google-001',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetStore() {
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    redirectPath: null,
    staleMockSession: false,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SessionSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockSessionStatus = 'loading';
    mockSessionData = null;
  });

  // ─── /api/v1/me call ───────────────────────────────────────────────────────

  describe('authenticated session — /api/v1/me', () => {
    it('calls GET /api/v1/me with Authorization: Bearer header', async () => {
      mockSessionStatus = 'authenticated';
      mockSessionData = { idToken: 'real-id-token' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockResolvedValueOnce(
        new Response(JSON.stringify(mockUser), { status: 200 }) as Response,
      );

      render(<SessionSync />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/me'),
          expect.objectContaining({
            headers: { Authorization: 'Bearer real-id-token' },
          }),
        );
      });
      fetchSpy.mockRestore();
    });

    it('calls authStore.login(user, idToken) on successful /api/v1/me', async () => {
      mockSessionStatus = 'authenticated';
      mockSessionData = { idToken: 'real-id-token' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockResolvedValueOnce(
        new Response(JSON.stringify(mockUser), { status: 200 }) as Response,
      );

      render(<SessionSync />);

      await waitFor(() => {
        const { isAuthenticated, user } = useAuthStore.getState();
        expect(isAuthenticated).toBe(true);
        expect(user?.user_id).toBe(mockUser.user_id);
        expect(localStorage.getItem('access_token')).toBe('real-id-token');
      });
      fetchSpy.mockRestore();
    });

    it('calls signOut() and shows error modal when /api/v1/me returns non-ok', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSessionStatus = 'authenticated';
      mockSessionData = { idToken: 'real-id-token' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }) as Response,
      );

      render(<SessionSync />);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      expect(screen.getByText(/Lỗi xác thực/i)).toBeInTheDocument();
      fetchSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('calls signOut() and shows error modal when /api/v1/me fetch throws', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSessionStatus = 'authenticated';
      mockSessionData = { idToken: 'real-id-token' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never).mockRejectedValueOnce(
        new Error('Network error'),
      );

      render(<SessionSync />);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
      });

      expect(screen.getByText(/Lỗi xác thực/i)).toBeInTheDocument();
      fetchSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('does NOT call /api/v1/me when session has no idToken', async () => {
      mockSessionStatus = 'authenticated';
      mockSessionData = {}; // no idToken

      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never);

      render(<SessionSync />);

      await act(async () => { /* allow useEffect to settle */ });

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  // ─── unauthenticated session ───────────────────────────────────────────────

  describe('unauthenticated session', () => {
    it('calls authStore.logout() when unauthenticated but store says isAuthenticated', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      mockSessionStatus = 'unauthenticated';

      render(<SessionSync />);

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().user).toBeNull();
      });
    });

    it('does NOT call external APIs when unauthenticated and store is already logged out', async () => {
      mockSessionStatus = 'unauthenticated';
      const fetchSpy = vi.spyOn(globalThis, 'fetch' as never);

      render(<SessionSync />);

      await act(async () => {});
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  // ─── staleMockSession ─────────────────────────────────────────────────────

  describe('staleMockSession toast', () => {
    it('shows warning toast and clears flag when staleMockSession=true', async () => {
      useAuthStore.setState({ staleMockSession: true });
      mockSessionStatus = 'unauthenticated';

      render(<SessionSync />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'warning',
          expect.stringContaining('Phiên cũ đã hết hạn'),
        );
      });

      expect(useAuthStore.getState().staleMockSession).toBe(false);
    });

    it('does NOT show toast when staleMockSession=false', async () => {
      mockSessionStatus = 'unauthenticated';

      render(<SessionSync />);

      await act(async () => {});
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });
});
