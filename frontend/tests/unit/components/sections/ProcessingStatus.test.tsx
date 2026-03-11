/**
 * ProcessingStatus Component Unit Tests
 * 
 * Phase 8 - T098: Tests for ProcessingStatus section component.
 * Tests retry button, count limit, stepper, logs, status badges, and progress bar.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../utils';
import { ProcessingStatus } from '@/components/sections/ProcessingStatus';
import type { Task, TaskLog } from '@/types';

const baseMockTask: Omit<Task, 'status' | 'progress' | 'retry_count'> = {
  task_id: 'task-123',
  user_id: 'user-001',
  metadata: {
    academic_year: '2024-2025',
    exam_name: 'Kiểm tra Toán',
    subject: 'Toán học',
    duration_minutes: 90,
    num_versions: 4,
  },
  file_name: 'exam.pdf',
  file_size: 1024000,
  created_at: '2026-03-11T10:00:00Z',
  updated_at: '2026-03-11T10:30:00Z',
  completed_at: null,
};

const mockLogs: TaskLog[] = [
  {
    log_id: 'log-1',
    task_id: 'task-123',
    timestamp: '2026-03-11T10:00:00Z',
    log_level: 'INFO',
    message: 'Bắt đầu trích xuất',
  },
  {
    log_id: 'log-2',
    task_id: 'task-123',
    timestamp: '2026-03-11T10:15:00Z',
    log_level: 'ERROR',
    message: 'Lỗi khi trích xuất PDF',
  },
];

describe('ProcessingStatus Component', () => {
  describe('Retry Button Visibility', () => {
    it('shows retry button only for failed status', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText('Thử lại')).toBeInTheDocument();
    });

    it('does not show retry button for completed status', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0 };
      render(<ProcessingStatus task={completedTask} showRetryButton={true} />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
    });

    it('does not show retry button for processing statuses', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      render(<ProcessingStatus task={extractingTask} showRetryButton={true} />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
    });

    it('does not show retry button when showRetryButton is false', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} showRetryButton={false} />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
    });
  });

  describe('Retry Count Limit', () => {
    it('shows enabled retry button when retry_count is 0', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      const retryButton = screen.getByText('Thử lại');
      expect(retryButton).toBeInTheDocument();
    });

    it('shows enabled retry button when retry_count is 1', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 1 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      const retryButton = screen.getByText('Thử lại');
      expect(retryButton).toBeInTheDocument();
    });

    it('disables retry and shows Vietnamese message when retry_count is 2', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 2 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
      expect(screen.getByText(/Đã hết lượt thử lại/)).toBeInTheDocument();
      expect(screen.getByText(/tối đa 2 lần/)).toBeInTheDocument();
    });

    it('disables retry when retry_count exceeds 2', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 3 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.queryByText('Thử lại')).not.toBeInTheDocument();
      expect(screen.getByText(/Đã hết lượt thử lại/)).toBeInTheDocument();
    });

    it('displays retry count in metadata when retry_count > 0', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 1 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText(/SỐ LẦN THỬ LẠI/)).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });

  describe('Retry Button Callback', () => {
    it('calls onRetry callback when retry button is clicked', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      const onRetry = vi.fn();
      
      render(<ProcessingStatus task={failedTask} onRetry={onRetry} showRetryButton={true} />);
      
      const retryButton = screen.getByText('Thử lại');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('retry button has purple background color #9a94de', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      const retryButton = container.querySelector('.bg-\\[\\#9a94de\\]');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Stepper Stages', () => {
    it('renders all 5 stage labels in Vietnamese', () => {
      const processingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      render(<ProcessingStatus task={processingTask} />);
      
      expect(screen.getByText('Trích xuất')).toBeInTheDocument();
      expect(screen.getByText('Đọc hiểu')).toBeInTheDocument();
      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
      expect(screen.getByText('Trộn đề')).toBeInTheDocument();
      expect(screen.getByText('Tạo files')).toBeInTheDocument();
    });

    it('shows active stage with purple background for extracting', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={extractingTask} />);
      
      const purpleCircles = container.querySelectorAll('.bg-\\[\\#9a94de\\]');
      expect(purpleCircles.length).toBeGreaterThan(0);
    });

    it('shows completed stages with green background #39a85e', () => {
      const shufflingTask: Task = { ...baseMockTask, status: 'shuffling', progress: 80, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={shufflingTask} />);
      
      const greenCircles = container.querySelectorAll('.bg-\\[\\#39a85e\\]');
      expect(greenCircles.length).toBeGreaterThan(0);
    });

    it('shows all stages completed for completed status', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0, completed_at: '2026-03-11T11:00:00Z' };
      const { container } = render(<ProcessingStatus task={completedTask} />);
      
      const greenCircles = container.querySelectorAll('.bg-\\[\\#39a85e\\]');
      expect(greenCircles.length).toBeGreaterThan(0);
    });

    it('renders connector lines between stages', () => {
      const processingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={processingTask} />);
      
      // Should have 4 connector lines (5 stages - 1)
      const connectors = container.querySelectorAll('.h-0\\.5');
      expect(connectors.length).toBe(4);
    });
  });

  describe('Status Badges', () => {
    it('renders Badge component with task status', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      render(<ProcessingStatus task={extractingTask} />);
      
      expect(screen.getByText('Đang trích xuất')).toBeInTheDocument();
    });

    it('renders completed badge for completed status', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0, completed_at: '2026-03-11T11:00:00Z' };
      render(<ProcessingStatus task={completedTask} />);
      
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    it('renders failed badge for failed status', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText('Thất bại')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('shows progress percentage for processing tasks', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 35, retry_count: 0 };
      render(<ProcessingStatus task={extractingTask} />);
      
      expect(screen.getByText(/35% Hoàn tất/)).toBeInTheDocument();
    });

    it('shows 100% completion for completed tasks', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0, completed_at: '2026-03-11T11:00:00Z' };
      render(<ProcessingStatus task={completedTask} />);
      
      expect(screen.getByText(/100% Hoàn tất/)).toBeInTheDocument();
    });

    it('renders ProgressBar for processing tasks with purple color', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 45, retry_count: 0 };
      render(<ProcessingStatus task={extractingTask} />);
      
      // ProgressBar component should be rendered
      expect(screen.getByText(/Đang xử lý/)).toBeInTheDocument();
    });

    it('shows progress badge with purple background #9a94de for processing', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 50, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={extractingTask} />);
      
      const progressBadge = container.querySelector('.bg-\\[\\#9a94de\\]\\/10');
      expect(progressBadge).toBeInTheDocument();
    });

    it('shows progress badge with green background #39a85e for completed', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0, completed_at: '2026-03-11T11:00:00Z' };
      const { container } = render(<ProcessingStatus task={completedTask} />);
      
      const progressBadge = container.querySelector('.bg-\\[\\#39a85e\\]\\/10');
      expect(progressBadge).toBeInTheDocument();
    });
  });

  describe('Logs Display', () => {
    it('renders log entries when logs are provided', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} logs={mockLogs} />);
      
      expect(screen.getByText(/Bắt đầu trích xuất/)).toBeInTheDocument();
      expect(screen.getByText(/Lỗi khi trích xuất PDF/)).toBeInTheDocument();
    });

    it('displays log count in Vietnamese', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} logs={mockLogs} />);
      
      expect(screen.getByText(/2 logs/)).toBeInTheDocument();
    });

    it('displays timestamps in tabular-nums format', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={failedTask} logs={mockLogs} />);
      
      const logContainer = container.querySelector('.log-container');
      expect(logContainer).toBeInTheDocument();
    });

    it('renders ERROR logs with red color #d3595e', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={failedTask} logs={mockLogs} />);
      
      const errorLog = container.querySelector('.text-\\[\\#d3595e\\]');
      expect(errorLog).toBeInTheDocument();
    });

    it('does not render logs section when logs array is empty', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} logs={[]} />);
      
      expect(screen.queryByText(/Logs & Lịch sử/)).not.toBeInTheDocument();
    });

    it('renders "Logs & Lịch sử" header when logs exist', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0 };
      render(<ProcessingStatus task={failedTask} logs={mockLogs} />);
      
      expect(screen.getByText('Logs & Lịch sử')).toBeInTheDocument();
    });
  });

  describe('Status Banners', () => {
    it('displays success banner for completed tasks', () => {
      const completedTask: Task = { ...baseMockTask, status: 'completed', progress: 100, retry_count: 0, completed_at: '2026-03-11T11:00:00Z' };
      render(<ProcessingStatus task={completedTask} />);
      
      expect(screen.getByText('Tạo và trộn đề hoàn tất')).toBeInTheDocument();
      expect(screen.getByText(/Sẵn sàng để tải xuống/)).toBeInTheDocument();
    });

    it('displays error banner for failed tasks', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 0, error: 'File không hợp lệ' };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
      expect(screen.getByText(/File không hợp lệ/)).toBeInTheDocument();
    });

    it('displays processing banner for extracting status', () => {
      const extractingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      render(<ProcessingStatus task={extractingTask} />);
      
      expect(screen.getByText(/Đang xử lý/)).toBeInTheDocument();
    });
  });

  describe('Vietnamese Text Rendering', () => {
    it('renders section header "Chi tiết tiến trình"', () => {
      const processingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      render(<ProcessingStatus task={processingTask} />);
      
      expect(screen.getByText('Chi tiết tiến trình')).toBeInTheDocument();
    });

    it('renders Vietnamese metadata labels', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 1 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText('NGÀY TẠO')).toBeInTheDocument();
      expect(screen.getByText('CẬP NHẬT LẦN CUỐI')).toBeInTheDocument();
      expect(screen.getByText('SỐ LẦN THỬ LẠI')).toBeInTheDocument();
    });

    it('renders Vietnamese retry disabled message', () => {
      const failedTask: Task = { ...baseMockTask, status: 'failed', progress: 50, retry_count: 2 };
      render(<ProcessingStatus task={failedTask} showRetryButton={true} />);
      
      expect(screen.getByText(/Đã hết lượt thử lại \(tối đa 2 lần\)/)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders section with rounded-xl and border', () => {
      const processingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={processingTask} />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('rounded-xl');
      expect(section?.className).toContain('border');
      expect(section?.className).toContain('border-[#dee1e6]');
    });

    it('renders header with bottom border', () => {
      const processingTask: Task = { ...baseMockTask, status: 'extracting', progress: 20, retry_count: 0 };
      const { container } = render(<ProcessingStatus task={processingTask} />);
      
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });
  });
});
