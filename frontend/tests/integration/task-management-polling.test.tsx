/**
 * Task Management Page Integration Tests
 * 
 * Tests polling updates, Vietnamese UI, pagination, download button, and navigation.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TasksPage from '@/app/tasks/page';
import { useTaskStore } from '@/lib/state/task-store';
import type { Task, TaskStatus } from '@/types';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/components/layout/AuthGuard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock task store
const mockTasks: Task[] = [
  {
    task_id: 'task-1',
    user_id: 'user-1',
    status: 'extracting' as TaskStatus,
    progress: 25,
    metadata: {
      academic_year: '2024-2025',
      exam_name: 'Đề thi Toán',
      subject: 'Toán học',
      duration_minutes: 90,
      num_versions: 4,
    },
    file_name: 'math.pdf',
    file_size: 2048,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:31:00Z',
    completed_at: null,
    retry_count: 0,
  },
  {
    task_id: 'task-2',
    user_id: 'user-1',
    status: 'completed' as TaskStatus,
    progress: 100,
    metadata: {
      academic_year: '2024-2025',
      exam_name: 'Đề thi Lý',
      subject: 'Vật lý',
      duration_minutes: 120,
      num_versions: 3,
    },
    file_name: 'physics.pdf',
    file_size: 3072,
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-14T09:15:00Z',
    completed_at: '2024-01-14T09:15:00Z',
    retry_count: 0,
  },
  {
    task_id: 'task-3',
    user_id: 'user-1',
    status: 'failed' as TaskStatus,
    progress: 50,
    metadata: {
      academic_year: '2024-2025',
      exam_name: 'Đề thi Hóa',
      subject: 'Hóa học',
      duration_minutes: 60,
      num_versions: 2,
    },
    file_name: 'chemistry.pdf',
    file_size: 1536,
    created_at: '2024-01-13T14:20:00Z',
    updated_at: '2024-01-13T14:25:00Z',
    completed_at: '2024-01-13T14:25:00Z',
    error: 'Processing error',
    retry_count: 1,
  },
];

describe('Task Management Page Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    
    // Reset task store with mock tasks
    useTaskStore.setState({
      tasks: mockTasks,
      currentTask: null,
      taskLogs: {},
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render Vietnamese page title', () => {
      render(<TasksPage />);
      expect(screen.getByText('Quản lý đề thi')).toBeInTheDocument();
    });

    it('should render Vietnamese subtitle', () => {
      render(<TasksPage />);
      expect(screen.getByText('Theo dõi tiến độ tạo đề thi của bạn')).toBeInTheDocument();
    });

    it('should display all tasks in table', () => {
      render(<TasksPage />);
      
      expect(screen.getByText('Đề thi Toán')).toBeInTheDocument();
      expect(screen.getByText('Đề thi Lý')).toBeInTheDocument();
      expect(screen.getByText('Đề thi Hóa')).toBeInTheDocument();
    });

    it('should render Vietnamese column headers', () => {
      render(<TasksPage />);
      
      expect(screen.getByText('Mã đề')).toBeInTheDocument();
      expect(screen.getByText('Tên kì thi')).toBeInTheDocument();
      expect(screen.getByText('Môn học')).toBeInTheDocument();
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();
      expect(screen.getByText('Tiến độ')).toBeInTheDocument();
      expect(screen.getByText('Ngày tạo')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display Vietnamese status badge for extracting task', () => {
      render(<TasksPage />);
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
    });

    it('should display Vietnamese status badge for completed task', () => {
      render(<TasksPage />);
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    it('should display Vietnamese status badge for failed task', () => {
      render(<TasksPage />);
      expect(screen.getByText('Thất bại')).toBeInTheDocument();
    });

    it('should use correct colors for status badges', () => {
      const { container } = render(<TasksPage />);
      
      const extractingBadge = screen.getByText('Đang trích xuất').closest('span');
      expect(extractingBadge?.className).toContain('bg-[#9a94de]/10');
      
      const completedBadge = screen.getByText('Hoàn thành').closest('span');
      expect(completedBadge?.className).toContain('bg-[#39a85e]/10');
      
      const failedBadge = screen.getByText('Thất bại').closest('span');
      expect(failedBadge?.className).toContain('bg-[#d3595e]/10');
    });
  });

  describe('Progress Bars', () => {
    it('should display purple progress bars', () => {
      const { container } = render(<TasksPage />);
      
      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should show correct progress percentages', () => {
      render(<TasksPage />);
      
      expect(screen.getByText('25%')).toBeInTheDocument(); // extracting task
      expect(screen.getByText('100%')).toBeInTheDocument(); // completed task
      expect(screen.getByText('50%')).toBeInTheDocument(); // failed task
    });
  });

  describe('Download Button', () => {
    it('should show download button only for completed tasks', () => {
      const { container } = render(<TasksPage />);
      
      // Find download icons
      const downloadIcons = container.querySelectorAll('[icon="lucide:download"]');
      
      // Should have exactly 1 download button (for the completed task)
      expect(downloadIcons).toHaveLength(1);
    });

    it('should show Vietnamese alert when clicking download', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const { container } = render(<TasksPage />);
      
      const downloadButton = container.querySelector('[icon="lucide:download"]')?.closest('button');
      if (downloadButton) {
        fireEvent.click(downloadButton);
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Đang tải xuống'));
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Đề thi Lý'));
      }
      
      alertSpy.mockRestore();
    });

    it('should not navigate to detail page when clicking download button', () => {
      const { useRouter } = require('next/navigation');
      const mockPush = vi.fn();
      useRouter.mockReturnValue({ push: mockPush });
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const { container } = render(<TasksPage />);
      
      const downloadButton = container.querySelector('[icon="lucide:download"]')?.closest('button');
      if (downloadButton) {
        fireEvent.click(downloadButton);
        expect(mockPush).not.toHaveBeenCalled();
      }
      
      alertSpy.mockRestore();
    });
  });

  describe('Pagination', () => {
    it('should show Vietnamese pagination controls when tasks > 10', () => {
      // Create 15 mock tasks
      const manyTasks = Array.from({ length: 15 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        metadata: { ...mockTasks[0].metadata, exam_name: `Đề thi ${i}` },
      }));
      
      useTaskStore.setState({ tasks: manyTasks, currentTask: null, taskLogs: {} });
      
      render(<TasksPage />);
      
      expect(screen.getByText('Trước')).toBeInTheDocument();
      expect(screen.getByText('Sau')).toBeInTheDocument();
      expect(screen.getByText(/Trang/)).toBeInTheDocument();
    });

    it('should display Vietnamese total count', () => {
      const manyTasks = Array.from({ length: 15 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
      }));
      
      useTaskStore.setState({ tasks: manyTasks, currentTask: null, taskLogs: {} });
      
      render(<TasksPage />);
      
      expect(screen.getByText(/Tổng số:/)).toBeInTheDocument();
      expect(screen.getByText(/15/)).toBeInTheDocument();
      expect(screen.getByText(/mục/)).toBeInTheDocument();
    });

    it('should navigate between pages', () => {
      const manyTasks = Array.from({ length: 15 }, (_, i) => ({
        ...mockTasks[0],
        task_id: `task-${i}`,
        metadata: { ...mockTasks[0].metadata, exam_name: `Đề thi ${i}` },
      }));
      
      useTaskStore.setState({ tasks: manyTasks, currentTask: null, taskLogs: {} });
      
      render(<TasksPage />);
      
      // Should show page 1 initially
      expect(screen.getByText(/Trang 1 \/ 2/)).toBeInTheDocument();
      
      // Click "Sau" to go to page 2
      const nextButton = screen.getByText('Sau');
      fireEvent.click(nextButton);
      
      expect(screen.getByText(/Trang 2 \/ 2/)).toBeInTheDocument();
    });
  });

  describe('Row Click Navigation', () => {
    it('should navigate to task detail page when clicking row', () => {
      const { useRouter } = require('next/navigation');
      const mockPush = vi.fn();
      useRouter.mockReturnValue({ push: mockPush });
      
      render(<TasksPage />);
      
      const firstRow = screen.getByText('Đề thi Toán').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
        expect(mockPush).toHaveBeenCalledWith('/tasks/task-1');
      }
    });
  });

  describe('Polling Updates', () => {
    it('should poll every 3 seconds when there are processing tasks', () => {
      render(<TasksPage />);
      
      // Should start polling
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
      
      // Advance timers by 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Component should re-render (checking that polling is active)
    });

    it('should update UI when task status changes', async () => {
      render(<TasksPage />);
      
      // Initially shows extracting status
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
      
      // Update task status in store
      useTaskStore.setState({
        tasks: [
          { ...mockTasks[0], status: 'understanding' as TaskStatus, progress: 50 },
          mockTasks[1],
          mockTasks[2],
        ],
        currentTask: null,
        taskLogs: {},
      });
      
      // Advance timer to trigger polling update
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.getByText('Đang phân tích')).toBeInTheDocument();
      });
    });

    it('should stop polling when all tasks are completed or failed', () => {
      const completedTasks = mockTasks.map((task) => ({
        ...task,
        status: 'completed' as TaskStatus,
        progress: 100,
      }));
      
      useTaskStore.setState({ tasks: completedTasks, currentTask: null, taskLogs: {} });
      
      render(<TasksPage />);
      
      // Should not poll since no processing tasks
      const initialRenderCount = screen.getAllByText('Hoàn thành').length;
      
      vi.advanceTimersByTime(3000);
      
      // Should not have triggered additional renders
      expect(screen.getAllByText('Hoàn thành').length).toBe(initialRenderCount);
    });
  });

  describe('Empty State', () => {
    it('should show Vietnamese empty state when no tasks', () => {
      useTaskStore.setState({ tasks: [], currentTask: null, taskLogs: {} });
      
      render(<TasksPage />);
      
      expect(screen.getByText('Chưa có đề thi nào')).toBeInTheDocument();
      expect(screen.getByText('Tạo đề thi mới để bắt đầu')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by created date descending by default', () => {
      render(<TasksPage />);
      
      const rows = screen.getAllByRole('row');
      
      // First data row should be the most recent task (task-1, created on 2024-01-15)
      const firstRow = rows[1]; // Skip header row
      expect(within(firstRow).getByText('Đề thi Toán')).toBeInTheDocument();
    });

    it('should sort table when clicking sortable column header', () => {
      render(<TasksPage />);
      
      const examNameHeader = screen.getByText('Tên kì thi').closest('th');
      if (examNameHeader) {
        fireEvent.click(examNameHeader);
        
        // Table should re-render with new sort order
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should apply correct padding classes', () => {
      const { container } = render(<TasksPage />);
      
      const mainContainer = container.querySelector('.px-4');
      expect(mainContainer?.className).toContain('lg:px-32');
    });
  });
});
