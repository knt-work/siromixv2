/**
 * Vietnamese UI Content Constants
 * 
 * Centralized Vietnamese text extracted from Visily exports.
 * All UI components must use these constants for consistency.
 * 
 * Reference: Clarifications Q2 - All UI text in Vietnamese
 */

export const UI_TEXT = {
  // Buttons
  buttons: {
    login: 'Đăng nhập',
    loginWithGoogle: 'Đăng nhập bằng Google',
    logout: 'Đăng xuất',
    createExam: 'Tạo đề mới',
    confirm: 'Xác nhận',
    confirmAndContinue: 'Xác nhận và tiếp tục',
    retry: 'Thử lại',
    download: 'Tải xuống',
    submit: 'Gửi',
    cancel: 'Hủy',
    close: 'Đóng',
    save: 'Lưu',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    mixExam: 'Trộn đề thi ngay',
  },

  // Form Labels
  labels: {
    academicYear: 'Năm học',
    examName: 'Tên kì thi',
    subject: 'Môn học',
    duration: 'Thời gian (phút)',
    numVersions: 'Số đề cần trộn',
    notes: 'Ghi chú',
    file: 'File đề thi',
    uploadFile: 'Tải file lên',
    questionNumber: 'STT',
    question: 'Câu hỏi',
    answer: 'Đáp án',
    confidence: 'Độ tin cậy',
    status: 'Trạng thái',
    progress: 'Tiến độ',
    createdDate: 'Ngày tạo',
    taskId: 'Mã đề',
    totalQuestions: 'Tổng số câu hỏi',
  },

  // Form Placeholders
  placeholders: {
    academicYear: 'VD: 2023-2024',
    examName: 'Nhập tên kì thi',
    subject: 'Chọn môn học',
    duration: 'Nhập thời gian',
    numVersions: 'Nhập số đề',
    notes: 'Ghi chú thêm (không bắt buộc)',
    search: 'Tìm kiếm...',
    selectFile: 'Chọn file .doc hoặc .docx',
  },

  // Messages
  messages: {
    // Success messages
    examCreatedSuccess: 'Đã bắt đầu xử lý đề thi!',
    examCreatedSuccessFull: 'Đã tạo đề thi thành công!',
    retryStarted: 'Đã bắt đầu xử lý lại',
    downloadStarted: 'Đang tải xuống...',
    downloadSuccess: 'Đã tải xuống thành công!',
    saveSuccess: 'Đã lưu thành công!',
    deleteSuccess: 'Đã xóa thành công!',

    // Info messages
    previewResults: 'Xem trước kết quả phân tích',
    processing: 'Đang xử lý...',
    pleaseWait: 'Vui lòng chờ...',
    loading: 'Đang tải...',

    // Error messages
    error: 'Đã xảy ra lỗi',
    errorGeneric: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    errorReload: 'Đã xảy ra lỗi. Vui lòng tải lại trang.',
    noDataFound: 'Không tìm thấy dữ liệu',
    noExamsYet: 'Chưa có đề thi nào',

    // Confirmation prompts
    confirmRetry: 'Bạn có chắc muốn thử lại?',
    confirmDelete: 'Bạn có chắc muốn xóa?',

    // Retry limit
    retryLimitReached: 'Đã hết lượt thử lại (tối đa 2 lần)',
  },

  // Task Status (mapped to TaskStatus enum)
  status: {
    pending: 'Chờ xử lý',
    extracting: 'Đang trích xuất',
    understanding: 'Đang phân tích',
    awaiting: 'Chờ xác nhận',
    shuffling: 'Đang trộn đề',
    generating: 'Đang tạo đề',
    completed: 'Hoàn thành',
    failed: 'Thất bại',
  },

  // Log Messages (for pipeline stages)
  logs: {
    startExtract: 'Bắt đầu trích xuất dữ liệu',
    extracting: 'Đang trích xuất câu hỏi từ file',
    startUnderstand: 'Bắt đầu phân tích câu hỏi',
    understanding: 'Đang phân tích cấu trúc câu hỏi',
    awaitingConfirmation: 'Chờ người dùng xác nhận',
    startShuffle: 'Bắt đầu trộn đề',
    shuffling: 'Đang trộn câu hỏi',
    startGenerate: 'Bắt đầu tạo file đề thi',
    generating: 'Đang tạo file đề thi',
    completed: 'Hoàn thành',
    failed: 'Xử lý thất bại',
    retried: 'Đã thử lại lần',
  },

  // Page Titles
  titles: {
    homepage: 'SiroMix - Trộn đề thi nhanh chóng',
    login: 'Đăng nhập vào SiroMix',
    createExam: 'Tạo đề thi mới',
    preview: 'Xem trước đề thi',
    taskManagement: 'Quản lý đề thi',
    examDetail: 'Chi tiết đề thi',
  },

  // Hero Content (Homepage)
  hero: {
    headline: 'Trộn đề thi nhanh chóng với SiroMix',
    subheadline: 'Công cụ AI trộn đề thi thông minh cho giáo viên',
    features: [
      'Trích xuất câu hỏi tự động',
      'Phân tích nội dung thông minh',
      'Tạo nhiều đề khác nhau',
    ],
  },

  // Pagination
  pagination: {
    previous: 'Trước',
    next: 'Sau',
    page: 'Trang',
    of: '/',
    total: 'Tổng số',
    items: 'đề thi',
  },

  // Breadcrumbs
  breadcrumbs: {
    home: 'Trang chủ',
    tasks: 'Quản lý đề thi',
    detail: 'Chi tiết',
    create: 'Tạo mới',
    preview: 'Xem trước',
  },

  // File Upload
  fileUpload: {
    dragDrop: 'Kéo thả file hoặc nhấn để chọn',
    acceptedFormats: 'Chỉ chấp nhận file .doc hoặc .docx',
    maxSize: 'Dung lượng tối đa',
    fileSizeError: 'File vượt quá dung lượng cho phép',
    fileTypeError: 'Chỉ chấp nhận file .doc hoặc .docx',
  },

  // Confidence Levels
  confidence: {
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
  },

  // Time Relative
  time: {
    minutesAgo: 'phút trước',
    hoursAgo: 'giờ trước',
    daysAgo: 'ngày trước',
    justNow: 'Vừa xong',
  },

  // Sections (Detail Page)
  sections: {
    metadata: 'Thông tin đề thi',
    status: 'Trạng thái xử lý',
    data: 'Dữ liệu trích xuất',
    logs: 'Nhật ký xử lý',
  },
} as const;

// Type helper for accessing UI text with autocomplete
export type UITextKey = keyof typeof UI_TEXT;
export type UIButtonKey = keyof typeof UI_TEXT.buttons;
export type UILabelKey = keyof typeof UI_TEXT.labels;
export type UIStatusKey = keyof typeof UI_TEXT.status;
