/**
 * ExamMetadata Component Unit Tests
 * 
 * Phase 8 - T097: Tests for ExamMetadata section component.
 * Tests Vietnamese labels, grid layout, Card styling, file display, and notes.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../utils';
import { ExamMetadata } from '@/components/sections/ExamMetadata';
import type { ExamMetadata as ExamMetadataType } from '@/types';

const mockMetadata: ExamMetadataType = {
  academic_year: '2024-2025',
  exam_name: 'Kiểm tra giữa kỳ',
  subject: 'Toán học',
  duration_minutes: 90,
  num_versions: 4,
  notes: 'Học sinh được sử dụng máy tính cầm tay',
};

describe('ExamMetadata Component', () => {
  describe('Vietnamese Labels Rendering', () => {
    it('renders all Vietnamese metadata labels', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      
      // Check all uppercase labels
      expect(screen.getByText('NĂM HỌC')).toBeInTheDocument();
      expect(screen.getByText('TÊN KÌ THI')).toBeInTheDocument();
      expect(screen.getByText('MÔN HỌC')).toBeInTheDocument();
      expect(screen.getByText('THỜI GIAN LÀM BÀI')).toBeInTheDocument();
      expect(screen.getByText('SỐ LƯỢNG MÃ ĐỀ')).toBeInTheDocument();
    });

    it('renders section header "Thông tin kì thi"', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('Thông tin kì thi')).toBeInTheDocument();
    });

    it('renders notes label when notes exist', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('GHI CHÚ')).toBeInTheDocument();
    });

    it('renders file label when fileName is provided', () => {
      render(<ExamMetadata metadata={mockMetadata} fileName="exam.pdf" />);
      expect(screen.getByText('CÁC FILE ĐƯỢC TẢI LÊN')).toBeInTheDocument();
    });
  });

  describe('Metadata Values Rendering', () => {
    it('renders academic year value', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('2024-2025')).toBeInTheDocument();
    });

    it('renders exam name value', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('Kiểm tra giữa kỳ')).toBeInTheDocument();
    });

    it('renders subject value', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('Toán học')).toBeInTheDocument();
    });

    it('renders duration in minutes with Vietnamese unit', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('90 phút')).toBeInTheDocument();
    });

    it('renders number of versions', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders grid with correct classes', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const grid = container.querySelector('.grid');
      
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-2');
      expect(grid?.className).toContain('gap-y-6');
    });
  });

  describe('Card Styling', () => {
    it('renders section with rounded-xl and border', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const section = container.querySelector('section');
      
      expect(section?.className).toContain('rounded-xl');
      expect(section?.className).toContain('border');
      expect(section?.className).toContain('border-[#dee1e6]');
      expect(section?.className).toContain('bg-white');
      expect(section?.className).toContain('shadow-sm');
    });

    it('renders header with bottom border', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const header = container.querySelector('.border-b');
      
      expect(header?.className).toContain('border-[#dee1e6]/40');
    });
  });

  describe('File Display', () => {
    it('renders file name with purple icon when fileName is provided', () => {
      render(<ExamMetadata metadata={mockMetadata} fileName="math_exam.pdf" />);
      
      expect(screen.getByText('math_exam.pdf')).toBeInTheDocument();
    });

    it('does not render file section when fileName is not provided', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      
      expect(screen.queryByText('CÁC FILE ĐƯỢC TẢI LÊN')).not.toBeInTheDocument();
    });

    it('renders file icon with purple color', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} fileName="exam.pdf" />);
      const icon = container.querySelector('[class*="text-[#9a94de]"]');
      
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Notes Section', () => {
    it('renders notes when provided', () => {
      render(<ExamMetadata metadata={mockMetadata} />);
      
      expect(screen.getByText('Học sinh được sử dụng máy tính cầm tay')).toBeInTheDocument();
    });

    it('does not render notes section when notes are empty', () => {
      const metadataWithoutNotes = { ...mockMetadata, notes: undefined };
      render(<ExamMetadata metadata={metadataWithoutNotes} />);
      
      expect(screen.queryByText('GHI CHÚ')).not.toBeInTheDocument();
    });

    it('renders notes in bordered container with background', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const notesContainer = container.querySelector('.bg-\\[\\#fafafb\\]');
      
      expect(notesContainer).toBeInTheDocument();
      expect(notesContainer?.className).toContain('rounded-md');
      expect(notesContainer?.className).toContain('border');
    });
  });

  describe('Responsive Design', () => {
    it('uses 2-column grid on desktop (md breakpoint)', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const grid = container.querySelector('.grid');
      
      expect(grid?.className).toContain('md:grid-cols-2');
    });

    it('uses 1-column grid on mobile', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const grid = container.querySelector('.grid');
      
      expect(grid?.className).toContain('grid-cols-1');
    });
  });

  describe('Label Formatting', () => {
    it('renders labels in uppercase', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const labels = container.querySelectorAll('.uppercase');
      
      expect(labels.length).toBeGreaterThan(0);
    });

    it('renders labels with tracking-wider', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const labels = container.querySelectorAll('.tracking-wider');
      
      expect(labels.length).toBeGreaterThan(0);
    });

    it('renders labels with gray color', () => {
      const { container } = render(<ExamMetadata metadata={mockMetadata} />);
      const labels = container.querySelectorAll('.text-\\[\\#565d6d\\]');
      
      expect(labels.length).toBeGreaterThan(0);
    });
  });
});
