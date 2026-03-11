/**
 * Form Inputs Component Unit Tests
 * 
 * Tests for Input, Select, Textarea, and Checkbox atom components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../utils';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import userEvent from '@testing-library/user-event';

describe('Input Component', () => {
  describe('Variants', () => {
    it('renders default variant with border', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveClass('border', 'border-border-subtle');
    });

    it('renders filled variant with background', () => {
      render(<Input variant="filled" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveClass('bg-background-gray');
    });

    it('renders outlined variant with thick border', () => {
      render(<Input variant="outlined" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveClass('border-2');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Input size="sm" placeholder="Small" />);
      const input = screen.getByPlaceholderText('Small');
      expect(input).toHaveClass('h-8', 'text-sm');
    });

    it('renders medium size correctly', () => {
      render(<Input size="md" placeholder="Medium" />);
      const input = screen.getByPlaceholderText('Medium');
      expect(input).toHaveClass('h-10', 'text-base');
    });

    it('renders large size correctly', () => {
      render(<Input size="lg" placeholder="Large" />);
      const input = screen.getByPlaceholderText('Large');
      expect(input).toHaveClass('h-12', 'text-lg');
    });
  });

  describe('Error State', () => {
    it('shows error styling when hasError is true', () => {
      render(<Input hasError placeholder="Error input" />);
      const input = screen.getByPlaceholderText('Error input');
      expect(input).toHaveClass('border-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows normal styling when hasError is false', () => {
      render(<Input hasError={false} placeholder="Normal input" />);
      const input = screen.getByPlaceholderText('Normal input');
      expect(input).toHaveClass('border-border-subtle');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      const { container } = render(
        <Input
          placeholder="With icon"
          leftIcon={<span data-testid="left-icon">🔍</span>}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('With icon');
      expect(input).toHaveClass('pl-10');
    });

    it('renders with right icon', () => {
      const { container } = render(
        <Input
          placeholder="With icon"
          rightIcon={<span data-testid="right-icon">✓</span>}
        />
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('With icon');
      expect(input).toHaveClass('pr-10');
    });

    it('renders with both icons', () => {
      render(
        <Input
          placeholder="With icons"
          leftIcon={<span data-testid="left-icon">🔍</span>}
          rightIcon={<span data-testid="right-icon">✓</span>}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('applies full width when fullWidth is true', () => {
      const { container } = render(<Input fullWidth placeholder="Full width" />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('allows text input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      
      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });

    it('calls onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input placeholder="Type here" onChange={handleChange} />);
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'A');
      expect(handleChange).toHaveBeenCalled();
    });

    it('respects disabled state', () => {
      render(<Input disabled placeholder="Disabled" />);
      const input = screen.getByPlaceholderText('Disabled');
      expect(input).toBeDisabled();
    });
  });
});

describe('Select Component', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  describe('Rendering', () => {
    it('renders all options', () => {
      render(<Select options={options} />);
      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('option')).toHaveLength(3);
    });

    it('renders placeholder when provided', () => {
      render(<Select options={options} placeholder="Choose option" />);
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('shows chevron icon', () => {
      const { container } = render(<Select options={options} />);
      const icon = container.querySelector('[icon="lucide:chevron-down"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Variants and Sizes', () => {
    it('renders default variant with border', () => {
      render(<Select options={options} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border', 'border-border-subtle');
    });

    it('renders medium size correctly', () => {
      render(<Select options={options} size="md" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('h-10', 'text-base');
    });
  });

  describe('Error State', () => {
    it('shows error styling when hasError is true', () => {
      render(<Select options={options} hasError />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-error');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Interactions', () => {
    it('allows option selection', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select options={options} onChange={handleChange} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      
      await user.selectOptions(select, '2');
      expect(select.value).toBe('2');
    });

    it('respects disabled state', () => {
      render(<Select options={options} disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });
  });
});

describe('Textarea Component', () => {
  describe('Rendering', () => {
    it('renders with default rows', () => {
      render(<Textarea placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('renders with custom rows', () => {
      render(<Textarea rows={6} placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea).toHaveAttribute('rows', '6');
    });

    it('has resize-none class', () => {
      render(<Textarea placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea).toHaveClass('resize-none');
    });
  });

  describe('Variants', () => {
    it('renders default variant with border', () => {
      render(<Textarea placeholder="Enter text" />);
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea).toHaveClass('border', 'border-border-subtle', 'rounded-md');
    });
  });

  describe('Error State', () => {
    it('shows error styling when hasError is true', () => {
      render(<Textarea hasError placeholder="Error textarea" />);
      const textarea = screen.getByPlaceholderText('Error textarea');
      expect(textarea).toHaveClass('border-error');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Interactions', () => {
    it('allows multiline text input', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Type here" />);
      const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement;
      
      await user.type(textarea, 'Line 1{Enter}Line 2');
      expect(textarea.value).toContain('Line 1\nLine 2');
    });

    it('respects disabled state', () => {
      render(<Textarea disabled placeholder="Disabled" />);
      const textarea = screen.getByPlaceholderText('Disabled');
      expect(textarea).toBeDisabled();
    });
  });
});

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('renders checkbox without label', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('renders checkbox with label', () => {
      render(<Checkbox label="Accept terms" />);
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Accept terms');
      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('associates label with checkbox via htmlFor', () => {
      render(<Checkbox label="Accept terms" id="terms" />);
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Accept terms');
      expect(label).toHaveAttribute('for', 'terms');
      expect(checkbox).toHaveAttribute('id', 'terms');
    });
  });

  describe('Styling', () => {
    it('has purple brand accent color', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('text-brand-primary');
    });

    it('has rounded borders', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('rounded');
    });
  });

  describe('Error State', () => {
    it('shows error styling when hasError is true', () => {
      render(<Checkbox hasError label="Error checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('Error checkbox');
      expect(checkbox).toHaveClass('border-error');
      expect(checkbox).toHaveAttribute('aria-invalid', 'true');
      expect(label).toHaveClass('text-error');
    });
  });

  describe('Interactions', () => {
    it('toggles checked state on click', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      
      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('calls onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');
      
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalled();
    });

    it('allows label click to toggle checkbox', async () => {
      const user = userEvent.setup();
      render(<Checkbox label="Click me" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      const label = screen.getByText('Click me');
      
      expect(checkbox.checked).toBe(false);
      await user.click(label);
      expect(checkbox.checked).toBe(true);
    });

    it('respects disabled state', () => {
      render(<Checkbox disabled label="Disabled" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });
});
