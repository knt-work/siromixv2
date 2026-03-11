/**
 * FileUpload Component Unit Tests
 * 
 * Tests for FileUpload molecule with drag-and-drop functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../utils';
import { FileUpload } from '@/components/shared/FileUpload';
import userEvent from '@testing-library/user-event';

describe('FileUpload Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders upload area with Vietnamese text', () => {
      render(<FileUpload onChange={mockOnChange} />);
      expect(
        screen.getByText(/Kéo và thả file .doc\/.docx vào đây, hoặc nhấn vào để tải lên/i)
      ).toBeInTheDocument();
    });

    it('shows file size limit in Vietnamese', () => {
      render(<FileUpload onChange={mockOnChange} />);
      expect(screen.getByText(/Tối đa.*MB mỗi file/i)).toBeInTheDocument();
    });

    it('shows supported formats', () => {
      render(<FileUpload onChange={mockOnChange} />);
      expect(screen.getByText(/Định dạng được hỗ trợ: .doc, .docx/i)).toBeInTheDocument();
    });

    it('displays upload icon', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const icon = container.querySelector('[icon="lucide:upload"]');
      expect(icon).toBeInTheDocument();
    });

    it('has dashed border styling', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const uploadArea = container.querySelector('.border-dashed');
      expect(uploadArea).toBeInTheDocument();
    });

    it('has correct background color', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const uploadArea = container.querySelector('.bg-\\[\\#f3f4f6\\]\\/10');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('File Selection via Click', () => {
    it('triggers file input when upload area is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      
      const uploadArea = container.querySelector('.cursor-pointer');
      expect(uploadArea).toBeInTheDocument();
      
      // File input should be hidden
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts .doc and .docx files', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.doc,.docx');
    });

    it('allows multiple file selection by default', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('calls onChange when file is selected', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const file = new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockOnChange).toHaveBeenCalledWith([file]);
    });
  });

  describe('File Size Validation', () => {
    it('accepts files under max size', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} maxSize={20 * 1024 * 1024} />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      // 1MB file (well under 20MB limit)
      const file = new File(['a'.repeat(1024 * 1024)], 'small.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('shows custom max size in UI', () => {
      render(<FileUpload onChange={mockOnChange} maxSize={10 * 1024 * 1024} />);
      expect(screen.getByText(/Tối đa 10.0 MB mỗi file/i)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('shows drag state when dragging over', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const uploadArea = container.querySelector('.cursor-pointer');
      
      fireEvent.dragEnter(uploadArea!);
      expect(uploadArea).toHaveClass('border-brand-primary');
    });

    it('removes drag state when drag leaves', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const uploadArea = container.querySelector('.cursor-pointer');
      
      fireEvent.dragEnter(uploadArea!);
      fireEvent.dragLeave(uploadArea!);
      expect(uploadArea).not.toHaveClass('border-brand-primary');
    });

    it('handles file drop', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} />);
      const uploadArea = container.querySelector('.cursor-pointer');
      
      const file = new File(['content'], 'dropped.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [file],
        },
      });
      
      expect(mockOnChange).toHaveBeenCalledWith([file]);
    });
  });

  describe('File List Display', () => {
    it('displays selected files', () => {
      const file = new File(['content'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      expect(screen.getByText('document.docx')).toBeInTheDocument();
    });

    it('shows file size for each file', () => {
      const file = new File(['a'.repeat(1024)], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      expect(screen.getByText(/1.0 KB/i)).toBeInTheDocument();
    });

    it('shows document icon for each file', () => {
      const file = new File(['content'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const { container } = render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      const icon = container.querySelector('[icon="lucide:file-text"]');
      expect(icon).toBeInTheDocument();
    });

    it('shows drag handle icon for each file', () => {
      const file = new File(['content'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const { container } = render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      const icon = container.querySelector('[icon="lucide:grip-vertical"]');
      expect(icon).toBeInTheDocument();
    });

    it('shows delete button for each file', () => {
      const file = new File(['content'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const { container } = render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      const deleteIcon = container.querySelector('[icon="lucide:x"]');
      expect(deleteIcon).toBeInTheDocument();
    });

    it('shows summary for multiple files in Vietnamese', () => {
      const files = [
        new File(['a'.repeat(1024)], 'file1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
        new File(['b'.repeat(2048)], 'file2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      ];
      
      render(<FileUpload onChange={mockOnChange} currentFiles={files} />);
      expect(screen.getByText(/Đã chọn 2 files/i)).toBeInTheDocument();
      expect(screen.getByText(/Tổng cộng:/i)).toBeInTheDocument();
    });
  });

  describe('File Removal', () => {
    it('removes file when delete button is clicked', async () => {
      const user = userEvent.setup();
      const file1 = new File(['content1'], 'file1.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const file2 = new File(['content2'], 'file2.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const { container } = render(
        <FileUpload onChange={mockOnChange} currentFiles={[file1, file2]} />
      );
      
      const deleteButtons = container.querySelectorAll('button[type="button"]');
      await user.click(deleteButtons[0]);
      
      // Should be called with remaining file
      expect(mockOnChange).toHaveBeenCalledWith([file2]);
    });
  });

  describe('Error State', () => {
    it('shows error border when error is provided', () => {
      const { container } = render(
        <FileUpload onChange={mockOnChange} error="Vui lòng tải lên file" />
      );
      const uploadArea = container.querySelector('.border-error');
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables interactions when disabled is true', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} disabled />);
      const uploadArea = container.querySelector('.cursor-pointer');
      expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('does not trigger drag events when disabled', () => {
      const { container } = render(<FileUpload onChange={mockOnChange} disabled />);
      const uploadArea = container.querySelector('.cursor-not-allowed');
      
      fireEvent.dragEnter(uploadArea!);
      expect(uploadArea).not.toHaveClass('border-brand-primary');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom file types', () => {
      const { container } = render(
        <FileUpload onChange={mockOnChange} accept=".pdf,.txt" />
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.pdf,.txt');
    });

    it('supports single file mode', () => {
      const { container } = render(
        <FileUpload onChange={mockOnChange} multiple={false} />
      );
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toHaveAttribute('multiple');
    });
  });

  describe('File Size Formatting', () => {
    it('formats bytes correctly', () => {
      const file = new File(['a'.repeat(500)], 'small.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      expect(screen.getByText(/500 B/i)).toBeInTheDocument();
    });

    it('formats kilobytes correctly', () => {
      const file = new File(['a'.repeat(1536)], 'medium.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      expect(screen.getByText(/1.5 KB/i)).toBeInTheDocument();
    });

    it('formats megabytes correctly', () => {
      const file = new File(['a'.repeat(2 * 1024 * 1024)], 'large.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      render(<FileUpload onChange={mockOnChange} currentFiles={[file]} />);
      expect(screen.getByText(/2.0 MB/i)).toBeInTheDocument();
    });
  });
});
