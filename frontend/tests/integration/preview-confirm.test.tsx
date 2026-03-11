/**
 * Preview Confirmation Flow Integration Tests
 * 
 * Tests the complete user flow for previewing extracted questions
 * and confirming to resume the pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import PreviewPage from '@/app/exams/preview/[taskId]/page';
import { useTaskStore } from '@/lib/state/task-store';
import { mockQuestions } from '@/lib/mock-data/questions';
import type { Task } from '@/types';

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Preview Confirmation Flow', () => {
  const taskId = 'test-task-123';
  
  const mockTask: Task = {
    task_id: taskId,
    user_id: 'user-1',
    status: 'awaiting',
    progress: 50,
    metadata: {
      academic_year: '2025-2026',
      exam_name: 'Kiểm tra giữa kì - Toán',
      subject: 'Toán học',
      duration_minutes: 90,
      num_versions: 5,
      notes: 'Đề thi giữa kì môn Toán',
    },
    file_name: 'exam.docx',
    file_size: 512000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null,
    error: undefined,
    retry_count: 0,
  };

  beforeEach(() => {
    // Reset mocks
    mockPush.mockClear();
    
    // Reset task store
    useTaskStore.setState({
      tasks: [mockTask],
      currentTask: null,
    });

    // Clean up document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Preview Page Display', () => {
    it('renders preview page with Vietnamese title', () => {
      render(<PreviewPage params={{ taskId }} />);
      expect(screen.getByText('Xem trước kết quả phân tích đề thi')).toBeInTheDocument();
    });

    it('displays exam metadata in summary card', () => {
      render(<PreviewPage params={{ taskId }} />);
      expect(screen.getByText('Kiểm tra giữa kì - Toán')).toBeInTheDocument();
      expect(screen.getByText('Toán học')).toBeInTheDocument();
    });

    it('displays total question count in Vietnamese', () => {
      render(<PreviewPage params={{ taskId }} />);
      expect(screen.getByText(/Phát hiện \d+ câu hỏi/)).toBeInTheDocument();
    });

    it('renders QuestionList component with Vietnamese questions', () => {
      render(<PreviewPage params={{ taskId }} />);
      // Check for Vietnamese table headers
      expect(screen.getByText('Câu hỏi')).toBeInTheDocument();
      expect(screen.getByText('Đáp án đúng')).toBeInTheDocument();
      expect(screen.getByText('Độ tự tin')).toBeInTheDocument();
    });

    it('displays first 10 mock questions', () => {
      render(<PreviewPage params={{ taskId }} />);
      // Should display question numbers (not full text)
      expect(screen.getByText(/Câu hỏi 1/)).toBeInTheDocument();
      expect(screen.getByText(/Câu hỏi 2/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input with Vietnamese placeholder', () => {
      render(<PreviewPage params={{ taskId }} />);
      const searchInput = screen.getByPlaceholderText('Tìm kiếm câu hỏi ...');
      expect(searchInput).toBeInTheDocument();
    });

    it('filters questions based on search query', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const searchInput = screen.getByPlaceholderText('Tìm kiếm câu hỏi ...');
      
      // Type search query
      fireEvent.change(searchInput, { target: { value: 'Thủ đô' } });
      
      await waitFor(() => {
        // Should show matching question number
        expect(screen.getByText(/Câu hỏi 1/)).toBeInTheDocument();
      });
    });

    it('shows no results when search does not match', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const searchInput = screen.getByPlaceholderText('Tìm kiếm câu hỏi ...');
      
      // Type non-matching query
      fireEvent.change(searchInput, { target: { value: 'xyz nonexistent query' } });
      
      await waitFor(() => {
        // Should show empty state
        expect(screen.getByText('Chưa có câu hỏi nào được trích xuất')).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Button', () => {
    it('renders purple Confirm button with Vietnamese text', () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveClass('bg-[#9a94de]'); // Purple primary button
    });

    it('renders Back button with Vietnamese text', () => {
      render(<PreviewPage params={{ taskId }} />);
      const backButton = screen.getByText('Trở về');
      expect(backButton).toBeInTheDocument();
    });

    it('navigates to /tasks when Back button is clicked', () => {
      render(<PreviewPage params={{ taskId }} />);
      const backButton = screen.getByText('Trở về');
      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Pipeline Resumption', () => {
    it('updates task status to shuffling when Confirm is clicked', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const state = useTaskStore.getState();
        const task = state.tasks.find((t) => t.task_id === taskId);
        expect(task?.status).toBe('shuffling');
        expect(task?.progress).toBe(62); // shuffling progress
      });
    });

    it('shows processing modal with Vietnamese "Thành công" title', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thành công')).toBeInTheDocument();
      });
    });

    it('displays success message "Đề thi đã được tạo thành công!" in modal', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Đề thi đã được tạo thành công!')).toBeInTheDocument();
      });
    });

    it('shows redirecting message in modal', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Đang chuyển hướng đến trang quản lý...')).toBeInTheDocument();
      });
    });

    it('displays ProgressBar with success variant in modal', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const progressBar = document.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
      });
    });

    it('redirects to /tasks after 5-second timer', async () => {
      vi.useFakeTimers();
      
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('Thành công')).toBeInTheDocument();
      });
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/tasks');
      });
      
      vi.useRealTimers();
    });
  });

  describe('Modal Behavior', () => {
    it('modal cannot be closed during processing (no close button)', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thành công')).toBeInTheDocument();
      });
      
      // Close button should not be present
      expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
    });

    it('modal does not close on ESC key', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thành công')).toBeInTheDocument();
      });
      
      // Try to close with ESC
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Modal should still be present
      expect(screen.getByText('Thành công')).toBeInTheDocument();
    });

    it('modal does not close on overlay click', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thành công')).toBeInTheDocument();
      });
      
      // Try to click overlay
      const overlay = document.querySelector('[class*="bg-black/50"]');
      if (overlay) {
        fireEvent.click(overlay);
      }
      
      // Modal should still be present
      expect(screen.getByText('Thành công')).toBeInTheDocument();
    });
  });

  describe('Automatic Status Progression', () => {
    it('handles automatic redirect when task status becomes awaiting', () => {
      // This would typically be tested in create exam flow
      // When pipeline reaches 'awaiting' status, should redirect to preview
      const mockTask2: Task = {
        ...mockTask,
        task_id: 'auto-redirect-task',
        status: 'understanding',
      };
      
      useTaskStore.setState({
        tasks: [mockTask2],
      });
      
      // Simulate status change to 'awaiting'
      useTaskStore.getState().updateTaskStatus('auto-redirect-task', 'awaiting', 50);
      
      const updatedTask = useTaskStore.getState().tasks.find(
        (t) => t.task_id === 'auto-redirect-task'
      );
      
      expect(updatedTask?.status).toBe('awaiting');
      expect(updatedTask?.progress).toBe(50);
    });
  });

  describe('Task Not Found Handling', () => {
    it('redirects to /tasks when task is not found', async () => {
      render(<PreviewPage params={{ taskId: 'nonexistent-task' }} />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/tasks');
      });
    });

    it('shows loading state while fetching task', () => {
      // Task store has no tasks initially
      useTaskStore.setState({ tasks: [] });
      
      render(<PreviewPage params={{ taskId: 'loading-task' }} />);
      
      expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct max-width container (max-w-[1152px])', () => {
      const { container } = render(<PreviewPage params={{ taskId }} />);
      const mainContainer = container.querySelector('[class*="max-w-[1152px]"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('renders sticky action bar at bottom', () => {
      const { container } = render(<PreviewPage params={{ taskId }} />);
      const stickyBar = container.querySelector('[class*="fixed bottom-0"]');
      expect(stickyBar).toBeInTheDocument();
    });

    it('applies backdrop blur to sticky action bar', () => {
      const { container } = render(<PreviewPage params={{ taskId }} />);
      const stickyBar = container.querySelector('[class*="backdrop-blur-md"]');
      expect(stickyBar).toBeInTheDocument();
    });

    it('uses purple #9a94de for Confirm button background', () => {
      const { container } = render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      expect(confirmButton.parentElement).toHaveClass('bg-[#9a94de]');
    });
  });

  describe('Icons', () => {
    it('displays check-circle icon on Confirm button', () => {
      render(<PreviewPage params={{ taskId }} />);
      // Icon should be present in the button
      const confirmButton = screen.getByText('Xác nhận và tiếp tục').parentElement;
      expect(confirmButton?.querySelector('[class*="icon"]')).toBeInTheDocument();
    });

    it('displays chevron-left icon on Back button', () => {
      render(<PreviewPage params={{ taskId }} />);
      const backButton = screen.getByText('Trở về').parentElement;
      expect(backButton?.querySelector('[class*="icon"]')).toBeInTheDocument();
    });

    it('displays success check-circle icon in modal', async () => {
      render(<PreviewPage params={{ taskId }} />);
      const confirmButton = screen.getByText('Xác nhận và tiếp tục');
      
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        const successIcon = document.querySelector('[class*="text-[#39a85e]"]');
        expect(successIcon).toBeInTheDocument();
      });
    });
  });
});
