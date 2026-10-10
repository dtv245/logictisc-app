import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { App } from "antd";
import {
  detectResourceName,
  detectOperation,
  extractStatusCode,
  formatDescriptionContent,
  resolveNotificationContent,
  useAntdNotificationProvider,
} from "../../providers/notificationProvider";

describe("notificationProvider helper functions", () => {
  it("detectResourceName nhận diện chính xác tên tiếng Việt từ key và message", () => {
    expect(detectResourceName("trucks-create-notification", "")).toBe("Xe tải");
    expect(detectResourceName(undefined, "There was an error creating loads")).toBe("Chuyến hàng");
    expect(detectResourceName("trips-123", "")).toBe("Chuyến đi");
    expect(detectResourceName("invoices-update", "")).toBe("Hóa đơn");
    expect(detectResourceName(undefined, "updating customers")).toBe("Khách hàng");
    expect(detectResourceName("unknown-key", "random text")).toBeUndefined();
  });

  it("detectOperation nhận diện đúng loại thao tác CRUD và Auth", () => {
    expect(detectOperation("create-truck-notification", "")).toBe("create");
    expect(detectOperation(undefined, "There was an error creating truck")).toBe("create");
    expect(detectOperation("123-trips-notification", "Error when updating trip")).toBe("update");
    expect(detectOperation("delete-load-notification", "")).toBe("delete");
    expect(detectOperation("loads-useList-notification", "")).toBe("read");
    expect(detectOperation("auth-login", "")).toBe("auth");
    expect(detectOperation(undefined, "Lark auth error")).toBe("auth");
  });

  it("extractStatusCode trích xuất đúng mã HTTP", () => {
    expect(extractStatusCode("Error (status code: 400)", "")).toBe(400);
    expect(extractStatusCode("", "HTTP_500")).toBe(500);
    expect(extractStatusCode("There was an error (status code: 0)", "")).toBe(0);
    expect(extractStatusCode("Lỗi 403", "")).toBe(403);
    expect(extractStatusCode("No status code here", "")).toBeUndefined();
  });

  it("formatDescriptionContent format an toàn các loại description", () => {
    // Mã lỗi nghiệp vụ
    expect(formatDescriptionContent("INVOICE_IMMUTABLE_HISTORY")).toBe(
      "Hóa đơn đã chốt trong lịch sử tài chính, không thể chỉnh sửa trực tiếp. Vui lòng dùng lệnh điều chỉnh billing."
    );
    expect(formatDescriptionContent("PAYMENT_EXCEEDS_INVOICE_BALANCE")).toBe(
      "Số tiền thanh toán vượt quá số dư còn lại của hóa đơn."
    );
    expect(formatDescriptionContent("CONCURRENT_MODIFICATION_CONFLICT")).toBe(
      "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang."
    );

    // Object chứa errors theo trường
    const fieldErrors = {
      name: ["Tên là bắt buộc"],
      email: ["Email không hợp lệ"],
    };
    const rendered = formatDescriptionContent(fieldErrors);
    expect(rendered).toBeDefined();

    // Chuỗi JSON
    const jsonStr = JSON.stringify({ errors: { phone: ["Số điện thoại sai"] } });
    const renderedJson = formatDescriptionContent(jsonStr);
    expect(renderedJson).toBeDefined();
  });

  it("resolveNotificationContent xử lý lỗi mất kết nối máy chủ và timeout", () => {
    const netErr = resolveNotificationContent({
      type: "error",
      message: "Network Error",
      description: "ERR_NETWORK",
    });
    expect(netErr.message).toBe("Mất kết nối với máy chủ");
    expect(String(netErr.description)).toContain("Không thể kết nối đến máy chủ");

    const timeoutErr = resolveNotificationContent({
      type: "error",
      message: "timeout of 30000ms exceeded",
      description: "ECONNABORTED",
    });
    expect(timeoutErr.message).toBe("Hết thời gian chờ kết nối máy chủ");
    expect(String(timeoutErr.description)).toContain("Timeout");
  });

  it("resolveNotificationContent xử lý các lỗi đăng nhập và Lark SSO", () => {
    const larkCancelled = resolveNotificationContent({
      type: "error",
      message: "Lark SSO",
      description: "LARK_AUTH_CANCELLED",
    });
    expect(larkCancelled.message).toBe("Đăng nhập không thành công");
    expect(String(larkCancelled.description)).toContain("Lark SSO đã bị hủy");

    const larkMissing = resolveNotificationContent({
      type: "error",
      message: "Lark Login",
      description: "LARK_CODE_MISSING",
    });
    expect(larkMissing.message).toBe("Đăng nhập không thành công");
    expect(String(larkMissing.description)).toContain("Không nhận được mã xác thực");

    const auth401 = resolveNotificationContent({
      type: "error",
      message: "Login failed (status code: 401)",
      description: "UNAUTHORIZED",
    });
    expect(auth401.message).toBe("Hết hạn phiên đăng nhập");
    expect(String(auth401.description)).toContain("Phiên làm việc đã hết hạn");
  });

  it("resolveNotificationContent xử lý rõ ràng các thao tác CRUD", () => {
    // Create
    const createErr = resolveNotificationContent({
      key: "create-trucks-notification",
      type: "error",
      message: "There was an error creating trucks (status code: 400)",
      description: "VALIDATION_FAILED",
    });
    expect(createErr.message).toBe("Tạo mới Xe tải thất bại");
    expect(createErr.description).toBeDefined();

    // Update
    const updateErr = resolveNotificationContent({
      key: "123-trips-notification",
      type: "error",
      message: "Error when updating trips (status code: 409)",
      description: "CONCURRENT_MODIFICATION_CONFLICT",
    });
    expect(updateErr.message).toBe("Xung đột dữ liệu");
    expect(String(updateErr.description)).toContain("Dữ liệu đã bị thay đổi bởi người dùng khác");

    // Delete
    const deleteErr = resolveNotificationContent({
      key: "delete-invoices-notification",
      type: "error",
      message: "Error when deleting invoices (status code: 403)",
      description: "FORBIDDEN",
    });
    expect(deleteErr.message).toBe("Không có quyền truy cập");

    // List
    const listErr = resolveNotificationContent({
      key: "customers-useList-notification",
      type: "error",
      message: "Error (status code: 500)",
      description: "INTERNAL_SERVER_ERROR",
    });
    expect(listErr.message).toBe("Tải danh sách Khách hàng thất bại (Lỗi máy chủ)");
    expect(String(listErr.description)).toContain("Máy chủ đang gặp sự cố nội bộ (mã 500)");
  });

  it("resolveNotificationContent xử lý thông báo thành công cho CRUD", () => {
    const createSuccess = resolveNotificationContent({
      key: "create-trucks-notification",
      type: "success",
      message: "Successfully created trucks",
    });
    expect(createSuccess.message).toBe("Tạo mới Xe tải thành công");

    const updateSuccess = resolveNotificationContent({
      key: "edit-loads-notification",
      type: "success",
      message: "Successfully updated loads",
    });
    expect(updateSuccess.message).toBe("Cập nhật Chuyến hàng thành công");
  });
});

describe("useAntdNotificationProvider hook", () => {
  it("gọi notification của Ant Design với nội dung đã được chuẩn hóa", () => {
    const mockNotification = {
      success: vi.fn(),
      error: vi.fn(),
      open: vi.fn(),
      destroy: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    vi.spyOn(App, "useApp").mockReturnValue({
      notification: mockNotification,
      message: {} as never,
      modal: {} as never,
    });

    const { result } = renderHook(() => useAntdNotificationProvider());
    const provider = result.current;

    // Test error open
    provider.open({
      key: "create-trucks-notification",
      type: "error",
      message: "There was an error creating trucks (status code: 400)",
      description: "VALIDATION_FAILED",
    });

    expect(mockNotification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "create-trucks-notification",
        message: "Tạo mới Xe tải thất bại",
      })
    );

    // Test success open
    provider.open({
      key: "create-trucks-notification",
      type: "success",
      message: "Successfully created trucks",
    });

    expect(mockNotification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "create-trucks-notification",
        message: "Tạo mới Xe tải thành công",
      })
    );

    // Test close
    provider.close("some-key");
    expect(mockNotification.destroy).toHaveBeenCalledWith("some-key");
  });
});
