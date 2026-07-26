/**
 * Chứa text UI dùng lặp lại giữa các component dùng chung.
 */

export const crudScaffoldText = {
  actions: "Thao tác",
  createNotConfigured:
    "Form tạo mới sẽ được cấu hình sau khi backend xác nhận request DTO.",
  editNotConfigured:
    "Form chỉnh sửa sẽ được cấu hình sau khi backend xác nhận request DTO.",
  emptyValue: "—",
  identifier: "ID",
  loadError: "Không thể tải dữ liệu.",
  notConfiguredTitle: "Chưa cấu hình biểu mẫu",
} as const;

export const commonUiText = {
  logout: "Đăng xuất",
} as const;
