/**
 * Button Atom Component
 * 
 * Primary interaction element with multiple variants and sizes.
 * Supports loading states, icons, and full-width layout.
 */

import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles (using purple #9a94de brand from Visily)
  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-hover focus:ring-brand-primary transition-all',
    secondary: 'bg-background-gray text-text-dark hover:bg-gray-200 focus:ring-gray-500 transition-all',
    outline: 'border-2 border-brand-primary text-brand-primary hover:bg-brand-light focus:ring-brand-primary transition-all',
    ghost: 'text-text-gray hover:bg-background-gray focus:ring-gray-500 transition-all',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error transition-all',
  };

  // Size styles
  const sizeStyles = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-base gap-2',
    lg: 'h-12 px-6 text-lg gap-2.5',
  };

  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';

  // Combine styles
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

  // Determine if button should be disabled
  const isDisabled = disabled || isLoading;

  // Spinner size based on button size
  const spinnerSize = size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'sm';

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <Spinner 
          size={spinnerSize} 
          variant={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'}
        />
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
