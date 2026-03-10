/**
 * Test Utilities
 * 
 * Custom render function and test helpers for React components.
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { useAuthStore } from '@/lib/state/auth-store';
import { useTaskStore } from '@/lib/state/task-store';

/**
 * Reset all Zustand stores to initial state
 */
export function resetStores() {
  // Reset auth store
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    redirectPath: null,
  });

  // Reset task store
  useTaskStore.setState({
    tasks: [],
    currentTask: null,
    taskLogs: {},
  });
}

/**
 * Custom render function with store reset
 * 
 * @param ui - Component to render
 * @param options - Render options
 * @returns Render result
 */
export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Reset stores before each test
  resetStores();

  return render(ui, options);
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';

/**
 * Override render with custom render
 */
export { customRender as render };

/**
 * Test data factories
 */
export { createMockTask } from '@/lib/mock/tasks';
export { mockUser, mockUsers } from '@/lib/mock/users';
export { mockQuestions } from '@/lib/mock/questions';

/**
 * Helper to wait for async state updates
 */
export async function waitForStoreUpdate(callback: () => boolean, timeout = 1000): Promise<void> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const check = () => {
      if (callback()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Timeout waiting for store update'));
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

/**
 * Helper to simulate file upload
 */
export function createMockFile(
  name: string,
  size: number,
  type: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): File {
  const blob = new Blob(['mock file content'.repeat(size / 10)], { type });
  return new File([blob], name, { type });
}
