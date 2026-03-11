/**
 * Card Component
 * 
 * A flexible container component with support for variants, padding options,
 * and optional header/footer sections.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  header,
  footer,
  onClick,
  className,
}) => {
  const isInteractive = !!onClick;

  // Base styles
  const baseStyles = 'bg-white';

  // Variant styles
  const variantStyles = {
    default: 'bg-[#f3f4f6]/10',
    outlined: 'border border-[#dee1e6]',
    elevated: 'border border-[#dee1e6] shadow-[0px_2px_5px_0px_#171a1f17,_0px_0px_2px_0px_#171a1f1f]',
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  //Interactive styles
  const interactiveStyles = isInteractive
    ? 'cursor-pointer hover:shadow-md transition-shadow duration-200'
    : '';

  // Border radius - different values for question cards vs large cards
  // Using rounded-[10px] as default (matches question cards from Visily)
  // Pages can override with rounded-xl via className prop for large cards
  const borderRadius = 'rounded-[10px]';

  const cardStyles = cn(
    baseStyles,
    variantStyles[variant],
    borderRadius,
    interactiveStyles,
    className
  );

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  const content = (
    <>
      {header && (
        <div className={cn('border-b border-[#dee1e6]', padding !== 'none' && paddingStyles[padding])}>
          {header}
        </div>
      )}
      <div className={padding !== 'none' ? paddingStyles[padding] : ''}>
        {children}
      </div>
      {footer && (
        <div className={cn('border-t border-[#dee1e6]', padding !== 'none' && paddingStyles[padding])}>
          {footer}
        </div>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cardStyles}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {content}
      </div>
    );
  }

  return <div className={cardStyles}>{content}</div>;
};
