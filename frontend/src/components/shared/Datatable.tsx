/**
 * Datatable Component
 * 
 * Generic table component with Vietnamese labels, pagination, sorting, and row click support.
 * Optimized with React.memo and useMemo for large datasets (20+ rows).
 * 
 * @param {DatatableProps<T>} props - Component props
 * @param {T[]} props.data - Array of data items to display in table
 * @param {Column<T>[]} props.columns - Column definitions with headers and render functions
 * @param {(item: T) => string} props.keyExtractor - Function to extract unique key from each item
 * @param {React.ReactNode} props.emptyState - Content to show when table is empty (Vietnamese: "Không có dữ liệu")
 * @param {boolean} props.loading - Show loading skeleton (default: false)
 * @param {(item: T) => void} props.onRowClick - Callback when row is clicked (for navigation)
 * @param {PaginationConfig} props.pagination - Pagination configuration
 * @param {SortingConfig} props.sorting - Sorting configuration
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * // Task management table with Vietnamese headers
 * const columns: Column<Task>[] = [
 *   { key: 'file_name', header: 'Tên file', sortable: true },
 *   { key: 'status', header: 'Trạng thái', render: (task) => <StatusBadge status={task.status} /> },
 *   { key: 'created_at', header: 'Ngày tạo', render: (task) => formatDate(task.created_at) },
 * ];
 * 
 * <Datatable
 *   data={tasks}
 *   columns={columns}
 *   keyExtractor={(task) => task.task_id}
 *   emptyState={<p>Không có đề thi nào</p>}
 *   onRowClick={(task) => router.push(`/tasks/${task.task_id}`)}
 *   pagination={{
 *     currentPage: 1,
 *     pageSize: 10,
 *     totalItems: tasks.length,
 *     onPageChange: setCurrentPage
 *   }}
 *   sorting={{
 *     sortBy: 'created_at',
 *     sortOrder: 'desc',
 *     onSortChange: handleSort
 *   }}
 * />
 * ```
 * 
 * @note
 * Vietnamese pagination labels:
 * - "Trang X/Y" - Page numbering
 * - "Trước" - Previous button
 * - "Sau" - Next button
 */

import React, { useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export interface SortingConfig {
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  onSortChange: (key: string) => void;
}

export interface DatatableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  className?: string;
}

/**
 * Datatable Component (Memoized)
 * 
 * Optimized for rendering 20+ tasks efficiently.
 * Memoization prevents unnecessary re-renders when parent state changes.
 */
export const Datatable = React.memo(function Datatable<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  loading = false,
  onRowClick,
  pagination,
  sorting,
  className,
}: DatatableProps<T>) {
  // Memoize total pages calculation
  const totalPages = useMemo(
    () => (pagination ? Math.ceil(pagination.totalItems / pagination.pageSize) : 1),
    [pagination?.totalItems, pagination?.pageSize]
  );

  // Memoize row click handler
  const handleRowClick = useCallback(
    (item: T) => {
      if (onRowClick) {
        onRowClick(item);
      }
    },
    [onRowClick]
  );

  // Memoize sort handler
  const handleSort = useCallback(
    (key: string, sortable?: boolean) => {
      if (sortable && sorting) {
        sorting.onSortChange(key);
      }
    },
    [sorting]
  );

  // Memoize sort icon renderer
  const getSortIcon = useCallback(
    (key: string, sortable?: boolean) => {
      if (!sortable || !sorting) return null;

      if (sorting.sortBy !== key) {
        return (
          <Icon
            icon="lucide:chevrons-up-down"
            className="w-4 h-4 text-gray-400"
          />
        );
      }

      return sorting.sortOrder === 'asc' ? (
        <Icon icon="lucide:chevron-up" className="w-4 h-4 text-[#9a94de]" />
      ) : (
        <Icon icon="lucide:chevron-down" className="w-4 h-4 text-[#9a94de]" />
      );
    },
    [sorting?.sortBy, sorting?.sortOrder]
  );

  const renderEmptyState = () => {
    if (emptyState) return emptyState;
    return (
      <div className="text-center py-12 text-gray-500">
        <Icon icon="lucide:inbox" className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Chưa có dữ liệu</p>
      </div>
    );
  };

  const renderLoadingState = () => {
    return (
      <tbody>
        {[...Array(pagination?.pageSize || 10)].map((_, index) => (
          <tr key={`skeleton-${index}`}>
            {columns.map((column) => (
              <td key={column.key} className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Table */}
      <div className="border border-[#dee1e6] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#dee1e6]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm font-semibold text-[#565d6d]',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                    'transition-colors'
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key, column.sortable)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {getSortIcon(column.key, column.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {loading ? (
            renderLoadingState()
          ) : data.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  {renderEmptyState()}
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn(
                    'border-b border-[#dee1e6] last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                    'transition-colors'
                  )}
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 text-sm text-[#565d6d]',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          {/* Total count */}
          <div className="text-sm text-[#565d6d]">
            Tổng số: <span className="font-semibold">{pagination.totalItems}</span> mục
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-4">
            {/* Previous button */}
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pagination.currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[#9a94de] hover:bg-[#9a94de]/10'
              )}
            >
              Trước
            </button>

            {/* Page indicator */}
            <div className="text-sm text-[#565d6d]">
              Trang{' '}
              <span className="font-semibold">
                {pagination.currentPage} / {totalPages}
              </span>
            </div>

            {/* Next button */}
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                pagination.currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-[#9a94de] hover:bg-[#9a94de]/10'
              )}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}) as <T>(props: DatatableProps<T>) => React.ReactElement;
