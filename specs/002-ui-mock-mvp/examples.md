# Component Usage Examples

**Feature**: 002-ui-mock-mvp  
**Purpose**: Demonstrate how to compose pages from atoms, molecules, and organisms with Vietnamese content and purple #9a94de branding

---

## Atomic Design Composition

### Level 1: Atoms (Basic UI Elements)

#### Button Component

```tsx
import { Button } from '@/components/ui/Button';

// Primary action button (purple #9a94de)
<Button variant="primary" size="md">
  Tạo đề thi
</Button>

// Loading state with Vietnamese text
<Button 
  variant="primary" 
  isLoading 
  loadingText="Đang xử lý..."
>
  Đăng nhập
</Button>

// Danger button for destructive actions
<Button variant="danger" onClick={handleDelete}>
  Xóa đề thi
</Button>

// Button with icon
<Button 
  variant="primary"
  leftIcon={<Icon icon="mdi:upload" />}
>
  Tải lên tài liệu
</Button>

// Full width button
<Button variant="primary" fullWidth>
  Tiếp tục
</Button>
```

#### Input Component

```tsx
import { Input } from '@/components/ui/Input';

// Basic input with Vietnamese placeholder
<Input 
  placeholder="Nhập tên đề thi..." 
  value={examName}
  onChange={(e) => setExamName(e.target.value)}
/>

// Input with error state
<Input 
  hasError={!!errors.examName}
  placeholder="Tên đề thi (bắt buộc)"
  value={examName}
/>

// Search input with left icon
<Input 
  leftIcon={<Icon icon="mdi:magnify" />}
  placeholder="Tìm kiếm đề thi..."
/>
```

#### Badge Component

```tsx
import { Badge } from '@/components/ui/Badge';

// Status badges with purple theme
<Badge variant="success">Hoàn thành</Badge>
<Badge variant="warning">Đang xử lý</Badge>
<Badge variant="error">Thất bại</Badge>
<Badge variant="info">Chờ xử lý</Badge>
```

---

### Level 2: Molecules (Composite Components)

#### FormField (Label + Input + Error)

```tsx
import { FormField } from '@/components/shared/FormField';

<FormField
  label="Tên đề thi"
  name="examName"
  error={errors.examName?.message}
  required
>
  <Input 
    placeholder="Nhập tên đề thi (ví dụ: Đề thi Giữa kỳ Toán 1)"
    {...register('examName')}
  />
</FormField>
```

#### Modal (Dialog with Header + Body + Footer)

```tsx
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';

<Modal
  isOpen={showConfirmModal}
  onClose={() => setShowConfirmModal(false)}
  title="Xác nhận xóa đề thi"
  size="sm"
  footer={
    <div className="flex gap-3 justify-end">
      <Button 
        variant="ghost" 
        onClick={() => setShowConfirmModal(false)}
      >
        Hủy
      </Button>
      <Button 
        variant="danger" 
        onClick={handleDelete}
      >
        Xóa
      </Button>
    </div>
  }
>
  <p className="text-gray-700">
    Bạn có chắc chắn muốn xóa đề thi "{examName}" không? Hành động này không thể hoàn tác.
  </p>
</Modal>
```

#### FileUpload (Drag & Drop Area)

```tsx
import { FileUpload } from '@/components/shared/FileUpload';

<FileUpload
  onChange={(files) => setSelectedFile(files[0])}
  error={fileError}
  accept=".doc,.docx"
  maxSize={20 * 1024 * 1024}
  multiple={false}
  currentFiles={selectedFile ? [selectedFile] : []}
/>

// Vietnamese UI text is built-in:
// - "Kéo thả file vào đây hoặc"
// - "Chọn file"
// - "Hỗ trợ: .doc, .docx (tối đa 20MB)"
```

#### Card (Container with Shadow)

```tsx
import { Card } from '@/components/shared/Card';

<Card className="p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Thông tin đề thi
  </h3>
  <div className="space-y-3">
    <p><strong>Tên đề:</strong> {exam.name}</p>
    <p><strong>Số câu:</strong> {exam.questionCount}</p>
    <p><strong>Ngày tạo:</strong> {formatDate(exam.createdAt)}</p>
  </div>
</Card>
```

---

### Level 3: Organisms (Feature-Specific Sections)

#### ExamMetadataForm (Complete Form with Validation)

```tsx
import { ExamMetadataForm } from '@/components/sections/ExamMetadataForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExamSchema } from '@/lib/schemas/create-exam-schema';

export default function CreateExamPage() {
  const form = useForm({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      examName: '',
      partAStart: 1,
      partAEnd: 10,
      partBStart: 11,
      partBEnd: 15,
      variantCount: 4,
    },
  });

  const handleSubmit = (data) => {
    console.log('Exam data:', data);
    // Create exam task
  };

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Tạo đề thi mới
      </h1>
      
      <ExamMetadataForm onSubmit={handleSubmit} form={form} />
      
      <div className="mt-6 flex gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button 
          variant="primary" 
          onClick={form.handleSubmit(handleSubmit)}
        >
          Tạo đề thi
        </Button>
      </div>
    </PageContainer>
  );
}
```

#### Datatable (Full Table with Pagination & Sorting)

```tsx
import { Datatable } from '@/components/shared/Datatable';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/dates';
import type { Task } from '@/types';

const columns: Column<Task>[] = [
  {
    key: 'file_name',
    header: 'Tên file',
    sortable: true,
    width: '30%',
  },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (task) => <StatusBadge status={task.status} />,
    width: '20%',
  },
  {
    key: 'question_count',
    header: 'Số câu hỏi',
    render: (task) => (
      <span className="text-gray-700">
        {task.questions?.length || 0} câu
      </span>
    ),
    width: '15%',
  },
  {
    key: 'created_at',
    header: 'Ngày tạo',
    render: (task) => formatDate(task.created_at),
    sortable: true,
    width: '20%',
  },
];

<Datatable
  data={tasks}
  columns={columns}
  keyExtractor={(task) => task.task_id}
  emptyState={
    <div className="text-center py-12">
      <p className="text-gray-500">Chưa có đề thi nào</p>
      <Button 
        variant="primary" 
        className="mt-4"
        onClick={() => router.push('/exams/create')}
      >
        Tạo đề thi đầu tiên
      </Button>
    </div>
  }
  onRowClick={(task) => router.push(`/tasks/${task.task_id}`)}
  pagination={{
    currentPage: currentPage,
    pageSize: 10,
    totalItems: tasks.length,
    onPageChange: setCurrentPage,
  }}
  sorting={{
    sortBy: sortBy,
    sortOrder: sortOrder,
    onSortChange: handleSort,
  }}
/>
```

#### QuestionList (Display Extracted Questions)

```tsx
import { QuestionList } from '@/components/sections/QuestionList';

// Detailed view with confidence badges
<QuestionList 
  questions={task.questions}
  variant="detailed"
  onQuestionClick={(q) => {
    console.log('Clicked question:', q.question_number);
  }}
/>

// Compact preview (for cards)
<QuestionList 
  questions={task.questions.slice(0, 5)}
  variant="compact"
/>

// Vietnamese labels are built-in:
// - "STT" (Số thứ tự)
// - "Câu hỏi"
// - "Đáp án"
// - "Độ tin cậy"
```

#### ProcessingStatus (Task Detail Section)

```tsx
import { ProcessingStatus } from '@/components/sections/ProcessingStatus';

<ProcessingStatus
  task={task}
  logs={task.logs}
  onRetry={handleRetry}
  showRetryButton={task.status === 'failed'}
/>

// Vietnamese stage labels:
// - "Chờ xử lý" - Pending
// - "Trích xuất" - Extracting
// - "Đọc hiểu" - Understanding
// - "Xác nhận" - Awaiting confirmation
// - "Trộn đề" - Shuffling
// - "Tạo files" - Generating files
```

---

### Level 4: Templates (Page Layouts)

#### PageContainer (Consistent Page Layout)

```tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { Navbar } from '@/components/layout/Navbar';

export default function TasksPage() {
  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách đề thi
          </h1>
          <Button 
            variant="primary"
            onClick={() => router.push('/exams/create')}
          >
            Tạo đề mới
          </Button>
        </div>
        
        {/* Page content */}
        <Datatable {...datatableProps} />
      </PageContainer>
    </>
  );
}
```

#### AuthGuard (Protected Route Wrapper)

```tsx
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* This content only shows to authenticated users */}
      <PageContainer>
        <h1>Nội dung yêu cầu đăng nhập</h1>
      </PageContainer>
    </AuthGuard>
  );
}
```

---

## Complete Page Examples

### Example 1: Homepage (Public Page)

```tsx
// src/app/page.tsx

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/shared/Card';
import { Navbar } from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

export default function Homepage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SiroMix - Trộn đề thi nhanh chóng
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Ứng dụng tự động trộn đề thi từ file Word, giúp giáo viên tiết kiệm thời gian
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => router.push('/login')}
            >
              Bắt đầu sử dụng
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/guide')}
            >
              Hướng dẫn
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tính năng nổi bật
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Nhanh chóng</h3>
              <p className="text-gray-600">
                Trộn đề thi tự động trong vài phút
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Chính xác</h3>
              <p className="text-gray-600">
                Đảm bảo phân phối đều câu hỏi
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Dễ sử dụng</h3>
              <p className="text-gray-600">
                Giao diện đơn giản, thân thiện
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
```

### Example 2: Create Exam Page (Protected)

```tsx
// src/app/exams/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageContainer } from '@/components/layout/PageContainer';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Card } from '@/components/shared/Card';
import { FileUpload } from '@/components/shared/FileUpload';
import { FormField } from '@/components/shared/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createExamSchema } from '@/lib/schemas/create-exam-schema';
import { useTaskStore } from '@/lib/state/task-store';

export default function CreateExamPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { createTask } = useTaskStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const form = useForm({
    resolver: zodResolver(createExamSchema),
    defaultValues: {
      examName: '',
      partAStart: 1,
      partAEnd: 10,
      partBStart: 11,
      partBEnd: 15,
      variantCount: 4,
    },
  });

  const handleSubmit = (data: any) => {
    if (!selectedFile) {
      setFileError('Vui lòng chọn file đề thi');
      return;
    }

    const task = createTask({
      file_name: selectedFile.name,
      exam_name: data.examName,
      parts: [
        { start: data.partAStart, end: data.partAEnd },
        { start: data.partBStart, end: data.partBEnd },
      ],
      variant_count: data.variantCount,
    });

    showToast('success', 'Đã tạo đề thi thành công');
    router.push(`/exams/preview/${task.task_id}`);
  };

  return (
    <AuthGuard>
      <Navbar />
      <PageContainer>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Tạo đề thi mới
        </h1>

        <Card className="p-6">
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tải lên file đề thi <span className="text-red-500">*</span>
              </label>
              <FileUpload
                onChange={(files) => {
                  setSelectedFile(files[0]);
                  setFileError('');
                }}
                error={fileError}
                currentFiles={selectedFile ? [selectedFile] : []}
                accept=".doc,.docx"
                multiple={false}
              />
            </div>

            {/* Exam Name */}
            <FormField
              label="Tên đề thi"
              name="examName"
              error={form.formState.errors.examName?.message as string}
              required
            >
              <Input
                placeholder="Ví dụ: Đề thi Giữa kỳ Toán 1 - HK2 2024"
                {...form.register('examName')}
              />
            </FormField>

            {/* Part A Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Phần A - Câu bắt đầu"
                name="partAStart"
                error={form.formState.errors.partAStart?.message as string}
              >
                <Input
                  type="number"
                  {...form.register('partAStart', { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Phần A - Câu kết thúc"
                name="partAEnd"
                error={form.formState.errors.partAEnd?.message as string}
              >
                <Input
                  type="number"
                  {...form.register('partAEnd', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            {/* Part B Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Phần B - Câu bắt đầu"
                name="partBStart"
                error={form.formState.errors.partBStart?.message as string}
              >
                <Input
                  type="number"
                  {...form.register('partBStart', { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Phần B - Câu kết thúc"
                name="partBEnd"
                error={form.formState.errors.partBEnd?.message as string}
              >
                <Input
                  type="number"
                  {...form.register('partBEnd', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            {/* Variant Count */}
            <FormField
              label="Số đề"
              name="variantCount"
              error={form.formState.errors.variantCount?.message as string}
            >
              <Input
                type="number"
                placeholder="2"
                {...form.register('variantCount', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
            >
              Tạo đề thi
            </Button>
          </div>
        </Card>
      </PageContainer>
    </AuthGuard>
  );
}
```

### Example 3: Task Detail Page (Protected)

```tsx
// src/app/tasks/[taskId]/page.tsx

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { Navbar } from '@/components/layout/Navbar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/ui/Button';
import { ProcessingStatus } from '@/components/sections/ProcessingStatus';
import { QuestionList } from '@/components/sections/QuestionList';
import { useTaskStore } from '@/lib/state/task-store';
import { useToast } from '@/components/ui/Toast';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { tasks, retryTask } = useTaskStore();
  
  const task = tasks.find(t => t.task_id === params.taskId);

  useEffect(() => {
    if (!task) {
      showToast('error', 'Không tìm thấy đề thi');
      router.push('/tasks');
    }
  }, [task, router, showToast]);

  const handleRetry = () => {
    if (task && task.status === 'failed') {
      retryTask(task.task_id);
      showToast('success', 'Đã gửi yêu cầu thử lại');
    }
  };

  if (!task) return null;

  return (
    <AuthGuard>
      <Navbar />
      <PageContainer>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              leftIcon={<Icon icon="mdi:arrow-left" />}
              onClick={() => router.push('/tasks')}
              className="mb-2"
            >
              Quay lại
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {task.exam_name}
            </h1>
            <p className="text-gray-600">{task.file_name}</p>
          </div>
        </div>

        {/* Processing Status Section */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Trạng thái xử lý
          </h2>
          <ProcessingStatus
            task={task}
            logs={task.logs}
            onRetry={handleRetry}
            showRetryButton={task.status === 'failed'}
          />
        </Card>

        {/* Questions Section - Only show if completed */}
        {task.status === 'completed' && task.questions && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Danh sách câu hỏi ({task.questions.length} câu)
              </h2>
              <Button variant="outline">
                Xuất file
              </Button>
            </div>
            <QuestionList
              questions={task.questions}
              variant="detailed"
            />
          </Card>
        )}
      </PageContainer>
    </AuthGuard>
  );
}
```

---

## Purple Branding (#9a94de)

### Using Brand Colors

```tsx
import { COLORS } from '@/components/design-system/tokens';

// Use design tokens directly
<div style={{ backgroundColor: COLORS.brand.primary }}>
  Purple background (#9a94de)
</div>

// Use Tailwind classes (configured in theme.ts)
<Button className="bg-brand-primary hover:bg-brand-hover text-white">
  Purple button
</Button>

<div className="border-brand-primary text-brand-primary">
  Purple border and text
</div>

// Progress bars use purple automatically
<ProgressBar value={75} />

// Info badges use purple
<Badge variant="info">Thông tin</Badge>
```

---

## Vietnamese Content Constants

### Centralized Vietnamese Text

```typescript
// src/lib/constants/vietnamese-content.ts

export const VIETNAMESE_LABELS = {
  // Common actions
  CREATE: 'Tạo mới',
  EDIT: 'Chỉnh sửa',
  DELETE: 'Xóa',
  CANCEL: 'Hủy',
  CONFIRM: 'Xác nhận',
  SAVE: 'Lưu',
  
  // Status
  QUEUED: 'Chờ xử lý',
  RUNNING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  
  // Exam creation
  EXAM_NAME: 'Tên đề thi',
  FILE_UPLOAD: 'Tải lên file',
  VARIANT_COUNT: 'Số đề',
  
  // Error messages
  FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file nhỏ hơn 20MB',
  INVALID_FORMAT: 'Định dạng file không được hỗ trợ',
  REQUIRED_FIELD: 'Trường này là bắt buộc',
};

// Usage in components
import { VIETNAMESE_LABELS } from '@/lib/constants/vietnamese-content';

<Button>{VIETNAMESE_LABELS.CREATE}</Button>
```

---

## Best Practices

1. **Always use Vietnamese text** for user-facing content
2. **Use purple #9a94de** for primary actions and branding
3. **Compose from atoms up**: Build molecules from atoms, organisms from molecules
4. **Leverage design tokens**: Use COLORS, TYPOGRAPHY, SPACING constants
5. **Handle loading states**: Show Skeleton components during data fetching
6. **Provide error feedback**: Use Toast notifications with Vietnamese messages
7. **Make it accessible**: Add aria-labels, keyboard navigation, focus states
8. **Optimize performance**: Use React.memo for lists (Datatable), lazy load heavy components

---

## Testing Compositions

```tsx
// tests/integration/create-exam-flow.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import CreateExamPage from '@/app/exams/create/page';

describe('Create Exam Flow', () => {
  it('composes all UI elements correctly', () => {
    render(<CreateExamPage />);
    
    // Atoms present
    expect(screen.getByPlaceholderText(/Nhập tên đề thi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo đề thi/i })).toBeInTheDocument();
    
    // Molecules present
    expect(screen.getByText(/Tải lên file đề thi/i)).toBeInTheDocument();
    
    // Vietnamese labels
    expect(screen.getByText(/Phần A - Câu bắt đầu/i)).toBeInTheDocument();
  });
});
```
