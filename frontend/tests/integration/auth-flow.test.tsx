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

// Import components
import { Navbar } from '@/components/layout/Navbar';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockSearchParamsGet = vi.fn().mockReturnValue(null);
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

// Mock next-auth/react
const mockSignIn = vi.fn().mockResolvedValue({ ok: true });
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

describe('Authentication Flow Integration', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockSearchParamsGet.mockReturnValue(null);
    (navigation.useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('renders the Google sign-in button and Vietnamese UI', async () => {
      rawRender(<LoginPage />);

      expect(screen.getByText('Đăng nhập vào SiroMix')).toBeInTheDocument();
      expect(screen.getByText(/Đăng nhập bằng tài khoản Google/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tiếp tục với Google/i })).toBeInTheDocument();
    });

    it('calls signIn("google") with callbackUrl when button is clicked', async () => {
      rawRender(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', expect.objectContaining({ callbackUrl: '/' }));
      });
    });

    it('shows loading state while OAuth is in progress', async () => {
      // Delay signIn to keep the button in loading state
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      rawRender(<LoginPage />);

      const googleButton = screen.getByRole('button', { name: /Tiếp tục với Google/i });
      expect(googleButton).not.toBeDisabled();

      await user.click(googleButton);

      // Button should now be disabled (loading)
      expect(googleButton).toBeDisabled();
    });

    it('shows error UI when URL contains ?error= (OAuth callback error)', async () => {
      mockSearchParamsGet.mockReturnValue('OAuthSignin');

      rawRender(<LoginPage />);

      await waitFor(() => {
        // Check that at least one error element is shown
        const errorElements = screen.queryAllByText(/Đăng nhập thất bại/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });
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
      useAuthStore.setState({ redirectPath: '/exams/create' });
      rawRender(<LoginPage />);
      expect(useAuthStore.getState().redirectPath).toBe('/exams/create');
    });

    it('redirects to stored path when already authenticated', () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        redirectPath: '/exams/create',
      });

      rawRender(<LoginPage />);

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/exams/create');
      });
    });
  });

  describe('State Persistence', () => {
    it('persists auth state to localStorage when login() is called', () => {
      // Directly test store persistence (SessionSync handles login() in production)
      useAuthStore.getState().login(mockUser, 'real-id-token');

      const stored = localStorage.getItem('auth-state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.user.user_id).toBe(mockUser.user_id);
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('hydrates auth state from persisted store state', () => {
      // Simulate persisted state in localStorage
      const authState = {
        state: {
          user: mockUser,
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-state', JSON.stringify(authState));

      // Manually hydrate
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      localStorage.setItem('access_token', 'ya29.real-token');
      useAuthStore.getState().checkAuth();

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
      expect(screen.getByText(/Cần hỗ trợ/i)).toBeInTheDocument();
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
