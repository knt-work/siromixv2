/**
 * Textarea Atom Component
 * 
 * Multi-line text input element matching Input component styling.
 * Supports error states and custom row sizing.
 */

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'outlined';
  hasError?: boolean;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      hasError = false,
      fullWidth = false,
      disabled,
      className = '',
      rows = 4,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'rounded-md transition-all outline-none font-normal px-4 py-3 text-base resize-none';

    // Variant styles (matching Input component)
    const variantStyles = {
      default: hasError
        ? 'border border-error bg-white'
        : 'border border-border-subtle bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
      filled: hasError
        ? 'border border-error bg-background-gray'
        : 'border-0 bg-background-gray focus:ring-2 focus:ring-brand-primary/20',
      outlined: hasError
        ? 'border-2 border-error bg-white'
        : 'border-2 border-border-subtle bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
    };

    // Width style
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combine styles
    const textareaClasses = `${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`;

    return (
      <textarea
        ref={ref}
        className={textareaClasses}
        disabled={disabled}
        aria-invalid={hasError}
        rows={rows}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
