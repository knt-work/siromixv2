/**
 * ProgressBar Component Unit Tests
 * 
 * Tests value clamping, variants, sizes, label display, and animations.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('ProgressBar Component', () => {
  describe('Value and Max Props', () => {
    it('should render with correct initial value', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('should clamp value to 0 when negative', () => {
      const { container } = render(<ProgressBar value={-10} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should clamp value to max when exceeding', () => {
      const { container } = render(<ProgressBar value={150} max={100} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('should calculate percentage correctly with custom max', () => {
      const { container } = render(<ProgressBar value={25} max={50} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });

    it('should default max to 100', () => {
      const { container } = render(<ProgressBar value={75} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '75%' });
    });
  });

  describe('Variants', () => {
    it('should render primary variant with purple color', () => {
      const { container } = render(<ProgressBar value={50} variant="primary" />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('bg-[#9a94de]');
    });

    it('should render success variant with green color', () => {
      const { container } = render(<ProgressBar value={50} variant="success" />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('bg-[#39a85e]');
    });

    it('should render warning variant with yellow color', () => {
      const { container } = render(<ProgressBar value={50} variant="warning" />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('bg-[#fcb831]');
    });

    it('should render error variant with red color', () => {
      const { container } = render(<ProgressBar value={50} variant="error" />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('bg-[#d3595e]');
    });

    it('should use primary variant by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('bg-[#9a94de]');
    });
  });

  describe('Sizes', () => {
    it('should render small size with h-2 class', () => {
      const { container } = render(<ProgressBar value={50} size="sm" />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('h-2');
    });

    it('should render medium size with h-4 class', () => {
      const { container } = render(<ProgressBar value={50} size="md" />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('h-4');
    });

    it('should render large size with h-6 class', () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('h-6');
    });

    it('should use medium size by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('h-4');
    });
  });

  describe('Label Display', () => {
    it('should not show label by default', () => {
      render(<ProgressBar value={50} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should show percentage label when showLabel is true', () => {
      render(<ProgressBar value={50} showLabel />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show custom label when provided', () => {
      render(<ProgressBar value={50} showLabel label="Custom Progress" />);
      expect(screen.getByText('Custom Progress')).toBeInTheDocument();
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      render(<ProgressBar value={33.333} showLabel />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have role="progressbar"', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toBeInTheDocument();
    });

    it('should have correct aria-valuenow', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should have correct aria-valuemin', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have correct aria-valuemax', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have correct aria-valuemax for custom max', () => {
      const { container } = render(<ProgressBar value={25} max={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-valuemax', '50');
    });

    it('should have default aria-label', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-label', 'Progress: 50%');
    });

    it('should use custom label for aria-label', () => {
      const { container } = render(<ProgressBar value={50} label="Loading data" />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading data');
    });
  });

  describe('Styling', () => {
    it('should have rounded-full class on container', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('rounded-full');
    });

    it('should have rounded-full class on fill', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('rounded-full');
    });

    it('should have bg-gray-200 background on container', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('bg-gray-200');
    });

    it('should have overflow-hidden on container', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressContainer = container.querySelector('[role="progressbar"]');
      expect(progressContainer?.className).toContain('overflow-hidden');
    });
  });

  describe('Animation', () => {
    it('should have transition classes by default', () => {
      const { container } = render(<ProgressBar value={50} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).toContain('transition-all');
      expect(progressFill?.className).toContain('duration-300');
      expect(progressFill?.className).toContain('ease-out');
    });

    it('should not have transition classes when animated is false', () => {
      const { container } = render(<ProgressBar value={50} animated={false} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill?.className).not.toContain('transition-all');
    });
  });

  describe('Edge Cases', () => {
    it('should render 0% correctly', () => {
      const { container } = render(<ProgressBar value={0} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should render 100% correctly', () => {
      const { container } = render(<ProgressBar value={100} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('should handle decimal values', () => {
      const { container } = render(<ProgressBar value={33.75} />);
      const progressFill = container.querySelector('.h-full');
      expect(progressFill).toHaveStyle({ width: '33.75%' });
    });
  });
});
