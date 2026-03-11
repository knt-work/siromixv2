/**
 * Datatable Component Unit Tests
 * 
 * Tests columns, pagination, sorting, row clicks, empty state, and loading state.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Datatable, Column } from '@/components/shared/Datatable';

interface MockItem {
  id: string;
  name: string;
  age: number;
  role: string;
}

const mockData: MockItem[] = [
  { id: '1', name: 'Alice', age: 30, role: 'Engineer' },
  { id: '2', name: 'Bob', age: 25, role: 'Designer' },
  { id: '3', name: 'Charlie', age: 35, role: 'Manager' },
];

const mockColumns: Column<MockItem>[] = [
  { key: 'name', header: 'Tên', sortable: true },
  { key: 'age', header: 'Tuổi', sortable: true },
  { key: 'role', header: 'Vai trò', sortable: false },
];

describe('Datatable Component', () => {
  describe('Table Rendering', () => {
    it('should render table with data', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should render Vietnamese column headers', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByText('Tên')).toBeInTheDocument();
      expect(screen.getByText('Tuổi')).toBeInTheDocument();
      expect(screen.getByText('Vai trò')).toBeInTheDocument();
    });

    it('should render all rows', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4); // 1 header + 3 data rows
    });
  });

  describe('Custom Render Functions', () => {
    it('should use custom render function for column', () => {
      const customColumns: Column<MockItem>[] = [
        {
          key: 'name',
          header: 'Tên',
          render: (item) => <strong>{item.name.toUpperCase()}</strong>,
        },
      ];

      render(
        <Datatable
          data={mockData}
          columns={customColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByText('ALICE')).toBeInTheDocument();
    });

    it('should use default render when no render function provided', () => {
      const simpleColumns: Column<MockItem>[] = [
        { key: 'name', header: 'Tên' },
      ];

      render(
        <Datatable
          data={mockData}
          columns={simpleColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show default empty state for empty data', () => {
      render(
        <Datatable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();
    });

    it('should show custom empty state when provided', () => {
      render(
        <Datatable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          emptyState={<div>Không có kết quả</div>}
        />
      );

      expect(screen.getByText('Không có kết quả')).toBeInTheDocument();
      expect(screen.queryByText('Chưa có dữ liệu')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton rows when loading', () => {
      render(
        <Datatable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          loading={true}
        />
      );

      // Should render skeleton rows (default 10)
      const skeletonDivs = document.querySelectorAll('.animate-pulse');
      expect(skeletonDivs.length).toBeGreaterThan(0);
    });

    it('should not show empty state when loading', () => {
      render(
        <Datatable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          loading={true}
        />
      );

      expect(screen.queryByText('Chưa có dữ liệu')).not.toBeInTheDocument();
    });
  });

  describe('Row Click', () => {
    it('should call onRowClick when row is clicked', () => {
      const mockOnRowClick = vi.fn();

      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          onRowClick={mockOnRowClick}
        />
      );

      const firstRow = screen.getByText('Alice').closest('tr');
      fireEvent.click(firstRow!);

      expect(mockOnRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('should add cursor-pointer class when onRowClick is provided', () => {
      const mockOnRowClick = vi.fn();

      const { container } = render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          onRowClick={mockOnRowClick}
        />
      );

      const firstRow = screen.getByText('Alice').closest('tr');
      expect(firstRow?.className).toContain('cursor-pointer');
    });

    it('should not add cursor-pointer class when onRowClick is not provided', () => {
      const { container } = render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const firstRow = screen.getByText('Alice').closest('tr');
      expect(firstRow?.className).not.toContain('cursor-pointer');
    });
  });

  describe('Pagination', () => {
    const paginationConfig = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 25,
      onPageChange: vi.fn(),
    };

    it('should show Vietnamese "Trước" button', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={paginationConfig}
        />
      );

      expect(screen.getByText('Trước')).toBeInTheDocument();
    });

    it('should show Vietnamese "Sau" button', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={paginationConfig}
        />
      );

      expect(screen.getByText('Sau')).toBeInTheDocument();
    });

    it('should show Vietnamese page indicator', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={paginationConfig}
        />
      );

      expect(screen.getByText(/Trang/)).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    });

    it('should show Vietnamese total count', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={paginationConfig}
        />
      );

      expect(screen.getByText(/Tổng số:/)).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument();
      expect(screen.getByText(/mục/)).toBeInTheDocument();
    });

    it('should disable "Trước" button on first page', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={{ ...paginationConfig, currentPage: 1 }}
        />
      );

      const prevButton = screen.getByText('Trước');
      expect(prevButton).toBeDisabled();
    });

    it('should disable "Sau" button on last page', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={{ ...paginationConfig, currentPage: 3, totalItems: 25 }}
        />
      );

      const nextButton = screen.getByText('Sau');
      expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when clicking next button', () => {
      const mockOnPageChange = vi.fn();

      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={{ ...paginationConfig, onPageChange: mockOnPageChange }}
        />
      );

      const nextButton = screen.getByText('Sau');
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking prev button', () => {
      const mockOnPageChange = vi.fn();

      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={{ ...paginationConfig, currentPage: 2, onPageChange: mockOnPageChange }}
        />
      );

      const prevButton = screen.getByText('Trước');
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should not show pagination when total pages is 1', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          pagination={{ ...paginationConfig, totalItems: 5 }}
        />
      );

      expect(screen.queryByText('Trước')).not.toBeInTheDocument();
      expect(screen.queryByText('Sau')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    const sortingConfig = {
      sortBy: null as string | null,
      sortOrder: 'asc' as 'asc' | 'desc',
      onSortChange: vi.fn(),
    };

    it('should show sort icon for sortable columns', () => {
      const { container } = render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          sorting={sortingConfig}
        />
      );

      // Check for sort icons in sortable columns
      const sortIcons = container.querySelectorAll('[icon*="chevron"]');
      expect(sortIcons.length).toBeGreaterThan(0);
    });

    it('should call onSortChange when clicking sortable column header', () => {
      const mockOnSortChange = vi.fn();

      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          sorting={{ ...sortingConfig, onSortChange: mockOnSortChange }}
        />
      );

      const nameHeader = screen.getByText('Tên').closest('th');
      fireEvent.click(nameHeader!);

      expect(mockOnSortChange).toHaveBeenCalledWith('name');
    });

    it('should not call onSortChange for non-sortable columns', () => {
      const mockOnSortChange = vi.fn();

      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          sorting={{ ...sortingConfig, onSortChange: mockOnSortChange }}
        />
      );

      const roleHeader = screen.getByText('Vai trò').closest('th');
      fireEvent.click(roleHeader!);

      expect(mockOnSortChange).not.toHaveBeenCalled();
    });

    it('should add cursor-pointer class to sortable column headers', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          sorting={sortingConfig}
        />
      );

      const nameHeader = screen.getByText('Tên').closest('th');
      expect(nameHeader?.className).toContain('cursor-pointer');
    });

    it('should not add cursor-pointer to non-sortable column headers', () => {
      render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          sorting={sortingConfig}
        />
      );

      const roleHeader = screen.getByText('Vai trò').closest('th');
      expect(roleHeader?.className).not.toContain('cursor-pointer');
    });
  });

  describe('Styling', () => {
    it('should have border and rounded-xl classes', () => {
      const { container } = render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const tableWrapper = container.querySelector('.border');
      expect(tableWrapper?.className).toContain('rounded-xl');
      expect(tableWrapper?.className).toContain('border-[#dee1e6]');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Datatable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          className="custom-table"
        />
      );

      expect(container.firstChild).toHaveClass('custom-table');
    });
  });

  describe('Column Alignment', () => {
    it('should apply center alignment', () => {
      const centeredColumns: Column<MockItem>[] = [
        { key: 'name', header: 'Tên', align: 'center' },
      ];

      render(
        <Datatable
          data={mockData}
          columns={centeredColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const headerCell = screen.getByText('Tên').closest('th');
      expect(headerCell?.className).toContain('text-center');
    });

    it('should apply right alignment', () => {
      const rightColumns: Column<MockItem>[] = [
        { key: 'age', header: 'Tuổi', align: 'right' },
      ];

      render(
        <Datatable
          data={mockData}
          columns={rightColumns}
          keyExtractor={(item) => item.id}
        />
      );

      const headerCell = screen.getByText('Tuổi').closest('th');
      expect(headerCell?.className).toContain('text-right');
    });
  });
});
