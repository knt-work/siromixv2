/**
 * Select Atom Component
 * 
 * Dropdown select element matching Input component styling.
 * Includes chevron icon and supports error states.
 */

import React from 'react';
import { Icon } from '@iconify/react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hasError = false,
      fullWidth = false,
      options,
      placeholder,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles - appearance-none to remove default arrow
    const baseStyles = 'appearance-none rounded-md transition-all outline-none font-normal pr-10';

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

    // Size styles (matching Input component)
    const sizeStyles = {
      sm: 'h-8 text-sm pl-3',
      md: 'h-10 text-base pl-4',
      lg: 'h-12 text-lg pl-4',
    };

    // Width style
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combine styles
    const selectClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

    return (
      <div className={`relative inline-flex items-center ${fullWidth ? 'w-full' : ''}`}>
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          aria-invalid={hasError}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <div className="absolute right-3 flex items-center pointer-events-none text-text-gray">
          <Icon icon="lucide:chevron-down" className="h-5 w-5" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
