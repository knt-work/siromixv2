/**
 * Homepage Navigation Integration Tests
 * 
 * Tests for homepage CTA button navigation and auth-gated flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils';
import HomePage from '@/app/page';
import { useAuthStore } from '@/lib/state/auth-store';
import { mockUser } from '@/lib/mock/users';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('Homepage Navigation Integration', () => {
  beforeEach(() => {
    // Reset router mock
    mockPush.mockClear();
    
    // Reset auth store
    useAuthStore.getState().logout();
  });

  describe('CTA Buttons', () => {
    it('renders all three CTA buttons', () => {
      render(<HomePage />);
      
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new exam/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /user guide/i })).toBeInTheDocument();
    });

    it('Login button navigates to /login', async () => {
      const user = userEvent.setup();
      
      render(<HomePage />);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('User Guide button navigates to /guide', async () => {
      const user = userEvent.setup();
      
      render(<HomePage />);
      const guideButton = screen.getByRole('button', { name: /user guide/i });
      
      await user.click(guideButton);
      expect(mockPush).toHaveBeenCalledWith('/guide');
    });
  });

  describe('Create New Exam - Auth Gating', () => {
    it('redirects to /login when not authenticated', async () => {
      const user = userEvent.setup();
      
      render(<HomePage />);
      const createButton = screen.getByRole('button', { name: /create new exam/i });
      
      await user.click(createButton);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('sets redirectPath when not authenticated', async () => {
      const user = userEvent.setup();
      
      render(<HomePage />);
      const createButton = screen.getByRole('button', { name: /create new exam/i });
      
      await user.click(createButton);
      
      const state = useAuthStore.getState();
      expect(state.redirectPath).toBe('/exams/create');
    });

    it('navigates to /exams/create when authenticated', async () => {
      const user = userEvent.setup();
      
      // Set authenticated state
      useAuthStore.getState().login(mockUser);
      
      render(<HomePage />);
      const createButton = screen.getByRole('button', { name: /create new exam/i });
      
      await user.click(createButton);
      expect(mockPush).toHaveBeenCalledWith('/exams/create');
    });

    it('does not show Login button when authenticated', () => {
      // Set authenticated state
      useAuthStore.getState().login(mockUser);
      
      render(<HomePage />);
      expect(screen.queryByRole('button', { name: /^login$/i })).not.toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('displays welcome heading', () => {
      render(<HomePage />);
      expect(screen.getByRole('heading', { name: /welcome to siromix/i })).toBeInTheDocument();
    });

    it('displays product description', () => {
      render(<HomePage />);
      expect(screen.getByText(/streamline your exam creation process/i)).toBeInTheDocument();
    });

    it('displays feature cards', () => {
      render(<HomePage />);
      
      expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
      expect(screen.getByText(/shuffle & create/i)).toBeInTheDocument();
      expect(screen.getByText(/track progress/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders PageContainer with correct maxWidth', () => {
      const { container } = render(<HomePage />);
      const pageContainer = container.querySelector('.max-w-screen-lg');
      expect(pageContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1, name: /welcome to siromix/i });
      expect(mainHeading).toBeInTheDocument();
      
      const featureHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(featureHeadings.length).toBeGreaterThan(0);
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(<HomePage />);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      loginButton.focus();
      expect(loginButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
