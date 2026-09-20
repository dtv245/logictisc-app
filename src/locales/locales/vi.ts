/**
 * Vietnamese messages for Phase 0 shared UI primitives.
 *
 * Keys intentionally mirror the English catalogue so missing translations are
 * caught during review instead of silently becoming feature-specific copy.
 */
export const viSharedMessages = {
  asyncState: {
    loading: "Đang tải nội dung",
    emptyTitle: "Chưa có dữ liệu",
    emptyDescription: "Hiện chưa có nội dung để hiển thị.",
  },
  queryError: {
    title: "Không thể tải nội dung",
    description: "Đã xảy ra lỗi khi tải nội dung này.",
  },
  configError: {
    title: "Cần cấu hình ứng dụng",
    description:
      "Ứng dụng không thể khởi động vì cấu hình runtime chưa đầy đủ hoặc không hợp lệ.",
  },
  forbidden: {
    title: "Không có quyền truy cập",
    description: "Bạn không có quyền xem nội dung này.",
  },
  notFound: {
    title: "Không tìm thấy trang",
    description: "Trang này có thể đã được chuyển hoặc không còn tồn tại.",
  },
  actions: {
    retry: "Thử lại",
    goHome: "Về trang chủ",
    confirm: "Xác nhận",
    cancel: "Hủy",
  },
  confirm: {
    pendingAnnouncement: "Thao tác đang được xử lý.",
  },
} as const;
