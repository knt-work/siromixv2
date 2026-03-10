# Page Contracts: SiroMix UI MVP

**Feature**: 002-ui-mock-mvp  
**Date**: 2026-03-10  
**Purpose**: Define page- level contracts with exact Visily design mappings

---

## Overview

This document maps all 6 application pages to their corresponding Visily export folders and documents exact styling requirements per clarifications Q1/Q5 (preserve exact Visily values per page, no normalization).

---

## Page Mapping Table

| Page / Route | Visily Export Folder | User Story | Priority |
|-------------|---------------------|-----------|----------|
| `/` (Homepage) | `SiroMix - Homepage/` | US1 | P1 |
| `/login` | `SiroMix - Login Screen/` | US2 | P2 |
| `/create-exam` | `SiroMix- Create New Exam/` | US3 | P3 |
| `/preview/[taskId]` | `SiroMix - Exam Analysis Result/` | US4 | P4 |
| `/tasks` | `SiroMix - Task Management/` | US5 | P5 |
| `/tasks/[id]` | `SiroMix - Exam Detail/` | US6 | P6 |

---

## Page Contract Details

### 1. Homepage (`/`)

**Visily Source**: `html/SiroMix - Homepage/`  
**Route**: `src/app/page.tsx`  
**User Story**: US1 - Homepage & Core Navigation  
**Priority**: P1

**Layout Specifications** (exact Visily values):
- Container padding: `px-4 lg:px-[144px]` (widest padding for hero section)
- Background: Radial gradient`from-[#9a94de]/10 via-white to-white`
- Max width: Full viewport

**Key Sections**:
1. **Hero Section**:
   - Vietnamese headline: "Trộn đề thi nhanh chóng với SiroMix"
   - Subheadline: Secondary Vietnamese description
   - Gradient purple heading with large font size
   - Letter spacing: `-0.02em` for headline

2. **CTA Button Group**:
   - Primary button: "Đăng nhập" (Login) → Purple #9a94de
   - Secondary button: "Tạo đề mới" (Create Exam) → Outline style
   - User Guide link: Vietnamese text

3. **Feature Checklist**:
   - Check icons (green #39a85e)
   - Vietnamese feature descriptions

**Custom CSS Classes** (from Visily):
- `custom-scrollbar`: Scrollbar styling for content overflow
- `.selection:bg-brand/20`: Text selection highlighting

**Components Used** (from atomic design):
- Atoms: Button (2 variants), Icon (check icons)
- Molecules: None (simple layout)
- Organisms: None
- Layout: Navbar (auth state aware)

**Vietnamese Content Constants**:
```typescript
homepage: {
  headline: "Trộn đề thi nhanh chóng với SiroMix",
  subheadline: "Xử lý và tạo các phiên bản đề thi tự động",
  loginButton: "Đăng nhập",
  createButton: "Tạo đề mới",
  userGuide: "Hướng dẫn sử dụng",
  features: [
    "Trích xuất tự động từ file Word",
    "Phân tích cấu trúc đề thi thông minh",
    "Tạo nhiều phiên bản trộn câu hỏi",
  ]
}
```

---

### 2. Login Page (`/login`)

**Visily Source**: `html/SiroMix - Login Screen/`  
**Route**: `src/app/login/page.tsx`  
**User Story**: US2 - Simulated Authentication Flow  
**Priority**: P2

**Layout Specifications**:
- Container: Centered card with `max-w-[560px]`
- Padding: `px-4 lg:px-6` inside card
- Background: White card on subtle gray background

**Card Styling** (exact Visily):
- Border radius: `rounded-xl`
- Shadow: `shadow-[0px_10px_25px_rgba(23, 26, 31, 0.08)]` (auth-card-shadow)
- Border: `1px solid #dee1e6`

**Key Elements**:
1. **SiroMix Logo**: Custom SVG component (3-layer logo from Visily)
2. **Heading**: "Đăng nhập vào SiroMix" (Vietnamese)
3. **Google OAuth Button**:
   - Google logo SVG (from Visily export)
   - Text: "Đăng nhập bằng Google"
   - Border: `1px solid #dee1e6`
   - Hover: `scale(0.98)` with transition (interactive-transition class)

**Custom CSS Classes**:
- `auth-card-border`: Custom border styling
- `interactive-transition`: Scale animation on interaction

**Authentication Flow** (simulated):
1. User clicks Google button
2. Show loading state (1-2 seconds)
3. Call `authStore.login()` with mock Trieu Kiem user
4. Redirect to destination or homepage

**Components Used**:
- Atoms: Button (Google OAuth variant), SiroMixLogo SVG)
- Molecules: Card (centered auth card)
- Layout: Minimal (no Navbar when unauthenticated)

**Vietnamese Content**:
```typescript
login: {
  heading: "Đăng nhập vào SiroMix",
  googleButton: "Đăng nhập bằng Google",
  loadingMessage: "Đang xác thực...",
}
```

---

### 3. Create Exam Page (`/create-exam`)

**Visily Source**: `html/SiroMix- Create New Exam/`  
**Route**: `src/app/create-exam/page.tsx`  
**User Story**: US3 - Create Exam Form & Submission  
**Priority**: P3

**Layout Specifications**:
- Container padding: `px-4 lg:px-36` (medium padding for form)
- Max width: Constrained for readability
- Background: White

**Form Layout**:
- Two-column grid on desktop: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Full-width fields: Exam name, notes, file upload
- Half-width fields: Academic year, subject, duration, versions

**Field Specifications** (Vietnamese labels per Visily):
1. **Academic Year**: Text input, "Năm học"
2. **Exam Name**: Text input, "Tên kì thi"
3. **Subject**: Text input, "Môn học"
4. **Duration**: Number input, "Thời gian (phút)"
5. **Num Versions**: Number input, "Số đề cần trộn" (1-10)
6. **Notes**: Textarea, "Ghi chú" (optional)
7. **File Upload**: Custom dashed border area, "Tải lên tệp đề thi"

**File Upload Styling** (exact Visily):
- Border: `custom-dashed-border` class (SVG data URI for dashed effect)
- Background: `/fcfcfd` (subtle gray)
- Icon: Upload icon from @iconify (lucide:upload)
- Text: "Kéo thả file hoặc nhấn để chọn"

**Submit Button**:
- Text: "Trộn đề thi ngay" (Vietnamese)
- Color: Purple #9a94de  
- Full width on mobile, auto on desktop

**Success State**:
- Show success notification (Vietnamese message)
- Redirect to Preview page after 2 seconds

**Components Used**:
- Atoms: Input, Button, Icon
- Molecules: FormField (Label + Input + Error), FileUpload
- Organisms: ExamForm (full form composition)
- Layout: Navbar, PageContainer

**Vietnamese Content**:
```typescript
createExam: {
  pageTitle: "Tạo đề thi mới",
  labels: {
    academicYear: "Năm học",
    examName: "Tên kì thi",
    subject: "Môn học",
    duration: "Thời gian (phút)",
    numVersions: "Số đề cần trộn",
    notes: "Ghi chú",
    fileUpload: "Tải lên tệp đề thi",
  },
  placeholders: {
    academicYear: "VD: 2025-2026",
    examName: "VD: Kiểm tra giữa kì - Toán",
    subject: "VD: Toán học",
  },
  fileUploadHint: "Kéo thả file hoặc nhấn để chọn",
  submitButton: "Trộn đề thi ngay",
  successMessage: "Đã bắt đầu xử lý đề thi!",
}
```

---

###4. Preview Analysis Page (`/preview/[taskId]`)

**Visily Source**: `html/SiroMix - Exam Analysis Result/`  
**Route**: `src/app/preview/[taskId]/page.tsx`  
**User Story**: US4 - Preview & Confirmation  
**Priority**: P4

**Layout Specifications**:
- Container: `max-w-[1152px]` centered
- Padding: `px-4 lg:px-8`
- Background: White

**Page Structure**:
1. **Header**:
   - Title (Vietnamese): "Xem trước kết quả phân tích đề thi"
   - Total question count badge

2. **Search Bar**:
   - Icon: lucide:search from @iconify
   - Placeholder: "Tìm kiếm câu hỏi..." (Vietnamese)
   - Background: `#fcfcfd`

3. **Question Table**:
   - Columns: STT (No.), Câu hỏi (Question), Đáp án (Options A/B/C/D), Đáp án đúng (Correct), Độ tin cậy (Confidence)
   - Confidence badges: High (green #39a85e), Medium (yellow #fcb831), Low (red #d3595e)
   - Alternating row colors: white / `#fcfcfd`
   - Border: `1px solid #dee1e6`

4. **Confirm Button**:
   - Text: "Xác nhận kết quả" (Vietnamese)
   - Color: Purple #9a94de
   - Position: Bottom right, sticky or fixed
   - Action: Change task status to "Shuffling", redirect to Task Management

**Custom CSS**:
- `hide-scrollbar`: Hide scrollbar for table overflow
- `text-rendering-optimize`: Better text rendering

**Components Used**:
- Atoms: Input (search), Button (confirm), Badge (confidence levels)
- Molecules: SearchInput, StatusBadge
- Organisms: QuestionTable (with search, sorting)
- Layout: Navbar, PageContainer

**Vietnamese Content**:
```typescript
preview: {
  pageTitle: "Xem trước kết quả phân tích đề thi",
  searchPlaceholder: "Tìm kiếm câu hỏi...",
  tableHeaders: {
    number: "STT",
    question: "Câu hỏi",
    options: "Đáp án",
    correctAnswer: "Đáp án đúng",
    confidence: "Độ tin cậy",
  },
  confidenceLevels: {
    high: "Cao",
    medium: "Trung bình",
    low: "Thấp",
  },
  confirmButton: "Xác nhận kết quả",
  totalQuestions: "Tổng số câu hỏi:",
}
```

---

### 5. Task Management Page (`/tasks`)

**Visily Source**: `html/SiroMix - Task Management/`  
**Route**: `src/app/tasks/page.tsx`  
**User Story**: US5 - Task Management & Polling  
**Priority**: P5

**Layout Specifications**:
- Container padding: `px-4 lg:px-32` (tighter for table density)
- Background: White
- Full width table

**Page Structure**:
1. **Header**:
   - Title: "Quản lý đề thi" (Vietnamese)
   - Create New button: "Tạo đề mới" (purple #9a94de)

2. **Filters** (optional for MVP):
   - Status dropdown
   - Date range picker

3. **Task Table** (Datatable):
   - Columns: Tên đề thi (Name), Môn học (Subject), Trạng thái (Status), Tiến độ (Progress), Ngày tạo (Created), Hành động (Actions)
   - Status badges: Color-coded per status (green/yellow/red/purple/gray)
   - Progress bar: 0-100% with color matching status
   - Download button: Visible only for "Completed" tasks
   - Row click: Navigate to Task Detail page

**Table Styling** (exact Visily):
- Border collapse: `separate`
- Border spacing: `0`
- Header background: `#fcfcfd`
- Row hover: `bg-brand/5` (5% purple tint)
- Checkbox accent: `#7c3aed` (purple for selection)

**Polling**:
- `useEffect` with 3-second interval
- Updates task statuses automatically
- Shows live progress bar updates

**Custom CSS**:
- `hide-scrollbar`: Table horizontal scroll
- Checkbox styling with accent-color

**Components Used**:
- Atoms: Button, Badge, ProgressBar, Checkbox
- Molecules: StatusBadge, TableRow
- Organisms: Datatable (with sorting, pagination, polling)
- Layout: Navbar, PageContainer

**Vietnamese Content**:
```typescript
taskManagement: {
  pageTitle: "Quản lý đề thi",
  createButton: "Tạo đề mới",
  tableHeaders: {
    examName: "Tên đề thi",
    subject: "Môn học",
    status: "Trạng thái",
    progress: "Tiến độ",
    createdDate: "Ngày tạo",
    actions: "Hành động",
  },
  downloadButton: "Tải xuống",
  viewDetails: "Xem chi tiết",
  noTasks: "Chưa có đề thi nào",
}
```

---

### 6. Exam Detail Page (`/tasks/[id]`)

**Visily Source**: `html/SiroMix - Exam Detail/`  
**Route**: `src/app/tasks/[id]/page.tsx`  
**User Story**: US6 - Exam Detail View & Retry  
**Priority**: P6

**Layout Specifications**:
- Container padding: `px-4 lg:px-[120px]` (balanced for content)
- Background: White
- Three-section vertical layout

**Page Structure**:

1. **Breadcrumbs**:
   - "Quản lý đề thi" > "Chi tiết đề thi" (Vietnamese)
   - Color: Gray #565d6d with purple #9a94de on hover

2. **Section 1: Exam Metadata** (Card):
   - Border: `1px solid #dee1e6`
   - Border radius: `rounded-lg`
   - Shadow: `shadow-sm`
   - Grid layout: 2 columns on desktop
   - Fields (Vietnamese labels):
     - Năm học (Academic Year)
     - Tên kì thi (Exam Name)
     - Môn học (Subject)
     - Thời gian (Duration)
     - Số đề (Num Versions)
- Ghi chú (Notes)
     - File gốc (Original Filename)

3. **Section 2: Processing Status** (Card):
   - Status badge: Color-coded
   - Progress bar: 0-100% with gradient
   - Retry button: Visible only if status = "Failed" (text: "Thử lại")
   - Timestamps: Created, Updated (Vietnamese labels)
   - **Logs Section**:
     - Scrollable container (max-height with custom-scrollbar)
     - Log entries: Timestamp + Stage + Message (Vietnamese)
     - Log level colors: Info (blue), Warning (yellow), Error (red)

4. **Section 3: Extracted Data** (Card or Accordion):
   - Question list (reuse QuestionTable from Preview)
   - Show all questions with options and correct answers

**Progress Steps Visual** (Visily custom CSS):
- `step-line-active`: Green gradient line connecting completed steps
- Circle indicators for each stage

**Custom CSS**:
- `step-line-active`: Green gradient for progress steps
- `log-container`: Tabular numbers for timestamps (`font-feature-settings: "tnum"`)
- `custom-scrollbar`: Logs section scrollbar

**Retry Functionality**:
- Button text: "Thử lại" (Vietnamese)
- Debounce: Prevent multiple clicks (NFR-042)
- Action: Reset task to Pending, progress to 0%, add retry log

**Components Used**:
- Atoms: Badge, Button, ProgressBar
- Molecules: Card, StatusBadge, BreadcrumbLink
- Organisms: ExamMetadataDisplay, ProcessingStatusDisplay, QuestionListDisplay
- Layout: Navbar, PageContainer

**Vietnamese Content**:
```typescript
examDetail: {
  breadcrumbs: {
    taskList: "Quản lý đề thi",
    detail: "Chi tiết đề thi",
  },
  sections: {
    metadata: "Thông tin đề thi",
    status: "Trạng thái xử lý",
    extractedData: "Dữ liệu trích xuất",
  },
  metadataLabels: {
    academicYear: "Năm học",
    examName: "Tên kì thi",
    subject: "Môn học",
    duration: "Thời gian",
    numVersions: "Số đề",
    notes: "Ghi chú",
    originalFile: "File gốc",
  },
  statusLabels: {
    currentStatus: "Trạng thái hiện tại",
    progress: "Tiến độ",
    created: "Ngày tạo",
    updated: "Cập nhật lần cuối",
    logs: "Nhật ký xử lý",
  },
  retryButton: "Thử lại",
  downloadButton: "Tải xuống kết quả",
}
```

---

## Shared Layout Components

### Navbar (All Pages)

**Auth State Variants**:
1. **Unauthenticated**:
   - SiroMix logo (left)
   - "Đăng nhập" button (right, purple #9a94de)

2. **Authenticated**:
   - SiroMix logo (left)
   - User avatar (right, rounded-full)
   - Avatar click: Dropdown with "Đăng xuất" (Logout)

**Styling**:
- Background: White
- Border bottom: `1px solid #dee1e6`
- Padding: `px-4 lg:px-32`
- Sticky: Yes (top: 0)

---

## Design System Preservation Rules

Per clarifications Q5, the following MUST NOT be normalized:

| Design Attribute | Preservation Rule | Reasoning |
|-----------------|------------------|-----------|
| **Container Padding** | Homepage 144px, Detail 120px, Create 36px, Tasks 32px | Each page has intentional width based on content type (hero vs form vs table) |
| **Shadows** | shadow-sm vs custom shadow values | Different shadow depths for visual hierarchy |
| **Border Radius** | rounded-md vs rounded-[10px] vs rounded-xl | Context-specific based on component size and importance |
| **Card Styles** | Per-page card variations | Auth, metadata, and content cards have distinct visual treatments |

**Implementation Strategy**: Document exact Visily values in this contract, use page-specific Tailwind classes, NO global normalization.

---

**Page Contracts Complete**: All 6 pages mapped to Visily exports with exact styling specifications and Vietnamese content extraction. Ready for component implementation following atomic design bottom-up approach.
