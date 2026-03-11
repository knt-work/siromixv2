/**
 * Checkbox Atom Component
 * 
 * Checkbox input with label support and purple brand accent.
 * Accessibility-focused with proper label association.
 */

import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hasError?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      hasError = false,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided (needed for label association)
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Base checkbox styles with purple accent
    const checkboxClasses = `h-4 w-4 rounded border-border-subtle text-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
      hasError ? 'border-error' : ''
    } ${className}`;

    // Label styles
    const labelClasses = `text-sm font-medium text-text-dark select-none ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${hasError ? 'text-error' : ''}`;

    if (label) {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={checkboxClasses}
            disabled={disabled}
            aria-invalid={hasError}
            {...props}
          />
          <label htmlFor={checkboxId} className={labelClasses}>
            {label}
          </label>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className={checkboxClasses}
        disabled={disabled}
        aria-invalid={hasError}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';
