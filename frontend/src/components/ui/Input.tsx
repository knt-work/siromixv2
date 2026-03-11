/**
 * Input Atom Component
 * 
 * Form input element with multiple variants, sizes, and states.
 * Supports icons, error states, and full-width layout.
 */

import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  hasError?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hasError = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'rounded-md transition-all outline-none font-normal';

    // Variant styles
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

    // Size styles (heights and text sizes)
    const sizeStyles = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-base',
      lg: 'h-12 text-lg',
    };

    // Padding based on icon presence
    const getPadding = () => {
      if (leftIcon && rightIcon) return 'pl-10 pr-10';
      if (leftIcon) return 'pl-10 pr-4';
      if (rightIcon) return 'pl-4 pr-10';
      return 'px-4';
    };

    // Width style
    const widthStyle = fullWidth ? 'w-full' : '';

    // Combine styles
    const inputClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${getPadding()} ${widthStyle} ${className}`;

    // Determine if input should be disabled
    const isDisabled = disabled;

    return (
      <div className={`relative inline-flex items-center ${fullWidth ? 'w-full' : ''}`}>
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-text-gray">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={inputClasses}
          disabled={isDisabled}
          aria-invalid={hasError}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-text-gray">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
