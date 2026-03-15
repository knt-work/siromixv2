/**
 * Auth Store Unit Tests
 *
 * Tests login/logout token storage, checkAuth() mock-token detection (staleMockSession),
 * and clearStaleMockFlag() action.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/state/auth-store';
import type { User } from '@/types';

const mockUser: User = {
  user_id: 'user-001',
  google_id: 'google-001',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Reset auth store + localStorage before each test.
 */
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

describe('Auth Store', () => {
  beforeEach(resetStore);

  // ─── login() ─────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('sets isAuthenticated and user in store', () => {
      useAuthStore.getState().login(mockUser, 'real-id-token-abc');
      const { isAuthenticated, user } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(user).toEqual(mockUser);
    });

    it('writes provided token to localStorage', () => {
      useAuthStore.getState().login(mockUser, 'real-id-token-abc');
      expect(localStorage.getItem('access_token')).toBe('real-id-token-abc');
    });

    it('writes a mock-token when no token is provided', () => {
      useAuthStore.getState().login(mockUser);
      const token = localStorage.getItem('access_token');
      expect(token).toBe(`mock-token-${mockUser.user_id}`);
    });
  });

  // ─── logout() ────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears isAuthenticated and user', () => {
      useAuthStore.getState().login(mockUser, 'real-id-token-abc');
      useAuthStore.getState().logout();
      const { isAuthenticated, user } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(user).toBeNull();
    });

    it('removes access_token from localStorage', () => {
      localStorage.setItem('access_token', 'real-id-token-abc');
      useAuthStore.getState().logout();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  // ─── checkAuth() ─────────────────────────────────────────────────────────

  describe('checkAuth()', () => {
    it('sets isAuthenticated=true when a valid user exists in store', () => {
      useAuthStore.setState({ user: mockUser });
      localStorage.setItem('access_token', 'real-id-token-abc');
      useAuthStore.getState().checkAuth();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sets isAuthenticated=false when no user in store', () => {
      useAuthStore.getState().checkAuth();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('detects mock-token-* in localStorage and sets staleMockSession=true', () => {
      // Hydrate store with a user and a stale mock token (pre-OAuth migration scenario)
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      localStorage.setItem('access_token', `mock-token-${mockUser.user_id}`);

      useAuthStore.getState().checkAuth();

      const { staleMockSession, isAuthenticated, user } = useAuthStore.getState();
      expect(staleMockSession).toBe(true);
      expect(isAuthenticated).toBe(false);  // logged out after detection
      expect(user).toBeNull();
    });

    it('does NOT set staleMockSession for a real token', () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      localStorage.setItem('access_token', 'ya29.real-google-token');

      useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().staleMockSession).toBe(false);
    });
  });

  // ─── clearStaleMockFlag() ─────────────────────────────────────────────────

  describe('clearStaleMockFlag()', () => {
    it('resets staleMockSession to false', () => {
      useAuthStore.setState({ staleMockSession: true });
      useAuthStore.getState().clearStaleMockFlag();
      expect(useAuthStore.getState().staleMockSession).toBe(false);
    });
  });
});
