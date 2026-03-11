# Manual E2E Testing Checklist

**Feature**: 002-ui-mock-mvp  
**Purpose**: Validate all 6 user stories work end-to-end with Vietnamese content and purple branding  
**Date**: 2026-03-11

---

## Prerequisites

- [ ] `npm install` completed successfully
- [ ] `npm run dev` running on http://localhost:3000
- [ ] Browser opened (Chrome/Edge recommended for DevTools)
- [ ] No console errors on page load

---

## User Story 1: Homepage with Hero Section

**Objective**: Public homepage displays correctly with Vietnamese content and purple branding

### Test Steps

1. [ ] Navigate to http://localhost:3000
2. [ ] **Hero Section** displays:
   - [ ] Title: "SiroMix - Trộn đề thi nhanh chóng"
   - [ ] Subtitle with Vietnamese text about automatic exam shuffling
   - [ ] Purple "Bắt đầu sử dụng" button (#9a94de)
   - [ ] "Hướng dẫn" outline button
3. [ ] **Features Section** shows 3 cards:
   - [ ] ⚡ "Nhanh chóng" card
   - [ ] 🎯 "Chính xác" card
   - [ ] 📝 "Dễ sử dụng" card
4. [ ] **Navbar** displays:
   - [ ] SiroMix logo with purple color
   - [ ] "Trang chủ", "Hướng dẫn", "Đăng nhập" links
5. [ ] Click "Bắt đầu sử dụng" → redirects to `/login`
6. [ ] Click "Hướng dẫn" → redirects to `/guide`

**Expected Results**: All Vietnamese text renders correctly, purple accent color visible, no layout shifts

---

## User Story 2: Simulated Google OAuth Login

**Objective**: Login flow works with mock authentication (Trieu Kiem user)

### Test Steps

1. [ ] On `/login` page, verify:
   - [ ] Title: "Đăng nhập vào SiroMix"
   - [ ] Description about Google account login
   - [ ] Google button with icon and text "Đăng nhập bằng Google"
2. [ ] Click "Đăng nhập bằng Google"
3. [ ] **Loading state** shows:
   - [ ] Button disabled
   - [ ] Spinner icon
   - [ ] Text changes to "Đang đăng nhập..."
4. [ ] After 1-2 seconds, redirect to `/tasks`
5. [ ] **Navbar** now shows:
   - [ ] User avatar (IMG_1.webp) or initials "TK"
   - [ ] Username "Trieu Kiem"
   - [ ] Dropdown with "Đăng xuất" option
6. [ ] Click avatar → dropdown opens
7. [ ] Click "Đăng xuất" → returns to homepage

**Expected Results**: Trieu Kiem user authenticated, avatar displays, logout works

---

## User Story 3: Create Exam with File Upload

**Objective**: Create exam form accepts file and metadata with Vietnamese validation

### Test Steps

1. [ ] Navigate to `/exams/create` (or click "Tạo đề mới" button)
2. [ ] **Form displays** all fields:
   - [ ] "Tải lên file đề thi *" with FileUpload component
   - [ ] "Tên đề thi *" input
   - [ ] "Phần A - Câu bắt đầu" and "Câu kết thúc" inputs
   - [ ] "Phần B - Câu bắt đầu" and "Câu kết thúc" inputs
   - [ ] "Số đề" input
3. [ ] **FileUpload component** shows:
   - [ ] "Kéo thả file vào đây hoặc" text
   - [ ] "Chọn file" button
   - [ ] "Hỗ trợ: .doc, .docx (tối đa 20MB)" help text
4. [ ] Click "Tạo đề thi" WITHOUT uploading file:
   - [ ] Error message: "Vui lòng chọn file đề thi"
5. [ ] Upload a .docx file (mock or real):
   - [ ] File preview shows filename
   - [ ] Remove button (X) appears
6. [ ] Fill in form:
   - [ ] Exam name: "Đề thi Giữa kỳ Toán 1"
   - [ ] Part A: 1 to 10
   - [ ] Part B: 11 to 15
   - [ ] Variant count: 4
7. [ ] Click "Tạo đề thi"
8. [ ] **Toast notification** appears:
   - [ ] Success icon (green checkmark)
   - [ ] Message: "Đã tạo đề thi thành công"
   - [ ] Auto-dismisses after 3 seconds
9. [ ] Redirect to `/exams/preview/[taskId]`

**Expected Results**: Vietnamese labels, purple submit button, file validation works, toast notification shows

---

## User Story 4: Preview Analysis Results

**Objective**: Preview page shows extracted questions with Vietnamese table headers

### Test Steps

1. [ ] On `/exams/preview/[taskId]` page, verify:
   - [ ] Title: exam name "Đề thi Giữa kỳ Toán 1"
   - [ ] Subtitle: "Xác nhận và tạo đề thi"
2. [ ] **Metadata Card** displays:
   - [ ] "Tên đề:" with exam name
   - [ ] "Số câu:" with question count (e.g., "15 câu")
   - [ ] "Số đề:" with variant count (e.g., "4 đề")
3. [ ] **Question Preview Table** shows:
   - [ ] Headers: "STT", "Câu hỏi", "Đáp án", "Độ tin cậy"
   - [ ] At least 5 sample questions
   - [ ] Confidence badges (green/yellow/red) with percentages
   - [ ] Correct answer badges (A/B/C/D circles)
4. [ ] **Confidence badges** color-coded:
   - [ ] Green for ≥85% confidence
   - [ ] Yellow for 70-84% confidence
   - [ ] Red for <70% confidence
5. [ ] Click "Xác nhận và tạo đề"
6. [ ] **Toast notification**: "Đang tạo đề thi..."
7. [ ] Redirect to `/tasks`

**Expected Results**: Vietnamese table headers, confidence badges match design, navigation works

---

## User Story 5: Task Management with Status Polling

**Objective**: Task list displays with Vietnamese status badges and polling simulation

### Test Steps

1. [ ] On `/tasks` page, verify:
   - [ ] Title: "Danh sách đề thi"
   - [ ] "Tạo đề mới" purple button in header
2. [ ] **Datatable** displays tasks:
   - [ ] Columns: "Tên file", "Trạng thái", "Số câu hỏi", "Ngày tạo"
   - [ ] At least 1 task from creation
   - [ ] Status badge shows current state
3. [ ] **Status badges** with Vietnamese labels:
   - [ ] Gray badge: "Chờ xử lý" (queued)
   - [ ] Blue badge: "Đang xử lý" (running)
   - [ ] Green badge: "Hoàn thành" (completed)
   - [ ] Red badge: "Thất bại" (failed)
4. [ ] **Polling simulation** (if task is running):
   - [ ] Status auto-updates every 2 seconds
   - [ ] Progress bar animates
   - [ ] Eventually reaches "Hoàn thành"
5. [ ] **Pagination** (if >10 tasks):
   - [ ] Shows "Trang 1/X" text
   - [ ] "Trước" and "Sau" buttons
   - [ ] Purple active page indicator
6. [ ] **Sorting**:
   - [ ] Click "Ngày tạo" header
   - [ ] Arrow icon shows sort direction
   - [ ] Tasks reorder by date
7. [ ] Click on a task row → navigates to `/tasks/[taskId]`

**Expected Results**: Vietnamese labels, purple branding, polling works, navigation functional

---

## User Story 6: Task Detail with Retry

**Objective**: Detail page shows 3 sections with Vietnamese labels and retry functionality

### Test Steps

1. [ ] On `/tasks/[taskId]` page, verify:
   - [ ] "Quay lại" back button with arrow icon
   - [ ] Exam name as page title
   - [ ] Filename as subtitle
2. [ ] **Section 1: Trạng thái xử lý** (Processing Status):
   - [ ] Status badge with current state
   - [ ] Progress bar (if running)
   - [ ] Stage indicator with Vietnamese labels:
     - [ ] "Chờ xử lý", "Trích xuất", "Đọc hiểu", "Xác nhận", "Trộn đề", "Tạo files"
   - [ ] Current stage highlighted in purple
3. [ ] **Section 2: Danh sách log** (if logs exist):
   - [ ] Timeline view with log entries
   - [ ] Timestamps in Vietnamese format
   - [ ] Log level badges (INFO, WARNING, ERROR)
4. [ ] **Section 3: Danh sách câu hỏi** (if completed):
   - [ ] Question count header: "(15 câu)"
   - [ ] "Xuất file" button
   - [ ] QuestionList component in detailed variant
   - [ ] All questions with confidence badges
5. [ ] **Retry functionality** (if status is "failed"):
   - [ ] "Thử lại" button appears (purple)
   - [ ] Click "Thử lại"
   - [ ] **Confirmation modal** opens:
     - [ ] Title: "Xác nhận thử lại"
     - [ ] Message: "Bạn có muốn thử lại xử lý đề thi này không?"
     - [ ] "Hủy" button
     - [ ] "Thử lại" button (purple)
   - [ ] Click "Thử lại" in modal
   - [ ] **Toast notification**: "Đã gửi yêu cầu thử lại"
   - [ ] Status changes to "Đang xử lý"
   - [ ] Progress resets to 0%
6. [ ] **Download functionality** (if completed):
   - [ ] Click "Xuất file" button
   - [ ] Mock download initiates (browser download notification)

**Expected Results**: 3 sections display correctly, retry flow works with Vietnamese confirmation, all Vietnamese labels present

---

## Cross-Browser Testing

**Objective**: Verify compatibility across browsers

### Browsers to Test

- [ ] **Chrome/Edge** (Chromium)
  - [ ] All features work
  - [ ] Purple color renders correctly
  - [ ] Vietnamese characters display properly
- [ ] **Firefox** (Gecko)
  - [ ] All features work
  - [ ] No font rendering issues
- [ ] **Safari** (WebKit) - Mac only
  - [ ] All features work
  - [ ] Date formats correct

---

## Responsive Design Testing

**Objective**: Verify mobile and tablet layouts

### Device Sizes

- [ ] **Desktop** (1920x1080)
  - [ ] Full datatable visible
  - [ ] Navbar horizontal layout
- [ ] **Tablet** (768x1024)
  - [ ] Responsive grid (2 columns → 1 column)
  - [ ] Datatable scrolls horizontally if needed
- [ ] **Mobile** (375x667)
  - [ ] Navbar collapses to hamburger menu
  - [ ] Cards stack vertically
  - [ ] Buttons go full-width
  - [ ] Vietnamese text wraps correctly

---

## Accessibility Testing

**Objective**: Verify keyboard navigation and screen reader support

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus visible with purple outline (#9a94de)
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate dropdowns

### Screen Reader

- [ ] `aria-label` on icon buttons (Vietnamese: "Đăng nhập", "Tìm kiếm")
- [ ] Form labels properly associated with inputs
- [ ] Modal has `role="dialog"` and `aria-labelledby`
- [ ] Status updates announced (live regions)

---

## Performance Testing

**Objective**: Verify smooth interactions and fast load times

### Metrics

- [ ] Homepage loads in <2 seconds (dev mode)
- [ ] No layout shift (CLS) on initial load
- [ ] Datatable renders 20+ rows smoothly
- [ ] Modal animations smooth (60fps)
- [ ] Toast notifications slide in without jank
- [ ] Image loading doesn't block interaction

---

## Vietnamese Content Validation

**Objective**: Ensure all Vietnamese text renders without mojibake

### Check Vietnamese Characters

- [ ] Accented characters display: á, à, ả, ã, ạ, ă, ắ, ằ, ẳ, ẵ, ặ, â, ấ, ầ, ẩ, ẫ, ậ
- [ ] No �� replacement characters
- [ ] Font supports Vietnamese (Inter font confirmed)
- [ ] Consistent tone marks across all text

### Content Review

- [ ] All buttons have Vietnamese labels
- [ ] All form inputs have Vietnamese placeholders
- [ ] All error messages in Vietnamese
- [ ] All toast notifications in Vietnamese
- [ ] All table headers in Vietnamese
- [ ] No English text visible to end users (except technical terms like "Google OAuth")

---

## Purple Branding Validation

**Objective**: Verify purple #9a94de color appears throughout UI

### Purple Elements

- [ ] Primary buttons background
- [ ] Logo accent color
- [ ] Progress bars fill
- [ ] Active pagination indicator
- [ ] Current stage in ProcessingStatus
- [ ] Info badges
- [ ] Focus outline rings
- [ ] Hover states on interactive elements

---

## Final Sign-Off

- [ ] **All 6 user stories tested and passed**
- [ ] **All Vietnamese content displays correctly**
- [ ] **Purple branding (#9a94de) visible throughout**
- [ ] **Trieu Kiem user authentication works**
- [ ] **No console errors or warnings**
- [ ] **All accessibility checks passed**
- [ ] **Responsive design verified on 3 device sizes**
- [ ] **Production build tested** (`npm run build && npm start`)

---

## Issues Found

| Issue # | Page | Description | Severity | Status |
|---------|------|-------------|----------|--------|
| _Example:_ | _/tasks_ | _Datatable pagination showing English "Page" instead of "Trang"_ | _Medium_ | _Fixed_ |
| | | | | |
| | | | | |

---

**Testing Completed By**: _____________  
**Date**: _____________  
**Sign-Off**: _____________
