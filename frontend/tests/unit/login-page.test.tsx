/**
 * Login Page Unit Tests
 *
 * Tests that:
 * 1. The Google sign-in button renders
 * 2. Clicking the button calls signIn('google', { callbackUrl })
 * 3. When the URL contains ?error=..., an error modal appears and console.error fires
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/state/auth-store';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
}));

// Mock next-auth/react
const mockSignIn = vi.fn();
vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: () => ({ status: 'unauthenticated', data: null }),
}));

let mockSearchParams: Record<string, string> = {};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function renderLoginPage() {
  const { default: LoginPage } = await import('@/app/login/page');
  return render(<LoginPage />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login Page', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockSignIn.mockReset();
    mockSearchParams = {};
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      redirectPath: null,
      staleMockSession: false,
    });
  });

  it('renders the Google sign-in button', async () => {
    await renderLoginPage();
    expect(screen.getByText(/Tiếp tục với Google/i)).toBeInTheDocument();
  });

  it('calls signIn("google") when the button is clicked', async () => {
    mockSignIn.mockResolvedValue({ ok: true });
    await renderLoginPage();

    fireEvent.click(screen.getByText(/Tiếp tục với Google/i));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', expect.objectContaining({ callbackUrl: '/' }));
    });
  });

  it('shows an error modal when URL contains ?error= and calls console.error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSearchParams = { error: 'OAuthSignin' };

    await renderLoginPage();

    // Error modal or error text should be visible
    await waitFor(() => {
      const errorElement = screen.queryByText(/lỗi/i) || screen.queryByText(/error/i) || screen.queryByText(/thất bại/i);
      expect(errorElement).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
