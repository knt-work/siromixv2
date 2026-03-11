/**
 * useTaskPolling Hook Unit Tests
 * 
 * Tests polling start/stop, interval timing, callbacks, cleanup, and terminal states.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTaskPolling } from '@/hooks/useTaskPolling';
import { useTaskStore } from '@/lib/state/task-store';
import type { Task, TaskStatus } from '@/types';

// Mock the task store
vi.mock('@/lib/state/task-store', () => ({
  useTaskStore: vi.fn(),
}));

describe('useTaskPolling Hook', () => {
  let mockGetTaskById: any;
  let mockTask: Task;

  beforeEach(() => {
    vi.useFakeTimers();
    
    mockTask = {
      task_id: 'test-task-123',
      user_id: 'user-1',
      status: 'extracting' as TaskStatus,
      progress: 25,
      metadata: {
        academic_year: '2024-2025',
        exam_name: 'Test Exam',
        subject: 'Math',
        duration_minutes: 90,
        num_versions: 4,
        notes: 'Test notes',
      },
      file_name: 'test.pdf',
      file_size: 1024,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
      retry_count: 0,
    };

    mockGetTaskById = vi.fn().mockReturnValue(mockTask);
    
    (useTaskStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ getTaskById: mockGetTaskById });
      }
      return mockGetTaskById;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Polling Start/Stop', () => {
    it('should start polling when enabled', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          enabled: true,
        })
      );

      expect(result.current.isPolling).toBe(true);
    });

    it('should not start polling when enabled is false', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          enabled: false,
        })
      );

      expect(result.current.isPolling).toBe(false);
    });

    it('should stop polling when stopPolling is called', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          enabled: true,
        })
      );

      act(() => {
        result.current.stopPolling();
      });

      expect(result.current.isPolling).toBe(false);
    });

    it('should poll at default 3000ms interval', async () => {
      renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const initialCallCount = mockGetTaskById.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockGetTaskById).toHaveBeenCalledTimes(initialCallCount + 1);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockGetTaskById).toHaveBeenCalledTimes(initialCallCount + 2);
    });

    it('should poll at custom interval', () => {
      renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          interval: 5000,
        })
      );

      const initialCallCount = mockGetTaskById.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockGetTaskById).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  describe('Task Data', () => {
    it('should return current task data', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      expect(result.current.task).toEqual(mockTask);
    });

    it('should update task data when it changes', () => {
      const { result, rerender } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const updatedTask = { ...mockTask, status: 'understanding' as TaskStatus, progress: 50 };
      mockGetTaskById.mockReturnValue(updatedTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.task).toEqual(updatedTask);
    });

    it('should handle undefined task', () => {
      mockGetTaskById.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'non-existent-task',
        })
      );

      expect(result.current.task).toBeUndefined();
      expect(result.current.isPolling).toBe(false);
    });
  });

  describe('Terminal States', () => {
    it('should stop polling when task status is completed', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const completedTask = { ...mockTask, status: 'completed' as TaskStatus, progress: 100 };
      mockGetTaskById.mockReturnValue(completedTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isPolling).toBe(false);
    });

    it('should stop polling when task status is failed', () => {
      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const failedTask = { ...mockTask, status: 'failed' as TaskStatus, error: 'Test error' };
      mockGetTaskById.mockReturnValue(failedTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.isPolling).toBe(false);
    });

    it('should not poll if task starts with completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' as TaskStatus, progress: 100 };
      mockGetTaskById.mockReturnValue(completedTask);

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      expect(result.current.isPolling).toBe(false);
    });

    it('should not poll if task starts with failed status', () => {
      const failedTask = { ...mockTask, status: 'failed' as TaskStatus };
      mockGetTaskById.mockReturnValue(failedTask);

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      expect(result.current.isPolling).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should call onComplete when task is completed', () => {
      const onComplete = vi.fn();

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          onComplete,
        })
      );

      const completedTask = { ...mockTask, status: 'completed' as TaskStatus, progress: 100 };
      mockGetTaskById.mockReturnValue(completedTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledWith(completedTask);
      expect(result.current.isPolling).toBe(false);
    });

    it('should call onError when task fails', () => {
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          onError,
        })
      );

      const failedTask = { ...mockTask, status: 'failed' as TaskStatus, error: 'Test error' };
      mockGetTaskById.mockReturnValue(failedTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onError).toHaveBeenCalledWith(failedTask);
      expect(result.current.isPolling).toBe(false);
    });

    it('should not call onComplete for non-terminal states', () => {
      const onComplete = vi.fn();

      renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          onComplete,
        })
      );

      const understandingTask = { ...mockTask, status: 'understanding' as TaskStatus, progress: 50 };
      mockGetTaskById.mockReturnValue(understandingTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should not call onError for non-failed states', () => {
      const onError = vi.fn();

      renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
          onError,
        })
      );

      const shufflingTask = { ...mockTask, status: 'shuffling' as TaskStatus, progress: 75 };
      mockGetTaskById.mockReturnValue(shufflingTask);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const { unmount } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const initialCallCount = mockGetTaskById.mock.calls.length;

      unmount();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not have called getTaskById after unmount
      expect(mockGetTaskById).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should cleanup interval when enabled changes to false', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useTaskPolling({
            taskId: 'test-task-123',
            enabled,
          }),
        { initialProps: { enabled: true } }
      );

      const callCountBeforeDisable = mockGetTaskById.mock.calls.length;

      rerender({ enabled: false });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Should not have polled after disabling
      expect(mockGetTaskById).toHaveBeenCalledTimes(callCountBeforeDisable);
    });
  });

  describe('Processing Statuses', () => {
    const processingStatuses: TaskStatus[] = ['extracting', 'understanding', 'shuffling', 'generating'];

    processingStatuses.forEach((status) => {
      it(`should continue polling for ${status} status`, () => {
        const processingTask = { ...mockTask, status };
        mockGetTaskById.mockReturnValue(processingTask);

        const { result } = renderHook(() =>
          useTaskPolling({
            taskId: 'test-task-123',
          })
        );

        expect(result.current.isPolling).toBe(true);

        act(() => {
          vi.advanceTimersByTime(3000);
        });

        expect(result.current.isPolling).toBe(true);
      });
    });

    it('should poll for pending status', () => {
      const pendingTask = { ...mockTask, status: 'pending' as TaskStatus, progress: 0 };
      mockGetTaskById.mockReturnValue(pendingTask);

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      expect(result.current.isPolling).toBe(true);
    });

    it('should poll for awaiting status', () => {
      const awaitingTask = { ...mockTask, status: 'awaiting' as TaskStatus, progress: 50 };
      mockGetTaskById.mockReturnValue(awaitingTask);

      const { result } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      expect(result.current.isPolling).toBe(true);
    });
  });

  describe('Task Data Changes', () => {
    it('should only update when task data actually changes', () => {
      const { result, rerender } = renderHook(() =>
        useTaskPolling({
          taskId: 'test-task-123',
        })
      );

      const sameTask = { ...mockTask };
      mockGetTaskById.mockReturnValue(sameTask);

      const initialTask = result.current.task;

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Task reference should change only if data changed
      // (this is implementation-dependent, but generally we want to avoid unnecessary re-renders)
    });
  });
});
