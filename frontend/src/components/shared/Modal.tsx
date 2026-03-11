/**
 * Modal Component
 * 
 * A dialog overlay component with focus trap, body scroll lock, and Vietnamese accessibility features.
 * 
 * @param {ModalProps} props - Component props
 * @param {boolean} props.isOpen - Control modal visibility
 * @param {() => void} props.onClose - Callback fired when modal is closed
 * @param {string} props.title - Modal title displayed in header (Vietnamese: "Xác nhận", "Chi tiết đề thi")
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} props.size - Modal width (default: 'md')
 * @param {boolean} props.showCloseButton - Show close X button in header (default: true)
 * @param {boolean} props.closeOnOverlayClick - Close modal when clicking outside (default: true)
 * @param {boolean} props.closeOnEsc - Close modal when pressing Escape key (default: true)
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} props.footer - Modal footer content (buttons, actions)
 * 
 * @example
 * ```tsx
 * // Confirmation modal with Vietnamese text
 * <Modal
 *   isOpen={showConfirmModal}
 *   onClose={() => setShowConfirmModal(false)}
 *   title="Xác nhận xóa đề thi"
 *   size="sm"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
 *         Hủy
 *       </Button>
 *       <Button variant="danger" onClick={handleDelete}>
 *         Xóa
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>Bạn có chắc chắn muốn xóa đề thi này không?</p>
 * </Modal>
 * 
 * // Detail view modal
 * <Modal
 *   isOpen={showDetails}
 *   onClose={() => setShowDetails(false)}
 *   title="Chi tiết câu hỏi"
 *   size="lg"
 * >
 *   <QuestionList questions={selectedQuestions} variant="detailed" />
 * </Modal>
 * ```
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${useRef(Math.random().toString(36).substring(7)).current}`;
  const [isAnimating, setIsAnimating] = useState(false);

  // Manage animation state
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && closeOnEsc) {
          onClose();
        }
      }}
      role="presentation"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'w-full bg-white rounded-xl shadow-lg',
          'flex flex-col max-h-[90vh]',
          'transition-all duration-300',
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          sizeStyles[size]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dee1e6]">
          <h2 id={titleId} className="text-lg font-semibold text-[#171a1f]">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-[#565d6d] hover:text-[#171a1f] transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="lucide:x" className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#dee1e6]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
