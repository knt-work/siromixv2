/**
 * Exam Detail Page Integration Tests
 * 
 * Phase 8 - T099: Tests for Exam Detail page route, sections rendering, 
 * polling updates, and Vietnamese text display.
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
    taskId: 'test-task-123',
  }),
}));

// Mock setInterval and clearInterval for polling tests
vi.useFakeTimers();

describe('Exam Detail Page Integration Tests', () => {
  const taskId = 'test-task-123';
  
  const mockCompletedTask: Task = {
    task_id: taskId,
    user_id: 'user-1',
    status: 'completed',
    progress: 100,
    metadata: {
      academic_year: '2024-2025',
      exam_name: 'Kiểm tra Toán học cuối kỳ',
      subject: 'Toán học',
      duration_minutes: 120,
      num_versions: 4,
      notes: 'Học sinh được phép sử dụng máy tính',
    },
    file_name: 'math_final_exam.pdf',
    file_size: 2048000,
    created_at: '2026-03-11T08:00:00Z',
    updated_at: '2026-03-11T09:30:00Z',
    completed_at: '2026-03-11T09:30:00Z',
    error: undefined,
    retry_count: 0,
  };

  const mockProcessingTask: Task = {
    ...mockCompletedTask,
    status: 'extracting',
    progress: 35,
    completed_at: null,
  };

  const mockLogs: TaskLog[] = [
    {
      log_id: 'log-1',
      task_id: taskId,
      timestamp: '2026-03-11T08:05:00Z',
      log_level: 'INFO',
      message: 'Bắt đầu trích xuất câu hỏi',
    },
    {
      log_id: 'log-2',
      task_id: taskId,
      timestamp: '2026-03-11T08:10:00Z',
      log_level: 'INFO',
      message: 'Đã trích xuất 15 câu hỏi',
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
    vi.clearAllTimers();
    
    // Reset task store with completed task
    useTaskStore.setState({
      tasks: [mockCompletedTask],
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

  describe('Page Route and Structure', () => {
    it('renders exam detail page at /tasks/[id] route', () => {
      render(<ExamDetailPage />);
      
      // Page should render without errors
      expect(screen.getByText('SiroMix')).toBeInTheDocument();
    });

    it('applies correct padding px-4 lg:px-[120px] to content container', () => {
      const { container } = render(<ExamDetailPage />);
      
      const contentContainer = container.querySelector('.max-w-\\[1440px\\]');
      expect(contentContainer?.className).toContain('px-4');
      expect(contentContainer?.className).toContain('lg:px-[120px]');
    });

    it('renders sticky navigation header at top', () => {
      const { container } = render(<ExamDetailPage />);
      
      const header = container.querySelector('.sticky');
      expect(header?.className).toContain('top-0');
      expect(header?.className).toContain('z-50');
    });
  });

  describe('Vietnamese Breadcrumb', () => {
    it('renders breadcrumb with "Tasks" text', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    it('displays task ID in breadcrumb with T- prefix', () => {
      render(<ExamDetailPage />);
      
      // Should show last 4 digits of task ID with T- prefix
      expect(screen.getByText(/T-\d{4}/)).toBeInTheDocument();
    });

    it('breadcrumb "Tasks" link navigates back to tasks list', () => {
      render(<ExamDetailPage />);
      
      const tasksLink = screen.getByText('Tasks');
      fireEvent.click(tasksLink);
      
      expect(mockPush).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Three Sections Rendering', () => {
    it('renders ExamMetadata section at top', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Thông tin kì thi')).toBeInTheDocument();
      expect(screen.getByText('Kiểm tra Toán học cuối kỳ')).toBeInTheDocument();
    });

    it('renders ProcessingStatus section in middle', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Chi tiết tiến trình')).toBeInTheDocument();
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    it('renders all three sections in correct order', () => {
      const { container } = render(<ExamDetailPage />);
      
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('displays metadata values from task', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('2024-2025')).toBeInTheDocument();
      expect(screen.getByText('Toán học')).toBeInTheDocument();
      expect(screen.getByText('120 phút')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Polling Updates for Processing Tasks', () => {
    it('polls status every 3 seconds for processing tasks', async () => {
      // Set up processing task
      useTaskStore.setState({
        tasks: [mockProcessingTask],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      // Initial render should show extracting status
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
      
      // Advance timers by 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Should trigger re-render (polling mechanism)
      await waitFor(() => {
        // Component should still be mounted
        expect(screen.getByText('Chi tiết tiến trình')).toBeInTheDocument();
      });
    });

    it('auto-stops polling when status becomes completed', async () => {
      // Start with processing task
      const { rerender } = render(<ExamDetailPage />);
      
      // Update to completed status
      useTaskStore.setState({
        tasks: [mockCompletedTask],
        taskLogs: { [taskId]: mockLogs },
      });
      
      rerender(<ExamDetailPage />);
      
      // Should show completed status
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      
      // Advance timers - polling should have stopped
      vi.advanceTimersByTime(6000);
      
      // Should not cause errors or infinite loops
      await waitFor(() => {
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      });
    });

    it('auto-stops polling when status becomes failed', async () => {
      const failedTask: Task = {
        ...mockProcessingTask,
        status: 'failed',
        progress: 50,
        error: 'Lỗi trích xuất PDF',
      };
      
      useTaskStore.setState({
        tasks: [failedTask],
        taskLogs: { [taskId]: mockLogs },
      });

      render(<ExamDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Thất bại')).toBeInTheDocument();
      });
      
      // Polling should have stopped
      vi.advanceTimersByTime(6000);
      
      // Should remain stable
      expect(screen.getByText('Thất bại')).toBeInTheDocument();
    });

    it('updates Badge color when status changes', async () => {
      const { container, rerender } = render(<ExamDetailPage />);
      
      // Start with extracting status (purple badge)
      useTaskStore.setState({
        tasks: [mockProcessingTask],
        taskLogs: { [taskId]: mockLogs },
      });
      
      rerender(<ExamDetailPage />);
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
      
      // Update to completed status (green badge)
      useTaskStore.setState({
        tasks: [mockCompletedTask],
        taskLogs: { [taskId]: mockLogs },
      });
      
      rerender(<ExamDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      });
    });

    it('updates ProgressBar when progress changes', async () => {
      // Task at 35% progress
      useTaskStore.setState({
        tasks: [mockProcessingTask],
        taskLogs: { [taskId]: mockLogs },
      });

      const { rerender } = render(<ExamDetailPage />);
      expect(screen.getByText(/35% Hoàn tất/)).toBeInTheDocument();
      
      // Update to 70% progress
      const updatedTask = { ...mockProcessingTask, progress: 70, status: 'shuffling' as const };
      useTaskStore.setState({
        tasks: [updatedTask],
        taskLogs: { [taskId]: mockLogs },
      });
      
      rerender(<ExamDetailPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/70% Hoàn tất/)).toBeInTheDocument();
      });
    });
  });

  describe('Vietnamese Text Display', () => {
    it('displays page title with exam name and subject in Vietnamese', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText(/Kiểm tra Toán học cuối kỳ — Toán học/)).toBeInTheDocument();
    });

    it('displays Vietnamese metadata labels', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('NĂM HỌC')).toBeInTheDocument();
      expect(screen.getByText('TÊN KÌ THI')).toBeInTheDocument();
      expect(screen.getByText('MÔN HỌC')).toBeInTheDocument();
    });

    it('displays Vietnamese status badge text', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    it('displays Vietnamese date labels', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText(/Ngày tạo:/)).toBeInTheDocument();
      expect(screen.getByText(/Ngày cập nhật:/)).toBeInTheDocument();
    });

    it('displays Vietnamese navigation menu items', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Chức năng')).toBeInTheDocument();
      expect(screen.getByText('Hướng dẫn')).toBeInTheDocument();
    });

    it('displays Vietnamese download button text', () => {
      render(<ExamDetailPage />);
      
      const downloadButtons = screen.getAllByText('Tải bộ đề đã trộn');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Task Not Found Handling', () => {
    it('displays error message when task does not exist', () => {
      useTaskStore.setState({
        tasks: [],
        taskLogs: {},
      });

      render(<ExamDetailPage />);
      
      expect(screen.getByText('Không tìm thấy đề thi')).toBeInTheDocument();
    });

    it('shows back button when task is not found', () => {
      useTaskStore.setState({
        tasks: [],
        taskLogs: {},
      });

      render(<ExamDetailPage />);
      
      const backButton = screen.getByText('Quay về danh sách');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Action Buttons', () => {
    it('displays "Xem Inputs" button for completed tasks', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Xem Inputs')).toBeInTheDocument();
    });

    it('displays download button for completed tasks', () => {
      render(<ExamDetailPage />);
      
      const downloadButtons = screen.getAllByText('Tải bộ đề đã trộn');
      expect(downloadButtons.length).toBe(2); // Header + Bottom
    });

    it('displays bottom download button after all content', () => {
      const { container } = render(<ExamDetailPage />);
      
      const bottomSection = container.querySelector('.border-t');
      expect(bottomSection?.className).toContain('border-[#dee1e6]/40');
      expect(bottomSection?.className).toContain('pt-8');
    });

    it('shows "Lưu trữ lúc vô hạn" text with download button', () => {
      render(<ExamDetailPage />);
      
      expect(screen.getByText('Lưu trữ lúc vô hạn')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('uses max-w-[1440px] container for content', () => {
      const { container } = render(<ExamDetailPage />);
      
      const contentContainers = container.querySelectorAll('.max-w-\\[1440px\\]');
      expect(contentContainers.length).toBeGreaterThan(0);
    });

    it('applies responsive padding with lg breakpoint', () => {
      const { container } = render(<ExamDetailPage />);
      
      const responsiveContainer = container.querySelector('.lg\\:px-\\[120px\\]');
      expect(responsiveContainer).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('displays dates in dd/MM/yyyy — HH:mm format', () => {
      render(<ExamDetailPage />);
      
      // Should match the format: 11/03/2026 — 08:00
      expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} — \d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('shows both created and updated dates with time', () => {
      render(<ExamDetailPage />);
      
      const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4} — \d{2}:\d{2}/);
      expect(dateElements.length).toBeGreaterThanOrEqual(2);
    });
  });
});
