import React from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant = 
  | 'pending'
  | 'extracting'
  | 'understanding'
  | 'awaiting'
  | 'shuffling'
  | 'generating'
  | 'completed'
  | 'failed';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
  className?: string;
}

const STATUS_COLORS: Record<BadgeVariant, string> = {
  pending: 'bg-gray-100 text-gray-700',
  extracting: 'bg-[#9a94de]/10 text-[#9a94de]',
  understanding: 'bg-[#9a94de]/10 text-[#9a94de]',
  awaiting: 'bg-[#fcb831]/10 text-[#C98703]',
  shuffling: 'bg-[#9a94de]/10 text-[#9a94de]',
  generating: 'bg-[#9a94de]/10 text-[#9a94de]',
  completed: 'bg-[#39a85e]/10 text-[#39a85e]',
  failed: 'bg-[#d3595e]/10 text-[#d3595e]',
};

const STATUS_TEXT: Record<BadgeVariant, string> = {
  pending: 'Chờ xử lý',
  extracting: 'Đang trích xuất',
  understanding: 'Đang phân tích',
  awaiting: 'Chờ xác nhận',
  shuffling: 'Đang trộn đề',
  generating: 'Đang tạo đề',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function Badge({
  variant,
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const displayText = children || STATUS_TEXT[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        STATUS_COLORS[variant],
        SIZE_CLASSES[size],
        className
      )}
      aria-label={`Status: ${STATUS_TEXT[variant]}`}
    >
      {displayText}
    </span>
  );
}
