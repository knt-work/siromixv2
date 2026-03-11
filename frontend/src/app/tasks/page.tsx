'use client';

/**
 * Task Management Page
 * 
 * Displays all user tasks with exact design from HTML reference.
 * Includes filters, search, pagination, and actions matching SiroMix - Task Management design.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTaskStore } from '@/lib/state/task-store';
import { formatDate } from '@/lib/utils/dates';
import type { Task, TaskStatus } from '@/types';

// Processing statuses that require polling
const PROCESSING_STATUSES: TaskStatus[] = [
  'extracting',
  'understanding',
  'shuffling',
  'generating',
];

export default function TasksPage() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortBy, setSortBy] = useState<string | null>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [, forceUpdate] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Polling logic - force re-renders every 3 seconds if there are processing tasks
  useEffect(() => {
    const hasProcessingTasks = tasks.some((task) =>
      PROCESSING_STATUSES.includes(task.status)
    );

    if (hasProcessingTasks) {
      // Poll every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        // Force component re-render to pick up taskStore changes
        forceUpdate((n) => n + 1);
      }, 3000);
    } else {
      // Clear polling if no processing tasks
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [tasks]);

  // Filter and search logic
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.metadata.exam_name.toLowerCase().includes(query) ||
          task.task_id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((task) => task.status === statusFilter);
    }

    return result;
  }, [tasks, searchQuery, statusFilter]);

  // Sorting logic
  const sortedTasks = useMemo(() => {
    if (!sortBy) return [...filteredTasks];

    return [...filteredTasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'task_id') {
        aValue = a.task_id;
        bValue = b.task_id;
      } else if (sortBy === 'exam_name') {
        aValue = a.metadata.exam_name;
        bValue = b.metadata.exam_name;
      } else if (sortBy === 'subject') {
        aValue = a.metadata.subject;
        bValue = b.metadata.subject;
      } else if (sortBy === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else if (sortBy === 'progress') {
        aValue = a.progress;
        bValue = b.progress;
      } else if (sortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredTasks, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = sortedTasks.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedTasks.slice(startIndex, endIndex);
  }, [sortedTasks, currentPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handlers
  const handleRowClick = (task: Task) => {
    router.push(`/tasks/${task.task_id}`);
  };

  const handleDownload = (task: Task) => {
    // TODO: Implement actual download in Phase 8
    console.log('Download task:', task.task_id);
    alert(`Đang tải xuống ${task.metadata.exam_name}...`);
  };

  const handleRetry = (task: Task) => {
    // TODO: Implement retry in Phase 8
    console.log('Retry task:', task.task_id);
    alert(`Đang thử lại ${task.metadata.exam_name}...`);
  };

  const handleCreateNew = () => {
    router.push('/upload');
  };

  const toggleRowSelection = (taskId: string) => {
    setSelectedRows((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedTasks.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedTasks.map((task) => task.task_id));
    }
  };

  const isAllSelected =
    paginatedTasks.length > 0 && selectedRows.length === paginatedTasks.length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white pt-16">
        <main className="mx-auto max-w-[1440px] px-4 lg:px-32 py-8">
          {/* Page Header */}
          <h1 className="text-[30px] font-bold text-[#171a1f]">Quản lý tác vụ</h1>
          <p className="mt-2 text-[#565d6d]">
            Theo dõi và quản lý các tác vụ xử lý đề thi của bạn. Sử dụng bộ lọc để tìm
            các lần chạy gần đây hoặc xem tiến trình đang hoạt động.
          </p>

          {/* Filters Section */}
          <section className="mt-8 mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search Input */}
              <div className="relative w-full sm:w-[320px]">
                <Icon
                  icon="lucide:search"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565d6d]"
                />
                <input
                  type="text"
                  placeholder="Tìm đề thi hoặc ID tác vụ…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#dee1e6] pl-10 pr-3 text-sm text-[#171a1f] placeholder:text-[#565d6d] focus:border-[#9a94de] focus:outline-none focus:ring-1 focus:ring-[#9a94de]"
                />
              </div>

              {/* Status Filter */}
              <div className="relative h-10 w-full rounded-md border border-[#dee1e6] bg-white px-3 sm:w-[160px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-full w-full appearance-none bg-transparent text-sm text-[#565d6d] focus:outline-none"
                >
                  <option value="all">Trạng thái</option>
                  <option value="pending">Đang chờ</option>
                  <option value="extracting">Đang xử lý</option>
                  <option value="completed">Hoàn tất</option>
                  <option value="failed">Lỗi</option>
                </select>
                <Icon
                  icon="lucide:chevron-down"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#565d6d]"
                />
              </div>

              {/* Date Filter */}
              <div className="relative h-10 w-full rounded-md border border-[#dee1e6] bg-white px-3 sm:w-[180px]">
                <div className="flex h-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:calendar" className="h-4 w-4 text-[#565d6d]" />
                    <span className="text-sm text-[#565d6d]">30 ngày gần đây</span>
                  </div>
                  <Icon icon="lucide:chevron-down" className="h-4 w-4 text-[#565d6d]" />
                </div>
              </div>
            </div>

            {/* Create New Button */}
            <button
              onClick={handleCreateNew}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#9a94de] px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Icon icon="lucide:plus" className="h-4 w-4 text-white" />
              Tạo đề mới
            </button>
          </section>

          {/* Task Table - Desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-[#dee1e6]/60 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f3f4f6]/30 text-[12px] font-medium uppercase tracking-wider text-[#565d6d]">
                <tr>
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[#565d6d] text-[#9a94de] focus:ring-[#9a94de]"
                    />
                  </th>
                  <th className="px-4 py-4">TÊN KÌ THI & ID</th>
                  <th className="px-4 py-4">NGÀY TẠO</th>
                  <th className="px-4 py-4">TRẠNG THÁI</th>
                  <th className="px-4 py-4">TIẾN TRÌNH</th>
                  <th className="px-4 py-4 text-right">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee1e6]/40">
                {paginatedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#565d6d]">
                        <Icon icon="lucide:inbox" className="mb-4 h-16 w-16 text-gray-300" />
                        <p className="text-lg font-medium">Chưa có tác vụ nào</p>
                        <p className="mt-2 text-sm">Tạo đề mới để bắt đầu</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTasks.map((task) => (
                    <tr
                      key={task.task_id}
                      className="cursor-pointer hover:bg-gray-50/50"
                      onClick={() => handleRowClick(task)}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(task.task_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRowSelection(task.task_id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-[#565d6d] text-[#9a94de] focus:ring-[#9a94de]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#171a1f]">
                          {task.metadata.exam_name}
                        </div>
                        <div className="text-[12px] text-[#565d6d]">
                          {task.task_id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#565d6d]">
                        {formatDate(task.created_at, 'dd/MM/yyyy — HH:mm')}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={task.status as BadgeVariant} size="sm" />
                      </td>
                      <td className="px-4 py-4">
                        {task.status === 'pending' ? (
                          <div className="flex items-center gap-2 text-[#1e2128]/80">
                            <Icon icon="lucide:alert-circle" className="h-3.5 w-3.5 text-[#1e2128]" />
                            <span className="text-[12px] font-medium">Cần xem xét</span>
                          </div>
                        ) : task.status === 'failed' ? (
                          <div className="flex items-center gap-2 text-[#d3595e]">
                            <Icon icon="lucide:alert-circle" className="h-3.5 w-3.5" />
                            <span className="text-[12px] font-medium">Lỗi parse file</span>
                          </div>
                        ) : task.status === 'completed' ? (
                          <span className="text-[12px] text-[#565d6d]">100%</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 rounded-full bg-[#f3f4f6]">
                              <div
                                className="h-full rounded-full bg-[#9a94de]"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-[12px] font-medium text-[#565d6d]">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {task.status === 'pending' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(task);
                                }}
                                className="h-9 rounded-md border border-[#dee1e6] bg-white px-3 text-[12px] font-medium shadow-sm hover:bg-gray-50"
                              >
                                Xem xét
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="rounded p-1 text-[#565d6d] hover:bg-gray-100"
                              >
                                <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                              </button>
                            </>
                          ) : task.status === 'failed' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetry(task);
                                }}
                                className="h-9 rounded-md border border-[#dee1e6] bg-white px-3 text-[12px] font-medium text-[#d3595e] shadow-sm hover:bg-gray-50"
                              >
                                Thử lại
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="rounded p-1 text-[#565d6d] hover:bg-gray-100"
                              >
                                <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(task);
                                }}
                                className="rounded p-1 text-[#9a94de] hover:bg-gray-100"
                                aria-label="Xem"
                              >
                                <Icon icon="lucide:eye" className="h-4 w-4" />
                              </button>
                              {task.status === 'completed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(task);
                                  }}
                                  className="rounded p-1 text-[#565d6d] hover:bg-gray-100"
                                  aria-label="Tải xuống"
                                >
                                  <Icon icon="lucide:download" className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="rounded p-1 text-[#565d6d] hover:bg-gray-100"
                              >
                                <Icon icon="lucide:more-horizontal" className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[#dee1e6]/60 bg-[#f3f4f6]/10 px-6 py-4">
              <div className="flex items-center gap-4 text-sm text-[#565d6d]">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="flex h-8 w-14 items-center justify-center rounded-md border border-[#dee1e6] bg-white px-2 text-sm focus:border-[#9a94de] focus:outline-none focus:ring-1 focus:ring-[#9a94de]"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
                <span>
                  Showing {startItem}–{endItem} of {totalItems} tasks
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dee1e6] bg-white shadow-sm disabled:opacity-50"
                >
                  <Icon icon="lucide:chevron-left" className="h-4 w-4" />
                </button>
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 w-8 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'border border-[#9a94de]/20 bg-[#9a94de]/10 text-[#9a94de] shadow-sm'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 3 && <span className="px-2 text-[#565d6d]">...</span>}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#dee1e6] bg-white shadow-sm disabled:opacity-50"
                >
                  <Icon icon="lucide:chevron-right" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Cards - Mobile */}
          <div className="space-y-4 lg:hidden">
            {paginatedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#565d6d]">
                <Icon icon="lucide:inbox" className="mb-4 h-16 w-16 text-gray-300" />
                <p className="text-lg font-medium">Chưa có tác vụ nào</p>
                <p className="mt-2 text-sm">Tạo đề mới để bắt đầu</p>
              </div>
            ) : (
              paginatedTasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => handleRowClick(task)}
                  className="cursor-pointer rounded-xl border border-[#dee1e6]/60 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-[#171a1f]">
                        {task.metadata.exam_name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-[12px] text-[#565d6d]">
                        <Icon icon="lucide:clock" className="h-3 w-3" />
                        <span>{formatDate(task.created_at, 'dd/MM — HH:mm')}</span>
                      </div>
                    </div>
                    <Badge variant={task.status as BadgeVariant} size="sm" />
                  </div>
                  {task.status !== 'completed' && task.status !== 'pending' && task.status !== 'failed' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[12px] font-medium text-[#565d6d]">
                        <span>Tiến trình</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#f3f4f6]">
                        <div
                          className="h-full rounded-full bg-[#9a94de]"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-[#dee1e6]/40 pt-3">
                    <span className="text-[12px] font-medium text-[#565d6d]">
                      ID: {task.task_id.slice(0, 8).toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(task);
                      }}
                      className="text-sm font-medium text-[#9a94de]"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
