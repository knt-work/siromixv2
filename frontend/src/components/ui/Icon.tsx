/**
 * Icon Wrapper Component
 * 
 * Wrapper for @iconify/react icons with consistent sizing and styling.
 * Supports Lucide icons (lucide:*) as primary icon family.
 */

'use client';

import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

export interface IconProps {
  /** Icon name from Iconify (e.g., "lucide:search", "lucide:calendar") */
  icon: string;
  /** Icon size in pixels or Tailwind classes */
  size?: number | string;
  /** Icon color (defaults to currentColor) */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  size = 20,
  color,
  className = '',
  style,
}) => {
  // Convert size to number if string
  const iconSize = typeof size === 'string' ? undefined : size;
  const sizeClass = typeof size === 'string' ? size : '';

  return (
    <IconifyIcon
      icon={icon}
      width={iconSize}
      height={iconSize}
      className={`${sizeClass} ${className}`}
      style={{ color, ...style }}
    />
  );
};
