/**
 * Spinner Atom Component
 * 
 * Loading indicator with multiple sizes and color variants.
 * Updated with exact hex colors per Phase 4 requirements.
 */

import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'gray';
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading',
  className = '',
}) => {
  // Size styles
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3px]',
  };

  // Variant styles (exact hex colors)
  const variantStyles = {
    primary: 'border-[#9a94de] border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-[#dee1e6] border-t-transparent',
  };

  return (
    <div role="status" aria-label={label} className={className}>
      <div
        className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-full animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};
