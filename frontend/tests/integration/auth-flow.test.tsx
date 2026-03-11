/**
 * Authentication Flow Integration Tests
 * 
 * Tests for the complete authentication workflow including login, logout, and state persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as rawRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetStores } from '../utils';
import { useAuthStore } from '@/lib/state/auth-store';
import { mockUser } from '@/lib/mock/users';
import * as navigation from 'next/navigation';
import * as simulation from '@/lib/simulation/oauth';

// Import components
import { Navbar } from '@/components/layout/Navbar';
import LoginPage from '@/app/login/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock OAuth simulation
vi.mock('@/lib/simulation/oauth', async () => {
  const actual = await vi.importActual('@/lib/simulation/oauth');
  return {
    ...actual,
    simulateGoogleOAuth: vi.fn(),
  };
});

describe('Authentication Flow Integration', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    (navigation.useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (simulation.simulateGoogleOAuth as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('completes full login flow from unauthenticated to authenticated', async () => {
      // Step 1: Render login page (unauthenticated state)
      rawRender(<LoginPage />);

      // Step 2: Verify Vietnamese login UI
      expect(screen.getByText('Đăng nhập vào SiroMix')).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập bằng tài khoản Google/i)).toBeInTheDocument();

      // Step 3: Click "Tiếp tục với Google" button
      const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
      await user.click(googleButton);

      // Step 4: Verify OAuth simulation was called
      expect(simulation.simulateGoogleOAuth).toHaveBeenCalledTimes(1);

      // Step 5: Wait for authentication to complete
      await waitFor(() => {
        const authState = useAuthStore.getState();
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.user).toEqual(mockUser);
      });

      // Step 6: Verify redirect to home page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('shows loading state during OAuth simulation', async () => {
      // Make OAuth simulation delay longer
      (simulation.simulateGoogleOAuth as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      rawRender(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
      await user.click(googleButton);

      // Should show loading spinner (white variant)
      expect(googleButton).toContainHTML('animate-spin');
      expect(screen.queryByText('Tiếp tục với Google')).not.toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        const authState = useAuthStore.getState();
        expect(authState.isAuthenticated).toBe(true);
      });
    });

    it('handles OAuth errors gracefully', async () => {
      // Mock OAuth failure
      const errorMessage = 'OAuth authentication failed';
      (simulation.simulateGoogleOAuth as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      rawRender(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
      await user.click(googleButton);

      // Should show error message in Vietnamese
      await waitFor(() => {
        expect(screen.getByText(/Đăng nhập thất bại/i)).toBeInTheDocument();
      });

      // Should remain unauthenticated
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);
    });
  });

  describe('Navbar Integration', () => {
    it('shows login button when unauthenticated', () => {
      const handleLogin = vi.fn();
      rawRender(<Navbar user={null} onLogin={handleLogin} />);

      const loginButton = screen.getByRole('button', { name: /Đăng nhập/i });
      expect(loginButton).toBeInTheDocument();
    });

    it('shows user avatar and dropdown when authenticated', async () => {
      const handleLogout = vi.fn();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        redirectPath: null,
      });

      rawRender(<Navbar user={mockUser} onLogout={handleLogout} />);

      // Should show user avatar and name
      expect(screen.getByText(mockUser.full_name)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: mockUser.full_name })).toBeInTheDocument();

      // Click avatar to open dropdown
      const avatarButton = screen.getByRole('button', { name: new RegExp(mockUser.full_name, 'i') });
      await user.click(avatarButton);

      // Should show dropdown with user info
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đăng xuất/i })).toBeInTheDocument();
    });

    it('completes logout flow', async () => {
      const handleLogout = vi.fn();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        redirectPath: null,
      });

      rawRender(<Navbar user={mockUser} onLogout={handleLogout} />);

      // Open dropdown
      const avatarButton = screen.getByRole('button', { name: new RegExp(mockUser.full_name, 'i') });
      await user.click(avatarButton);

      // Click logout
      const logoutButton = screen.getByRole('button', { name: /Đăng xuất/i });
      await user.click(logoutButton);

      // Should call onLogout callback
      expect(handleLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redirect Flow', () => {
    it('stores redirectPath when accessing protected route unauthenticated', () => {
      // Set a redirect path
      useAuthStore.setState({
        redirectPath: '/exams/create',
      });

      rawRender(<LoginPage />);

      // Complete auth
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      // Should redirect to stored path
      rawRender(<LoginPage />);
      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/exams/create');
      });
    });

    it('clears redirectPath after successful redirect', async () => {
      // Set redirect path
      useAuthStore.setState({
        redirectPath: '/exams/create',
      });

      rawRender(<LoginPage />);

      // Simulate successful login
      await user.click(screen.getByRole('button', { name: /Tiếp tục với Google/i }));

      await waitFor(() => {
        const authState = useAuthStore.getState();
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.redirectPath).toBeNull();
      });
    });
  });

  describe('State Persistence', () => {
    it('persists auth state to localStorage on login', async () => {
      rawRender(<LoginPage />);

      // Click login
      await user.click(screen.getByRole('button', { name: /Tiếp tục với Google/i }));

      // Wait for auth
      await waitFor(() => {
        const authState = useAuthStore.getState();
        expect(authState.isAuthenticated).toBe(true);
      });

      // Check localStorage
      const stored = localStorage.getItem('auth-state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.user).toEqual(mockUser);
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('hydrates auth state from localStorage on mount', () => {
      // Manually set localStorage
      const authState = {
        state: {
          user: mockUser,
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-state', JSON.stringify(authState));

      // Reset store and trigger hydration
      resetStores();
      useAuthStore.getState().checkAuth();

      // Should restore state
      const currentState = useAuthStore.getState();
      expect(currentState.user).toEqual(mockUser);
      expect(currentState.isAuthenticated).toBe(true);
    });

    it('clears localStorage on logout', () => {
      // Set authenticated state and localStorage
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      localStorage.setItem('auth-state', JSON.stringify({
        state: { user: mockUser, isAuthenticated: true },
        version: 0,
      }));

      // Logout
      useAuthStore.getState().logout();

      // Check store is cleared
      const authState = useAuthStore.getState();
      expect(authState.user).toBeNull();
      expect(authState.isAuthenticated).toBe(false);

      // Check localStorage is updated
      const stored = localStorage.getItem('auth-state');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.user).toBeNull();
      expect(parsed.state.isAuthenticated).toBe(false);
    });
  });

  describe('Vietnamese UI Consistency', () => {
    it('displays all Vietnamese text correctly on login page', () => {
      rawRender(<LoginPage />);

      // Check key Vietnamese phrases
      expect(screen.getByText('Đăng nhập vào SiroMix')).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập bằng tài khoản Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Tiếp tục với Google/i)).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập an toàn/i)).toBeInTheDocument();
      expect(screen.getByText(/Cần hỗ trợ\\?/i)).toBeInTheDocument();
    });

    it('displays Vietnamese logout text in Navbar', async () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      rawRender(<Navbar user={mockUser} onLogout={vi.fn()} />);

      // Open dropdown
      const avatarButton = screen.getByRole('button', { name: new RegExp(mockUser.full_name, 'i') });
      await user.click(avatarButton);

      // Check Vietnamese "Đăng xuất"
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
    });
  });
});
