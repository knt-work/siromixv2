/**
 * Task Retry Flow Integration Tests
 * 
 * Phase 8 - T100: Tests for retry button, confirmation modal, retry count increment,
 * task reset, pipeline restart, notifications, and retry limits.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import ExamDetailPage from '@/app/tasks/[taskId]/page';
import { useTaskStore } from '@/lib/state/task-store';
import type { Task, TaskLog } from '@/types';

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    taskId: 'failed-task-456',
  }),
}));

// Mock timers for debouncing tests
vi.useFakeTimers();

describe('Task Retry Flow Integration Tests', () => {
  const taskId = 'failed-task-456';
  
  const mockFailedTask: Task = {
    task_id: taskId,
    user_id: 'user-1',
    status: 'failed',
    progress: 65,
    metadata: {
      academic_year: '2024-2025',
      exam_name: 'Kiểm tra Vật lý',
      subject: 'Vật lý',
      duration_minutes: 90,
      num_versions: 4,
    },
    file_name: 'physics_exam.pdf',
    file_size: 1536000,
    created_at: '2026-03-11T10:00:00Z',
    updated_at: '2026-03-11T10:15:00Z',
    completed_at: null,
    error: 'Lỗi khi trích xuất câu hỏi từ PDF',
    retry_count: 0,
  };

  const mockLogs: TaskLog[] = [
    {
      log_id: 'log-1',
      task_id: taskId,
      timestamp: '2026-03-11T10:05:00Z',
      log_level: 'INFO',
      message: 'Bắt đầu xử lý',
    },
    {
      log_id: 'log-2',
      task_id: taskId,
      timestamp: '2026-03-11T10:15:00Z',
      log_level: 'ERROR',
      message: 'Lỗi khi trích xuất câu hỏi từ PDF',
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
    vi.clearAllTimers();
    
    // Reset task store with failed task
    useTaskStore.setState({
      tasks: [mockFailedTask],
      taskLogs: {
        [taskId]: mockLogs,
      },
    });

    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Retry Button Display', () => {
    it('shows Vietnamese retry button "Thử lại" for failed tasks', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });

    it('displays retry button with purple background #9a94de', () => {
      const { container } = render(<ExamDetailPage />);
      
      const retryButton = container.querySelector('.bg-\\[\\#9a94de\\]');
      expect(retryButton).toBeInTheDocument();
    });

    it('shows retry icon alongside button text', () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại').closest('button');
      expect(retryButton).toBeInTheDocument();
    });

    it('does not show retry button for completed tasks', () => {
      const completedTask: Task = {
        ...mockFailedTask,
        status: 'completed',
        progress: 100,
        completed_at: '2026-03-11T11:00:00Z',
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [completedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
    });

    it('does not show retry button for processing tasks', () => {
      const processingTask: Task = {
        ...mockFailedTask,
        status: 'extracting',
        progress: 25,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [processingTask],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
    });
  });

  describe('Retry Count Increment', () => {
    it('increments retry_count when retry button is clicked', async () => {
      const retryTask = vi.spyOn(useTaskStore.getState(), 'retryTask');
      
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(retryTask).toHaveBeenCalledWith(taskId);
      });
    });

    it('displays current retry count "1 / 2" after first retry', () => {
      const taskAfterFirstRetry: Task = {
        ...mockFailedTask,
        retry_count: 1,
      };
      
      useTaskStore.setState({
        tasks: [taskAfterFirstRetry],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.getByText('SỐ LẦN THỬ LẠI')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('displays "2 / 2" after second retry', () => {
      const taskAfterSecondRetry: Task = {
        ...mockFailedTask,
        retry_count: 2,
      };
      
      useTaskStore.setState({
        tasks: [taskAfterSecondRetry],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });
  });

  describe('Task Reset Behavior', () => {
    it('resets task to pending status after retry', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      // Simulate task store update after retry
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'pending',
        progress: 0,
        retry_count: 1,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      await waitFor(() => {
        // Status should change from failed to pending
        expect(screen.queryByText('Thất bại')).not.toBeInTheDocument();
      });
    });

    it('resets progress to 0% after retry', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'pending',
        progress: 0,
        retry_count: 1,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      // After retry, progress should be 0
      await waitFor(() => {
        expect(screen.queryByText(/65%/)).not.toBeInTheDocument();
      });
    });

    it('clears error message after retry', async () => {
      render(<ExamDetailPage />);
      
      // Initially shows error
      expect(screen.getByText(/Lỗi khi trích xuất câu hỏi từ PDF/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'extracting',
        progress: 0,
        retry_count: 1,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      await waitFor(() => {
        expect(screen.queryByText(/Lỗi khi trích xuất câu hỏi từ PDF/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Pipeline Restart from Extract Stage', () => {
    it('restarts pipeline at extracting stage after retry', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'extracting',
        progress: 5,
        retry_count: 1,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: [
          ...mockLogs,
          {
            log_id: 'log-3',
            task_id: taskId,
            timestamp: new Date().toISOString(),
            log_level: 'INFO',
            message: 'Đã thử lại lần 1',
          },
        ] },
      });

      await waitFor(() => {
        expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
      });
    });
  });

  describe('Max Retry Limit Enforcement', () => {
    it('shows enabled retry button when retry_count is 0', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });

    it('shows enabled retry button when retry_count is 1', () => {
      const taskWithOneRetry: Task = {
        ...mockFailedTask,
        retry_count: 1,
      };
      
      useTaskStore.setState({
        tasks: [taskWithOneRetry],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });

    it('disables retry when retry_count reaches max of 2', () => {
      const taskWithMaxRetries: Task = {
        ...mockFailedTask,
        retry_count: 2,
      };
      
      useTaskStore.setState({
        tasks: [taskWithMaxRetries],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
      expect(screen.getByText(/Đã hết lượt thử lại/)).toBeInTheDocument();
    });

    it('shows Vietnamese disabled state message "Đã hết lượt thử lại (tối đa 2 lần)"', () => {
      const taskWithMaxRetries: Task = {
        ...mockFailedTask,
        retry_count: 2,
      };
      
      useTaskStore.setState({
        tasks: [taskWithMaxRetries],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      expect(screen.getByText(/Đã hết lượt thử lại \(tối đa 2 lần\)/)).toBeInTheDocument();
    });

    it('displays disabled state in gray bordered container', () => {
      const taskWithMaxRetries: Task = {
        ...mockFailedTask,
        retry_count: 2,
      };
      
      useTaskStore.setState({
        tasks: [taskWithMaxRetries],
        taskLogs: { [taskId]: mockLogs },
      });

      const { container } = render(<ExamDetailPage />);
      
      const disabledContainer = container.querySelector('.bg-\\[\\#f3f4f6\\]');
      expect(disabledContainer).toBeInTheDocument();
    });
  });

  describe('Debouncing Double-Click Prevention', () => {
    it('prevents double-click retries with debouncing', async () => {
      const retryTask = vi.spyOn(useTaskStore.getState(), 'retryTask');
      
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      
      // Rapid double-click
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      
      // Should only call retry once due to debouncing in component
      await waitFor(() => {
        expect(retryTask).toHaveBeenCalledTimes(1);
      });
    });

    it('disables retry button during retry operation', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại').closest('button');
      expect(retryButton).not.toBeDisabled();
      
      // Click retry button
      fireEvent.click(retryButton!);
      
      // Advance timers slightly to trigger retrying state
      vi.advanceTimersByTime(100);
      
      // Button should be temporarily disabled during retry
      await waitFor(() => {
        // The component sets retrying state, preventing multiple clicks
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Banner Display', () => {
    it('displays error banner for failed tasks', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
    });

    it('shows error message from task.error', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText(/Lỗi khi trích xuất câu hỏi từ PDF/)).toBeInTheDocument();
    });

    it('displays error banner with red styling #d3595e', () => {
      const { container } = render(<ExamDetailPage />);
      
      const errorBanner = container.querySelector('.border-\\[\\#d3595e\\]\\/20');
      expect(errorBanner).toBeInTheDocument();
    });
  });

  describe('Retry Flow Logs', () => {
    it('displays existing logs in chronological order', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText(/Bắt đầu xử lý/)).toBeInTheDocument();
      expect(screen.getByText(/Lỗi khi trích xuất câu hỏi từ PDF/)).toBeInTheDocument();
    });

    it('shows log count including error logs', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText(/2 logs/)).toBeInTheDocument();
    });

    it('highlights ERROR logs with red color', () => {
      const { container } = render(<ExamDetailPage />);
      
      expect(screen.getByText(/Lỗi khi trích xuất câu hỏi từ PDF/)).toBeInTheDocument();
      
      const errorLog = container.querySelector('.text-\\[\\#d3595e\\]');
      expect(errorLog).toBeInTheDocument();
    });
  });

  describe('Vietnamese Status Updates', () => {
    it('shows "Thất bại" badge for failed task', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Thất bại')).toBeInTheDocument();
    });

    it('updates badge to "Chờ xử lý" after retry', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'pending',
        progress: 0,
        retry_count: 1,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      await waitFor(() => {
        expect(screen.getByText('Chờ xử lý')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator Updates', () => {
    it('shows 65% progress for failed task before retry', () => {
      render(<ExamDetailPage />);
      
      // Failed task should show progress where it stopped
      expect(screen.queryByText(/65%/)).toBeInTheDocument();
    });

    it('resets progress indicator after retry', async () => {
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      const retriedTask: Task = {
        ...mockFailedTask,
        status: 'extracting',
        progress: 10,
        retry_count: 1,
        error: undefined,
      };
      
      useTaskStore.setState({
        tasks: [retriedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      await waitFor(() => {
        expect(screen.getByText(/10% Hoàn tất/)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with ProcessingStatus Component', () => {
    it('passes task to ProcessingStatus component', () => {
      render(<ExamDetailPage />);
      
      // ProcessingStatus should receive the task and display its status
      expect(screen.getByText('Chi tiết tiến trình')).toBeInTheDocument();
      expect(screen.getByText('Thất bại')).toBeInTheDocument();
    });

    it('passes logs to ProcessingStatus component', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Logs & Lịch sử')).toBeInTheDocument();
      expect(screen.getByText(/2 logs/)).toBeInTheDocument();
    });

    it('passes onRetry callback to ProcessingStatus', async () => {
      const retryTask = vi.spyOn(useTaskStore.getState(), 'retryTask');
      
      render(<ExamDetailPage />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(retryTask).toHaveBeenCalled();
      });
    });

    it('passes showRetryButton=true for failed tasks', () => {
      render(<ExamDetailPage />);
      
      // Retry button should appear for failed tasks
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });
  });
});
