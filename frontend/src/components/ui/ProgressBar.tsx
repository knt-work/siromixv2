/**
 * ProgressBar Component
 * 
 * Visual progress indicator with customizable variants, sizes, and optional labels.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ProgressBarProps {
  value: number;                // 0-100 percentage
  max?: number;                 // Default: 100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;           // Display percentage text
  label?: string;                // Override default "X%" label
  animated?: boolean;            // Animate fill on value change
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  animated = true,
}) => {
  // Clamp value between 0 and max
  const clampedValue = Math.min(Math.max(0, value), max);
  const percentage = (clampedValue / max) * 100;

  // Variant styles
  const variantStyles = {
    primary: 'bg-[#9a94de]',
    success: 'bg-[#39a85e]',
    warning: 'bg-[#fcb831]',
    error: 'bg-[#d3595e]',
  };

  // Size styles
  const sizeStyles = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className="w-full">
      {/* Progress bar container */}
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'h-full rounded-full',
 variantStyles[variant],
            animated && 'transition-all duration-300 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Optional label */}
      {showLabel && (
        <div className="mt-1 text-sm text-[#565d6d] text-right font-medium">
          {displayLabel}
        </div>
      )}
    </div>
  );
};
