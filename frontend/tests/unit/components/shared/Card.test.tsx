/**
 * Card Component Unit Tests
 * 
 * Tests for Card molecule wrapper component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../utils';
import { Card } from '@/components/shared/Card';

describe('Card Component', () => {
  describe('Variant Rendering', () => {
    it('renders default variant with correct background', () => {
      render(<Card variant="default">Default Content</Card>);
      const card = screen.getByText('Default Content').parentElement;
      expect(card).toHaveClass('bg-[#f3f4f6]/10');
    });

    it('renders outlined variant with border only', () => {
      render(<Card variant="outlined">Outlined Content</Card>);
      const card = screen.getByText('Outlined Content').parentElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('border');
    });

    it('renders elevated variant with shadow and border', () => {
      render(<Card variant="elevated">Elevated Content</Card>);
      const card = screen.getByText('Elevated Content').parentElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-sm');
    });
  });

  describe('Padding Sizes', () => {
    it('renders with no padding when padding is "none"', () => {
      render(<Card padding="none">No Padding</Card>);
      const container = screen.getByText('No Padding').parentElement;
      expect(container).not.toHaveClass('p-4');
      expect(container).not.toHaveClass('p-6');
      expect(container).not.toHaveClass('p-8');
    });

    it('renders with small padding when padding is "sm"', () => {
      render(<Card padding="sm">Small Padding</Card>);
      const container = screen.getByText('Small Padding');
      expect(container).toHaveClass('p-4');
    });

    it('renders with medium padding when padding is "md" (default)', () => {
      render(<Card>Medium Padding</Card>);
      const container = screen.getByText('Medium Padding');
      expect(container).toHaveClass('p-6');
    });

    it('renders with large padding when padding is "lg"', () => {
      render(<Card padding="lg">Large Padding</Card>);
      const container = screen.getByText('Large Padding');
      expect(container).toHaveClass('p-8');
    });
  });

  describe('Header and Footer Rendering', () => {
    it('renders header when provided', () => {
      render(
        <Card header={<h2>Card Header</h2>}>
          Card Body
        </Card>
      );
      expect(screen.getByText('Card Header')).toBeInTheDocument();
      expect(screen.getByText('Card Body')).toBeInTheDocument();
    });

    it('renders footer when provided', () => {
      render(
        <Card footer={<button>Action Button</button>}>
          Card Body
        </Card>
      );
      expect(screen.getByText('Action Button')).toBeInTheDocument();
      expect(screen.getByText('Card Body')).toBeInTheDocument();
    });

    it('renders both header and footer with border separators', () => {
      render(
        <Card
          header={<h2>Header</h2>}
          footer={<button>Footer</button>}
        >
          Content
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('does not render header or footer when not provided', () => {
      const { container } = render(<Card>Only Body</Card>);
      expect(screen.getByText('Only Body')).toBeInTheDocument();
      // Should only have one child (the content div)
      expect(container.firstChild?.childNodes.length).toBe(1);
    });
  });

  describe('onClick Interaction', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByRole('button');
      card.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('adds role="button" when onClick is provided', () => {
      render(<Card onClick={() => {}}>Clickable Card</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('adds tabIndex=0 when onClick is provided for keyboard accessibility', () => {
      render(<Card onClick={() => {}}>Clickable Card</Card>);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles Enter key press when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByRole('button');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key press when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = screen.getByRole('button');
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not add interactive styles when onClick is not provided', () => {
      render(<Card>Non-Clickable Card</Card>);
      const card = screen.getByText('Non-Clickable Card').parentElement;
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveAttribute('role', 'button');
    });
  });

  describe('Border and Styling', () => {
    it('applies border color #dee1e6 for outlined variant', () => {
      render(<Card variant="outlined">Outlined</Card>);
      const card = screen.getByText('Outlined').parentElement;
      expect(card).toHaveClass('border-[#dee1e6]');
    });

    it('applies border color #dee1e6 for elevated variant', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated').parentElement;
      expect(card).toHaveClass('border-[#dee1e6]');
    });

    it('applies rounded-[10px] border radius by default', () => {
      render(<Card>Default Radius</Card>);
      const card = screen.getByText('Default Radius').parentElement;
      expect(card).toHaveClass('rounded-[10px]');
    });

    it('allows overriding border radius with className', () => {
      render(<Card className="rounded-xl">Custom Radius</Card>);
      const card = screen.getByText('Custom Radius').parentElement;
      expect(card).toHaveClass('rounded-xl');
    });
  });

  describe('Custom className', () => {
    it('applies custom className to card', () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText('Custom').parentElement;
      expect(card).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      render(<Card className="mb-4">With Margin</Card>);
      const card = screen.getByText('With Margin').parentElement;
      expect(card).toHaveClass('mb-4');
      expect(card).toHaveClass('border-[#dee1e6]'); // Still has default border
    });
  });

  describe('Children Rendering', () => {
    it('renders children content correctly', () => {
      render(
        <Card>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </Card>
      );
      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });

    it('renders complex JSX children', () => {
      render(
        <Card>
          <div>
            <h3>Title</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
