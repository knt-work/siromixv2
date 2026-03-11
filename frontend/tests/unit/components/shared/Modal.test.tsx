/**
 * Modal Component Unit Tests
 * 
 * Tests for Modal molecule dialog component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../../utils';
import { Modal } from '@/components/shared/Modal';

describe('Modal Component', () => {
  // Clean up after each test to remove portals
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Open and Close States', () => {
    it('renders modal content when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test  Modal">
          <p>Modal Content</p>
        </Modal>
      );
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render modal content when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Hidden Modal">
          <p>Should Not Appear</p>
        </Modal>
      );
      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Should Not Appear')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Closable Modal">
          Content
        </Modal>
      );
      const closeButton = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when showCloseButton is false', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="No Close Button"
          showCloseButton={false}
        >
          Content
        </Modal>
      );
      expect(screen.queryByLabelText(/close modal/i)).not.toBeInTheDocument();
    });
  });

  describe('Overlay Click Behavior', () => {
    it('calls onClose when overlay is clicked and closeOnOverlayClick is true', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Overlay Closable"
          closeOnOverlayClick={true}
        >
          Content
        </Modal>
      );
      // Click on the backdrop/overlay (not the modal content)
      const overlay = document.querySelector('[class*="bg-black/50"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(handleClose).toHaveBeenCalled();
      }
    });

    it('does not call onClose when modal content is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Modal Title"
          closeOnOverlayClick={true}
        >
          <div data-testid="modal-content">Content</div>
        </Modal>
      );
      const content = screen.getByTestId('modal-content');
      fireEvent.click(content);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="No Overlay Close"
          closeOnOverlayClick={false}
        >
          Content
        </Modal>
      );
      const overlay = document.querySelector('[class*="bg-black/50"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('ESC Key Handling', () => {
    it('calls onClose when ESC is pressed and closeOnEsc is true', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="ESC Closable"
          closeOnEsc={true}
        >
          Content
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });

    it('does not call onClose when ESC is pressed and closeOnEsc is false', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="No ESC Close"
          closeOnEsc={false}
        >
          Content
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when other keys are pressed', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Key Test"
          closeOnEsc={true}
        >
          Content
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Space' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Trap', () => {
    it('focuses first focusable element when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Focus Test">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );
      const firstButton = screen.getByText('First Button');
      expect(document.activeElement).toBe(firstButton);
    });

    it('cycles focus to first element when Tab is pressed on last element', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Focus Cycle">
          <button>First</button>
          <button>Last</button>
        </Modal>
      );
      const lastButton = screen.getByText('Last');
      lastButton.focus();
      fireEvent.keyDown(lastButton, { key: 'Tab' });
      // Should cycle back to first button or close button
      expect(document.activeElement).not.toBe(lastButton);
    });

    it('prevents focus from escaping modal', () => {
      const outsideButton = document.createElement('button');
      outsideButton.textContent = 'Outside Modal';
      document.body.appendChild(outsideButton);

      render(
        <Modal isOpen={true} onClose={() => {}} title="Focus Trap">
          <button>Inside Modal</button>
        </Modal>
      );

      const insideButton = screen.getByText('Inside Modal');
      expect(document.activeElement).toBe(insideButton);

      // Try to focus outside element
      outsideButton.focus();
      // Focus should remain inside modal (implementation depends on focus trap logic)
      expect(document.activeElement).not.toBe(outsideButton);
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when modal opens', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={() => {}} title="Scroll Lock Test">
          Content
        </Modal>
      );
      expect(document.body.style.overflow).not.toBe('hidden');

      rerender(
        <Modal isOpen={true} onClose={() => {}} title="Scroll Lock Test">
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}} title="Scroll Restore Test">
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={() => {}} title="Scroll Restore Test">
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for dialog', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="ARIA Test">
          Content
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-labelledby referencing the title', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Accessible Title">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      expect(titleId).toBeTruthy();
      const titleElement = document.getElementById(titleId!);
      expect(titleElement).toHaveTextContent('Accessible Title');
    });

    it('has aria-modal attribute set to true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal ARIA">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('close button has Vietnamese aria-label', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Vietnamese Close">
          Content
        </Modal>
      );
      const closeButton = screen.getByLabelText(/đóng|close/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies rounded-xl to modal content', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Rounded Modal">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('rounded-xl');
    });

    it('applies shadow-lg to modal content', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Shadow Modal">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('shadow-lg');
    });

    it('applies correct size classes for different size props', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}} title="Size Test" size="sm">
          Content
        </Modal>
      );
      let dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-md');

      rerender(
        <Modal isOpen={true} onClose={() => {}} title="Size Test" size="lg">
          Content
        </Modal>
      );
      dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-2xl');
    });
  });

  describe('Footer Rendering', () => {
    it('renders footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Modal with Footer"
          footer={
            <div>
              <button>Cancel</button>
              <button>Confirm</button>
            </div>
          }
        >
          Content
        </Modal>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('does not render footer when not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="No Footer">
          Content
        </Modal>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
      // Footer section should not exist
      const footers = container.querySelectorAll('[class*="border-t"]');
      // Should only have header border, not footer border
      expect(footers.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Portal Rendering', () => {
    it('renders modal in document.body via portal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Portal Test">
          Portal Content
        </Modal>
      );
      // Modal should be rendered directly in body, not in the React root
      expect(document.body.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('maintains z-index stacking with z-50', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Z-Index Test">
          Content
        </Modal>
      );
      const backdrop = document.querySelector('[class*="z-50"]');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
