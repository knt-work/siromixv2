/**
 * FormField Component Unit Tests
 * 
 * Tests for FormField molecule wrapper component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../utils';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/Input';

describe('FormField Component', () => {
  describe('Label Rendering', () => {
    it('renders label with correct text', () => {
      render(
        <FormField label="Email Address" htmlFor="email">
          <Input id="email" />
        </FormField>
      );
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('associates label with input via htmlFor', () => {
      render(
        <FormField label="Email Address" htmlFor="email">
          <Input id="email" />
        </FormField>
      );
      const label = screen.getByLabelText('Email Address');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('id', 'email');
    });

    it('shows required indicator when required is true', () => {
      render(
        <FormField label="Required Field" htmlFor="field" required>
          <Input id="field" />
        </FormField>
      );
      const label = screen.getByText(/Required Field/);
      expect(label.textContent).toContain('*');
    });

    it('does not show required indicator when required is false', () => {
      render(
        <FormField label="Optional Field" htmlFor="field" required={false}>
          <Input id="field" />
        </FormField>
      );
      const label = screen.getByText('Optional Field');
      expect(label.textContent).not.toContain('*');
    });
  });

  describe('Error Display', () => {
    it('displays error message when error prop is provided', () => {
      render(
        <FormField label="Email" htmlFor="email" error="Vui lòng nhập email hợp lệ">
          <Input id="email" hasError />
        </FormField>
      );
      expect(screen.getByText('Vui lòng nhập email hợp lệ')).toBeInTheDocument();
    });

    it('applies error color to label when error is present', () => {
      render(
        <FormField label="Email" htmlFor="email" error="Invalid email">
          <Input id="email" hasError />
        </FormField>
      );
      const label = screen.getByText('Email');
      expect(label).toHaveClass('text-error');
    });

    it('shows error icon alongside error message', () => {
      const { container } = render(
        <FormField label="Email" htmlFor="email" error="Invalid email">
          <Input id="email" hasError />
        </FormField>
      );
      const icon = container.querySelector('[icon="lucide:alert-circle"]');
      expect(icon).toBeInTheDocument();
    });

    it('error message has correct styling', () => {
      render(
        <FormField label="Email" htmlFor="email" error="Invalid email">
          <Input id="email" hasError />
        </FormField>
      );
      const errorMessage = screen.getByText('Invalid email');
      expect(errorMessage).toHaveClass('text-error');
    });

    it('does not show helper text when error is present', () => {
      render(
        <FormField
          label="Email"
          htmlFor="email"
          error="Invalid email"
          helperText="Enter your email address"
        >
          <Input id="email" hasError />
        </FormField>
      );
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text Display', () => {
    it('displays helper text when provided and no error', () => {
      render(
        <FormField
          label="Password"
          htmlFor="password"
          helperText="Must be at least 8 characters"
        >
          <Input id="password" type="password" />
        </FormField>
      );
      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('helper text has correct styling', () => {
      render(
        <FormField
          label="Password"
          htmlFor="password"
          helperText="Must be at least 8 characters"
        >
          <Input id="password" type="password" />
        </FormField>
      );
      const helperText = screen.getByText('Must be at least 8 characters');
      expect(helperText).toHaveClass('text-text-gray');
    });
  });

  describe('Children Rendering', () => {
    it('renders child input component', () => {
      render(
        <FormField label="Username" htmlFor="username">
          <Input id="username" placeholder="Enter username" />
        </FormField>
      );
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <FormField label="Field" htmlFor="field">
          <Input id="field" />
          <div data-testid="extra-content">Extra content</div>
        </FormField>
      );
      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    });
  });

  describe('Vietnamese Error Messages', () => {
    it('displays Vietnamese required field error', () => {
      render(
        <FormField
          label="Tên kì thi"
          htmlFor="examName"
          error="Vui lòng nhập tên kì thi"
        >
          <Input id="examName" hasError />
        </FormField>
      );
      expect(screen.getByText('Vui lòng nhập tên kì thi')).toBeInTheDocument();
    });

    it('displays Vietnamese invalid value error', () => {
      render(
        <FormField
          label="Thời gian"
          htmlFor="duration"
          error="Thời gian phải là số dương"
        >
          <Input id="duration" hasError />
        </FormField>
      );
      expect(screen.getByText('Thời gian phải là số dương')).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('has proper spacing between elements', () => {
      const { container } = render(
        <FormField
          label="Field"
          htmlFor="field"
          helperText="Helper text"
        >
          <Input id="field" />
        </FormField>
      );
      const wrapper = container.querySelector('.space-y-2');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper label-input association', () => {
      render(
        <FormField label="Accessible Field" htmlFor="accessible">
          <Input id="accessible" />
        </FormField>
      );
      const input = screen.getByLabelText('Accessible Field');
      expect(input).toBeInTheDocument();
    });

    it('required indicator is accessible', () => {
      render(
        <FormField label="Required" htmlFor="req" required>
          <Input id="req" />
        </FormField>
      );
      const label = screen.getByText(/Required/);
      expect(label).toBeInTheDocument();
      // Required indicator (*) should be part of the label
      expect(label.textContent).toMatch(/Required.*\*/);
    });
  });
});
