/**
 * Badge Component Unit Tests
 * 
 * Tests all status variants, sizes, colors, and Vietnamese text rendering.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

describe('Badge Component', () => {
  describe('Status Variants', () => {
    const variants: { variant: BadgeVariant; text: string; bgColor: string; textColor: string }[] = [
      { variant: 'pending', text: 'Chờ xử lý', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
      { variant: 'extracting', text: 'Đang trích xuất', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      { variant: 'understanding', text: 'Đang phân tích', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      { variant: 'awaiting', text: 'Chờ xác nhận', bgColor: 'bg-[#fcb831]/10', textColor: 'text-[#C98703]' },
      { variant: 'shuffling', text: 'Đang trộn đề', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      { variant: 'generating', text: 'Đang tạo đề', bgColor: 'bg-[#9a94de]/10', textColor: 'text-[#9a94de]' },
      { variant: 'completed', text: 'Hoàn thành', bgColor: 'bg-[#39a85e]/10', textColor: 'text-[#39a85e]' },
      { variant: 'failed', text: 'Thất bại', bgColor: 'bg-[#d3595e]/10', textColor: 'text-[#d3595e]' },
    ];

    variants.forEach(({ variant, text }) => {
      it(`should render ${variant} variant with correct Vietnamese text`, () => {
        render(<Badge variant={variant} />);
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it(`should render ${variant} variant with correct aria-label`, () => {
        render(<Badge variant={variant} />);
        const badge = screen.getByLabelText(`Status: ${text}`);
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    it('should render small size with correct classes', () => {
      const { container } = render(<Badge variant="pending" size="sm" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('px-2');
      expect(badge?.className).toContain('py-0.5');
      expect(badge?.className).toContain('text-xs');
    });

    it('should render medium size with correct classes', () => {
      const { container } = render(<Badge variant="pending" size="md" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('px-3');
      expect(badge?.className).toContain('py-1');
      expect(badge?.className).toContain('text-sm');
    });

    it('should render large size with correct classes', () => {
      const { container } = render(<Badge variant="pending" size="lg" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('px-4');
      expect(badge?.className).toContain('py-1.5');
      expect(badge?.className).toContain('text-base');
    });

    it('should use medium size by default', () => {
      const { container } = render(<Badge variant="pending" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('px-3');
      expect(badge?.className).toContain('text-sm');
    });
  });

  describe('Custom Children', () => {
    it('should render custom children text instead of default', () => {
      render(<Badge variant="pending">Custom Text</Badge>);
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
      expect(screen.queryByText('Chờ xử lý')).not.toBeInTheDocument();
    });

    it('should still render correct aria-label with custom children', () => {
      render(<Badge variant="completed">Done</Badge>);
      const badge = screen.getByLabelText('Status: Hoàn thành');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have rounded-full class', () => {
      const { container } = render(<Badge variant="pending" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('rounded-full');
    });

    it('should have font-medium class', () => {
      const { container } = render(<Badge variant="pending" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('font-medium');
    });

    it('should have inline-flex class', () => {
      const { container } = render(<Badge variant="pending" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('inline-flex');
    });

    it('should apply custom className', () => {
      const { container } = render(<Badge variant="pending" className="custom-class" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('custom-class');
    });
  });

  describe('Color Mapping', () => {
    it('should use gray colors for pending status', () => {
      const { container } = render(<Badge variant="pending" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-gray-100');
      expect(badge?.className).toContain('text-gray-700');
    });

    it('should use purple colors for processing statuses', () => {
      const processingVariants: BadgeVariant[] = ['extracting', 'understanding', 'shuffling', 'generating'];
      
      processingVariants.forEach((variant) => {
        const { container } = render(<Badge variant={variant} />);
        const badge = container.querySelector('span');
        expect(badge?.className).toContain('bg-[#9a94de]/10');
        expect(badge?.className).toContain('text-[#9a94de]');
      });
    });

    it('should use yellow colors for awaiting status', () => {
      const { container } = render(<Badge variant="awaiting" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-[#fcb831]/10');
      expect(badge?.className).toContain('text-[#C98703]');
    });

    it('should use green colors for completed status', () => {
      const { container } = render(<Badge variant="completed" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-[#39a85e]/10');
      expect(badge?.className).toContain('text-[#39a85e]');
    });

    it('should use red colors for failed status', () => {
      const { container } = render(<Badge variant="failed" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-[#d3595e]/10');
      expect(badge?.className).toContain('text-[#d3595e]');
    });
  });
});
