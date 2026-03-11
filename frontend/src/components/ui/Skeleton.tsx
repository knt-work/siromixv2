import React from 'react';

export interface SkeletonProps {
  /**
   * Variant type of skeleton
   * - 'text': Single line text skeleton
   * - 'rectangular': Rectangular block skeleton
   * - 'circular': Circular skeleton (for avatars)
   */
  variant?: 'text' | 'rectangular' | 'circular';
  
  /**
   * Width of skeleton (CSS value: '100%', '200px', 'auto', etc.)
   */
  width?: string | number;
  
  /**
   * Height of skeleton (CSS value: '20px', '100px', etc.)
   */
  height?: string | number;
  
  /**
   * Custom className for additional styling
   */
  className?: string;
  
  /**
   * Number of skeleton lines (for text variant)
   */
  count?: number;
}

/**
 * Skeleton Component
 * 
 * Displays loading placeholder with shimmer animation while content is loading.
 * Supports text, rectangular, and circular variants with customizable dimensions.
 * 
 * @example Text Skeleton (single line)
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * ```
 * 
 * @example Multiple Text Lines
 * ```tsx
 * <Skeleton variant="text" count={3} />
 * ```
 * 
 * @example Rectangular Block
 * ```tsx
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 * ```
 * 
 * @example Circular Avatar
 * ```tsx
 * <Skeleton variant="circular" width={40} height={40} />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const baseStyles = 'bg-shimmer bg-[length:1000px_100%] animate-shimmer relative overflow-hidden';
  
  const variantStyles = {
    text: 'rounded h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const skeletonStyle: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  const skeletonClasses = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (count > 1 && variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={skeletonClasses}
            style={{
              ...skeletonStyle,
              width: index === count - 1 ? '80%' : skeletonStyle.width,
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={skeletonClasses} style={skeletonStyle} />;
};

/**
 * Table Skeleton Component
 * 
 * Displays a loading skeleton for Datatable component.
 * Shows multiple rows with columns matching typical table structure.
 * 
 * @example
 * ```tsx
 * <TableSkeleton rows={5} columns={4} />
 * ```
 */
export interface TableSkeletonProps {
  /**
   * Number of skeleton rows to display
   */
  rows?: number;
  
  /**
   * Number of columns in each row
   */
  columns?: number;
  
  /**
   * Show table header skeleton
   */
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      {showHeader && (
        <div className="border-b border-[#dee1e6] pb-3 mb-3">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={`header-${index}`} variant="text" width="60%" height="16px" />
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="text"
                width={colIndex === 0 ? '40%' : '70%'}
                height="14px"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Card Skeleton Component
 * 
 * Displays a loading skeleton for card-based content.
 * Includes header, content lines, and optional footer sections.
 * 
 * @example
 * ```tsx
 * <CardSkeleton lines={4} showFooter />
 * ```
 */
export interface CardSkeletonProps {  /**
   * Number of content lines
   */
  lines?: number;
  
  /**
   * Show footer skeleton
   */
  showFooter?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showFooter = false,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-[#dee1e6] p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <Skeleton variant="text" width="60%" height="24px" className="mb-2" />
        <Skeleton variant="text" width="40%" height="16px" />
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '70%' : '100%'}
          />
        ))}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="pt-4 border-t border-[#dee1e6] flex gap-2">
          <Skeleton variant="rectangular" width="80px" height="36px" />
          <Skeleton variant="rectangular" width="80px" height="36px" />
        </div>
      )}
    </div>
  );
};

/**
 * Page Skeleton Component
 * 
 * Full-page loading skeleton for page transitions.
 * Includes header, breadcrumb, title, and content sections.
 * 
 * @example
 * ```tsx
 * <PageSkeleton />
 * ```
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[#dee1e6] h-16">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-[120px] h-full flex items-center justify-between">
          <Skeleton variant="rectangular" width="120px" height="32px" />
          <div className="flex gap-4">
            <Skeleton variant="rectangular" width="80px" height="32px" />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-[120px] py-6">
        {/* Breadcrumb */}
        <Skeleton variant="text" width="200px" height="16px" className="mb-6" />

        {/* Title */}
        <Skeleton variant="text" width="300px" height="32px" className="mb-6" />

        {/* Cards */}
        <div className="grid gap-6">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={5} showFooter />
          <TableSkeleton rows={5} columns={4} />
        </div>
      </div>
    </div>
  );
};
