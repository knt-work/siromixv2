/**
 * Create Exam Form Integration Tests
 * 
 * End-to-end tests for the complete exam creation flow with validation,
 * task creation, and pipeline simulation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils';
import userEvent from '@testing-library/user-event';
import CreateExamPage from '@/app/exams/create/page';
import { useAuthStore } from '@/lib/state/auth-store';
import { useTaskStore } from '@/lib/state/task-store';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Create Exam Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup authenticated user
    useAuthStore.setState({
      user: {
        user_id: 'test-user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: null,
        role: 'professor',
        created_at: new Date().toISOString(),
      },
      isAuthenticated: true,
    });

    // Clear task store
    useTaskStore.setState({
      tasks: [],
      currentTask: null,
      taskLogs: {},
    });
  });

  describe('Page Rendering', () => {
    it('renders page title in Vietnamese', () => {
      render(<CreateExamPage />);
      expect(screen.getByText('Tạo Đề Thi Mới')).toBeInTheDocument();
    });

    it('renders page subtitle in Vietnamese', () => {
      render(<CreateExamPage />);
      expect(
        screen.getByText('Cung cấp thông tin đề thi và tải lên file Word để bắt đầu xử lý.')
      ).toBeInTheDocument();
    });

    it('renders all form fields with Vietnamese labels', () => {
      render(<CreateExamPage />);
      expect(screen.getByText('Năm học')).toBeInTheDocument();
      expect(screen.getByText('Tên kì thi')).toBeInTheDocument();
      expect(screen.getByText('Môn học')).toBeInTheDocument();
      expect(screen.getByText('Thời gian thi (phút)')).toBeInTheDocument();
      expect(screen.getByText('Số lượng mã đề')).toBeInTheDocument();
      expect(screen.getByText('Ghi chú')).toBeInTheDocument();
      expect(screen.getByText('Tải lên file đề thi')).toBeInTheDocument();
    });

    it('renders submit button with Vietnamese text', () => {
      render(<CreateExamPage />);
      expect(screen.getByRole('button', { name: /Trộn đề thi ngay/i })).toBeInTheDocument();
    });

    it('renders purple submit button', () => {
      render(<CreateExamPage />);
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      expect(submitButton).toHaveClass('bg-brand-primary');
    });
  });

  describe('Form Validation', () => {
    it('shows Vietnamese error for empty academic year', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Vui lòng chọn năm học/i)).toBeInTheDocument();
      });
    });

    it('shows Vietnamese error for empty exam name', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      // Fill academic year
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập tên kì thi/i)).toBeInTheDocument();
      });
    });

    it('shows Vietnamese error for empty subject', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập môn học/i)).toBeInTheDocument();
      });
    });

    it('shows Vietnamese error for invalid duration', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.type(durationInput, '-10');
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Thời gian phải là số dương/i)).toBeInTheDocument();
      });
    });

    it('shows Vietnamese error for invalid versions count', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '0');
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Số đề phải từ 1 đến 100/i)).toBeInTheDocument();
      });
    });

    it('shows Vietnamese error when no file is uploaded', async () => {
      const user = userEvent.setup();
      render(<CreateExamPage />);
      
      // Fill all required fields
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Kiểm tra giữa kỳ');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Toán');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '90');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '4');
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Vui lòng tải lên ít nhất một file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Submission', () => {
    it('creates task with correct metadata', async () => {
      const user = userEvent.setup();
      const { container } = render(<CreateExamPage />);
      
      // Fill all fields
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Kiểm tra giữa kỳ I - Khối 10');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Toán');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '90');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '4');
      
      const notesTextarea = screen.getByLabelText('Ghi chú');
      await user.type(notesTextarea, 'Đề thi cần có phần tự luận');
      
      // Upload file
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'exam.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      await user.upload(fileInput, file);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const tasks = useTaskStore.getState().tasks;
        expect(tasks.length).toBe(1);
        expect(tasks[0].metadata.exam_name).toBe('Kiểm tra giữa kỳ I - Khối 10');
        expect(tasks[0].metadata.subject).toBe('Toán');
        expect(tasks[0].metadata.duration_minutes).toBe(90);
        expect(tasks[0].metadata.num_versions).toBe(4);
        expect(tasks[0].metadata.notes).toBe('Đề thi cần có phần tự luận');
      });
    });

    it('shows success notification in Vietnamese', async () => {
      const user = userEvent.setup();
      const { container } = render(<CreateExamPage />);
      
      // Fill form and submit
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Test Exam');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Math');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '60');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '2');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'exam.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      await user.upload(fileInput, file);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(
          screen.getByText(/Đã bắt đầu xử lý đề thi — theo dõi tiến trình trong Quản lý tác vụ/i)
        ).toBeInTheDocument();
      });
    });

    it('redirects to preview page after submission', async () => {
      const user = userEvent.setup();
      const { container } = render(<CreateExamPage />);
      
      // Fill form and submit
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Test Exam');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Math');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '60');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '2');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'exam.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      await user.upload(fileInput, file);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const tasks = useTaskStore.getState().tasks;
        expect(tasks.length).toBe(1);
        const taskId = tasks[0].task_id;
        expect(mockPush).toHaveBeenCalledWith(`/exams/preview/${taskId}`);
      }, { timeout: 3000 });
    });

    it('task appears in task store', async () => {
      const user = userEvent.setup();
      const { container } = render(<CreateExamPage />);
      
      // Fill and submit
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Test Exam');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Math');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '60');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '2');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'exam.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      await user.upload(fileInput, file);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const tasks = useTaskStore.getState().tasks;
        expect(tasks.length).toBeGreaterThan(0);
        expect(tasks[0].status).toBe('pending');
        expect(tasks[0].user_id).toBe('test-user-123');
        expect(tasks[0].file_name).toBe('exam.docx');
      });
    });
  });

  describe('Disabled States', () => {
    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      const { container } = render(<CreateExamPage />);
      
      // Fill form
      const academicYearSelect = screen.getByLabelText('Năm học') as HTMLSelectElement;
      await user.selectOptions(academicYearSelect, '2026-2027');
      
      const examNameInput = screen.getByLabelText('Tên kì thi');
      await user.type(examNameInput, 'Test');
      
      const subjectInput = screen.getByLabelText('Môn học');
      await user.type(subjectInput, 'Math');
      
      const durationInput = screen.getByLabelText('Thời gian thi (phút)');
      await user.clear(durationInput);
      await user.type(durationInput, '60');
      
      const versionsInput = screen.getByLabelText('Số lượng mã đề');
      await user.clear(versionsInput);
      await user.type(versionsInput, '2');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'exam.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      await user.upload(fileInput, file);
      
      const submitButton = screen.getByRole('button', { name: /Trộn đề thi ngay/i });
      await user.click(submitButton);
      
      // Button should be disabled immediately after click
      expect(submitButton).toBeDisabled();
    });
  });
});
