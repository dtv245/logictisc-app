/**
 * Bọc Ant Design notification thành NotificationProvider của Refine.
 * Chuẩn hóa các exception, lỗi CRUD, lỗi đăng nhập và mất kết nối server thành thông báo rõ ràng, dễ hiểu.
 */

import { createElement, isValidElement, useMemo, type ReactNode } from "react";
import type { NotificationProvider, OpenNotificationParams } from "@refinedev/core";
import { App, Button } from "antd";
import { useTranslation } from "react-i18next";

// Danh mục ánh xạ tên resource sang tiếng Việt
export const RESOURCE_LABELS: Record<string, string> = {
  customers: "Khách hàng",
  employees: "Nhân viên",
  terminals: "Bến bãi",
  trucks: "Xe tải",
  loads: "Chuyến hàng",
  trips: "Chuyến đi",
  invoices: "Hóa đơn",
  payments: "Khoản thanh toán",
  documents: "Tài liệu",
  notifications: "Thông báo",
  "load-board": "Sàn giao dịch tải",
  containers: "Container",
  drivers: "Tài xế",
  "hos-eld": "Nhật ký HOS/ELD",
  dvir: "Báo cáo DVIR",
  maintenance: "Bảo trì",
  accidents: "Tai nạn & Sự cố",
  expenses: "Chi phí",
  products: "Sản phẩm",
  roles: "Vai trò & Quyền",
  settlements: "Quyết toán tài xế",
  payroll: "Bảng lương",
  payslips: "Phiếu lương",
};

// Danh mục thông điệp lỗi nghiệp vụ và hệ thống
export const ERROR_CODE_TRANSLATIONS: Record<string, string> = {
  // Lỗi mạng, kết nối & máy chủ
  ERR_NETWORK: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng Internet.",
  ECONNABORTED: "Hết thời gian chờ kết nối máy chủ (Timeout). Vui lòng thử lại sau.",
  ETIMEDOUT: "Hết thời gian chờ kết nối máy chủ (Timeout). Vui lòng kiểm tra lại đường truyền mạng.",
  NETWORK_ERROR: "Mất kết nối với máy chủ. Vui lòng kiểm tra lại mạng Internet.",
  UNKNOWN_TRANSPORT_ERROR: "Lỗi kết nối truyền tải không xác định giữa trình duyệt và máy chủ.",
  INVALID_API_RESPONSE: "Phản hồi từ máy chủ không đúng định dạng chuẩn.",

  // Lỗi xác thực & đăng nhập
  LARK_AUTH_CANCELLED: "Đăng nhập qua Lark SSO đã bị hủy hoặc bạn đã từ chối cấp quyền.",
  LARK_CODE_MISSING: "Không nhận được mã xác thực từ Lark. Vui lòng thử đăng nhập lại.",
  LARK_API_CLIENT_REQUIRED: "Hệ thống chưa sẵn sàng cấu hình kết nối đăng nhập Lark.",
  AUTH_REQUEST_FAILED: "Yêu cầu xác thực tài khoản thất bại. Vui lòng kiểm tra lại thông tin.",
  TOKEN_REFRESH_RETURNED_NO_TOKEN: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn hoặc thông tin xác thực không hợp lệ.",
  FORBIDDEN: "Bạn không có quyền hạn thực hiện thao tác này.",

  // Lỗi CRUD, dữ liệu & xung đột
  CONCURRENT_MODIFICATION_CONFLICT: "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang.",
  INVOICE_IMMUTABLE_HISTORY: "Hóa đơn đã chốt trong lịch sử tài chính, không thể chỉnh sửa trực tiếp. Vui lòng dùng lệnh điều chỉnh billing.",
  PAYMENT_AMOUNT_INVALID: "Số tiền thanh toán không hợp lệ. Vui lòng nhập số tiền dương với tối đa 2 chữ số thập phân.",
  PAYMENT_EXCEEDS_INVOICE_BALANCE: "Số tiền thanh toán vượt quá số dư còn lại của hóa đơn.",
  PAYMENT_IDEMPOTENCY_CONFLICT: "Khóa giao dịch này thuộc về một ý định thanh toán khác.",
  CURRENCY_MISMATCH: "Đơn vị tiền tệ thanh toán không khớp với hóa đơn.",
  DECIMAL_PRECISION_UNSUPPORTED: "Client không biểu diễn chính xác được số tiền này. Chưa gửi giá trị làm tròn.",
  CONTRACT_VERSION_UNAVAILABLE: "Backend chưa cung cấp phiên bản dữ liệu/hợp đồng để chỉnh sửa.",
  COMMAND_INTENT_FROZEN: "Lệnh trước đó chưa xác định kết quả. Vui lòng chờ trước khi gửi lệnh mới.",
  LOAD_PICKUP_DATE_CONFLICT: "Ngày lấy hàng nghiệp vụ đã thay đổi. Vui lòng đọc lại ngày và mã audit hiện tại.",
  INVALID_FLEET_REPORT_PERIOD: "Kiểm tra kỳ báo cáo, múi giờ và ngày kết thúc (không được nằm trong tương lai).",
  FLEET_VALIDATION_REQUIRED: "Kiểm tra policy đã công bố và danh sách xe khác nhau.",
  COMMAND_RESOURCE_REQUIRES_FEATURE_ADAPTER: "Thao tác này yêu cầu form nghiệp vụ chuyên biệt, không hỗ trợ CRUD trực tiếp.",
  CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER: "Bộ lọc và sắp xếp nâng cao cần bộ chuyển đổi nghiệp vụ chuyên biệt.",
  INVALID_RECORD_RESPONSE: "Dữ liệu bản ghi trả về từ máy chủ không hợp lệ.",
  INVALID_RECORD_ID: "Mã định danh (ID) bản ghi không hợp lệ.",
  INVALID_PAGED_RESPONSE: "Dữ liệu danh sách phân trang không hợp lệ.",
  EMPTY_CUSTOM_RESPONSE: "Dữ liệu phản hồi từ máy chủ bị trống.",
  SETTLEMENT_ALREADY_LOCKED: "Bảng quyết toán đã bị khóa sổ, không thể chỉnh sửa hoặc thao tác.",
  TRIP_ALREADY_DISPATCHED: "Chuyến xe đã được điều phối, không thể thay đổi thông tin hành trình.",
  HOS_VIOLATION: "Tài xế đã vượt quá số giờ làm việc cho phép theo quy định HOS/ELD.",
  DVIR_DEFECT_UNRESOLVED: "Phương tiện có lỗi kỹ thuật trong biên bản DVIR chưa được xác nhận sửa chữa.",
};

/** Tìm tên tiếng Việt của resource từ key hoặc message */
export const detectResourceName = (key?: string, text?: string): string | undefined => {
  const combined = `${key ?? ""} ${text ?? ""}`.toLowerCase();
  for (const [resKey, label] of Object.entries(RESOURCE_LABELS)) {
    const singular = resKey.replace(/s$/, "");
    if (combined.includes(resKey) || (singular.length > 3 && combined.includes(singular))) {
      return label;
    }
  }
  return undefined;
};

/** Nhận diện loại thao tác CRUD / Auth */
export type OperationType = "create" | "update" | "delete" | "read" | "auth" | "unknown";

export const detectOperation = (key?: string, message?: string): OperationType => {
  const combined = `${key ?? ""} ${message ?? ""}`.toLowerCase();
  if (
    combined.includes("login") ||
    combined.includes("auth") ||
    combined.includes("lark") ||
    combined.includes("đăng nhập") ||
    combined.includes("xác thực")
  ) {
    return "auth";
  }
  if (
    combined.includes("creat") ||
    combined.includes("tạo") ||
    combined.includes("thêm")
  ) {
    return "create";
  }
  if (
    combined.includes("edit") ||
    combined.includes("updat") ||
    combined.includes("sửa") ||
    combined.includes("cập nhật")
  ) {
    return "update";
  }
  if (
    combined.includes("delet") ||
    combined.includes("remove") ||
    combined.includes("xóa") ||
    combined.includes("hủy")
  ) {
    return "delete";
  }
  if (
    combined.includes("list") ||
    combined.includes("getone") ||
    combined.includes("getmany") ||
    combined.includes("tải") ||
    combined.includes("truy vấn")
  ) {
    return "read";
  }
  return "unknown";
};

/** Trích xuất mã trạng thái HTTP (status code) nếu có */
export const extractStatusCode = (message?: string, description?: string): number | undefined => {
  const combined = `${message ?? ""} ${description ?? ""}`;
  const match = combined.match(/(?:status code:?|mã:?|http_?|mã trạng thái:?)\s*(\d{3})/i) ||
                combined.match(/\b(400|401|403|404|409|422|500|502|503|504)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (combined.includes("status code: 0") || combined.includes("HTTP_0")) {
    return 0;
  }
  return undefined;
};

/** Format nội dung description một cách an toàn và chi tiết */
export const formatDescriptionContent = (rawDescription: unknown): ReactNode => {
  if (!rawDescription) return undefined;
  if (isValidElement(rawDescription)) return rawDescription;

  if (typeof rawDescription === "object") {
    const obj = rawDescription as Record<string, unknown>;
    const errorsMap = (obj.errors && typeof obj.errors === "object" ? obj.errors : obj) as Record<string, unknown>;
    const lines: string[] = [];
    for (const [field, val] of Object.entries(errorsMap)) {
      if (Array.isArray(val)) {
        lines.push(`${field}: ${val.join(", ")}`);
      } else if (typeof val === "string" && field !== "message" && field !== "code" && field !== "name") {
        lines.push(`${field}: ${val}`);
      }
    }
    if (lines.length > 0) {
      return createElement(
        "div",
        { style: { marginTop: 4 } },
        lines.map((line, idx) =>
          createElement("div", { key: idx, style: { fontSize: 13, lineHeight: "1.4" } }, `• ${line}`)
        )
      );
    }
    if (typeof obj.message === "string") {
      return formatDescriptionContent(obj.message);
    }
    return JSON.stringify(rawDescription);
  }

  if (typeof rawDescription === "string") {
    const trimmed = rawDescription.trim();

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatDescriptionContent(parsed);
      } catch {
        // Tiếp tục xử lý như chuỗi thông thường
      }
    }

    if (ERROR_CODE_TRANSLATIONS[trimmed]) {
      return ERROR_CODE_TRANSLATIONS[trimmed];
    }

    for (const [code, trans] of Object.entries(ERROR_CODE_TRANSLATIONS)) {
      if (trimmed.includes(code)) {
        return trans;
      }
    }

    return trimmed;
  }

  return String(rawDescription);
};

/** Chuẩn hóa và làm rõ tiêu đề cùng nội dung thông báo */
export const resolveNotificationContent = (params: OpenNotificationParams): {
  message: ReactNode;
  description?: ReactNode;
  duration?: number;
} => {
  const { type, message: rawMessage, description: rawDescription, key } = params;
  const messageStr = typeof rawMessage === "string" ? rawMessage : "";
  const descStr = typeof rawDescription === "string" ? rawDescription : "";
  const operation = detectOperation(key, messageStr);
  const resourceName = detectResourceName(key, messageStr);
  const statusCode = extractStatusCode(messageStr, descStr);

  const isNetworkError =
    statusCode === 0 ||
    messageStr.includes("Network Error") ||
    descStr.includes("Network Error") ||
    descStr.includes("ERR_NETWORK") ||
    descStr.includes("ECONNABORTED") ||
    descStr.includes("ETIMEDOUT") ||
    descStr.includes("timeout") ||
    messageStr.includes("mất kết nối") ||
    descStr.includes("mất kết nối");

  const isTimeout =
    descStr.includes("ECONNABORTED") ||
    descStr.includes("ETIMEDOUT") ||
    descStr.includes("timeout") ||
    messageStr.includes("timeout") ||
    statusCode === 504;

  const isAuthError =
    operation === "auth" ||
    statusCode === 401 ||
    messageStr.includes("401") ||
    descStr.includes("401") ||
    descStr.includes("UNAUTHORIZED") ||
    descStr.includes("LARK_") ||
    descStr.includes("AUTH_REQUEST_FAILED");

  const isForbidden =
    statusCode === 403 ||
    messageStr.includes("403") ||
    descStr.includes("FORBIDDEN") ||
    descStr.includes("ACCESS_DENIED");

  const isNotFound =
    statusCode === 404 ||
    messageStr.includes("404") ||
    descStr.includes("NOT_FOUND");

  const isConflict =
    statusCode === 409 ||
    messageStr.includes("409") ||
    descStr.includes("CONCURRENT_MODIFICATION_CONFLICT");

  const isServerError =
    statusCode !== undefined &&
    statusCode >= 500 &&
    statusCode < 600 &&
    !isNetworkError;

  // Xử lý thông báo thành công (Success)
  if (type === "success") {
    let title: ReactNode = rawMessage;
    if (operation === "create") {
      title = resourceName ? `Tạo mới ${resourceName} thành công` : "Tạo mới thành công";
    } else if (operation === "update") {
      title = resourceName ? `Cập nhật ${resourceName} thành công` : "Cập nhật thành công";
    } else if (operation === "delete") {
      title = resourceName ? `Xóa ${resourceName} thành công` : "Xóa thành công";
    } else if (operation === "auth") {
      title = "Đăng nhập thành công";
    } else if (messageStr.startsWith("Successfully") || messageStr === "success" || messageStr === "Successful") {
      title = "Thao tác thành công";
    }
    return {
      message: title,
      description: formatDescriptionContent(rawDescription),
      duration: 3.5,
    };
  }

  // Xử lý thông báo tiến trình (Progress / Undoable)
  if (type === "progress") {
    return {
      message: rawMessage || "Đang thực hiện thao tác (có thể hoàn tác)",
      description: formatDescriptionContent(rawDescription),
      duration: (params.undoableTimeout ?? 5000) / 1000,
    };
  }

  // Xử lý thông báo lỗi (Error)
  if (type === "error") {
    let finalTitle: ReactNode = rawMessage;
    let finalDesc: ReactNode = formatDescriptionContent(rawDescription);

    // 1. Mất kết nối server / mạng / timeout
    if (isNetworkError) {
      finalTitle = isTimeout ? "Hết thời gian chờ kết nối máy chủ" : "Mất kết nối với máy chủ";
      finalDesc = isTimeout
        ? "Yêu cầu vượt quá thời gian chờ phản hồi (Timeout). Vui lòng kiểm tra lại chất lượng đường truyền mạng hoặc thử lại sau."
        : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng Internet hoặc máy chủ đang tạm ngừng hoạt động.";
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 2. Lỗi đăng nhập & xác thực
    if (isAuthError) {
      if (descStr.includes("LARK_AUTH_CANCELLED")) {
        finalTitle = "Đăng nhập không thành công";
        finalDesc = "Quá trình đăng nhập qua Lark SSO đã bị hủy hoặc bạn đã từ chối cấp quyền.";
      } else if (descStr.includes("LARK_CODE_MISSING")) {
        finalTitle = "Đăng nhập không thành công";
        finalDesc = "Không nhận được mã xác thực từ dịch vụ Lark. Vui lòng thử đăng nhập lại.";
      } else if (descStr.includes("LARK_API_CLIENT_REQUIRED")) {
        finalTitle = "Lỗi cấu hình xác thực";
        finalDesc = "Cấu hình kết nối đăng nhập Lark chưa sẵn sàng. Vui lòng liên hệ quản trị hệ thống.";
      } else if (statusCode === 401 || descStr.includes("SESSION_EXPIRED") || descStr.includes("TOKEN_REFRESH")) {
        finalTitle = "Hết hạn phiên đăng nhập";
        finalDesc = "Phiên làm việc đã hết hạn hoặc thông tin xác thực không hợp lệ. Vui lòng đăng nhập lại.";
      } else {
        finalTitle = "Đăng nhập không thành công";
        finalDesc = "Tài khoản hoặc mật khẩu không chính xác, hoặc không thể xác thực danh tính.";
      }
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 3. Lỗi không có quyền (403)
    if (isForbidden) {
      finalTitle = "Không có quyền truy cập";
      finalDesc = "Tài khoản của bạn không có quyền hạn thực hiện thao tác này. Vui lòng liên hệ quản trị viên.";
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 4. Lỗi không tìm thấy (404)
    if (isNotFound) {
      finalTitle = "Không tìm thấy dữ liệu";
      finalDesc = "Bản ghi yêu cầu không tồn tại hoặc đã bị xóa trước đó.";
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 5. Xung đột dữ liệu / Concurrency (409)
    if (isConflict) {
      finalTitle = "Xung đột dữ liệu";
      finalDesc = "Dữ liệu đã bị thay đổi bởi người dùng khác hoặc phiên bản không khớp. Vui lòng tải lại trang để lấy dữ liệu mới nhất.";
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 6. Lỗi máy chủ nội bộ (500, 502, 503)
    if (isServerError) {
      if (operation === "create") {
        finalTitle = resourceName ? `Tạo mới ${resourceName} thất bại (Lỗi máy chủ)` : "Tạo mới thất bại (Lỗi máy chủ)";
      } else if (operation === "update") {
        finalTitle = resourceName ? `Cập nhật ${resourceName} thất bại (Lỗi máy chủ)` : "Cập nhật thất bại (Lỗi máy chủ)";
      } else if (operation === "delete") {
        finalTitle = resourceName ? `Xóa ${resourceName} thất bại (Lỗi máy chủ)` : "Xóa dữ liệu thất bại (Lỗi máy chủ)";
      } else if (operation === "read") {
        finalTitle = resourceName ? `Tải danh sách ${resourceName} thất bại (Lỗi máy chủ)` : "Tải dữ liệu thất bại (Lỗi máy chủ)";
      } else {
        finalTitle = `Lỗi hệ thống máy chủ (${statusCode})`;
      }
      finalDesc = `Máy chủ đang gặp sự cố nội bộ (mã ${statusCode}). Đội ngũ kỹ thuật đang xử lý, vui lòng thử lại sau giây lát.`;
      return { message: finalTitle, description: finalDesc, duration: 6 };
    }

    // 7. Lỗi CRUD thông thường (Create / Update / Delete / Read)
    if (operation === "create") {
      finalTitle = resourceName ? `Tạo mới ${resourceName} thất bại` : "Tạo mới thất bại";
      if (!finalDesc || finalDesc === messageStr || finalDesc === rawDescription) {
        finalDesc = formatDescriptionContent(rawDescription) || "Dữ liệu gửi lên không hợp lệ hoặc máy chủ từ chối yêu cầu. Vui lòng kiểm tra lại.";
      }
    } else if (operation === "update") {
      finalTitle = resourceName ? `Cập nhật ${resourceName} thất bại` : "Cập nhật thất bại";
      if (!finalDesc || finalDesc === messageStr || finalDesc === rawDescription) {
        finalDesc = formatDescriptionContent(rawDescription) || "Không thể lưu thông tin cập nhật. Vui lòng kiểm tra lại dữ liệu và thử lại.";
      }
    } else if (operation === "delete") {
      finalTitle = resourceName ? `Xóa ${resourceName} thất bại` : "Xóa dữ liệu thất bại";
      if (!finalDesc || finalDesc === messageStr || finalDesc === rawDescription) {
        finalDesc = formatDescriptionContent(rawDescription) || "Không thể xóa bản ghi này (có thể do ràng buộc dữ liệu hoặc quyền hạn).";
      }
    } else if (operation === "read") {
      finalTitle = resourceName ? `Tải danh sách ${resourceName} thất bại` : "Tải dữ liệu thất bại";
      if (!finalDesc || finalDesc === messageStr || finalDesc === rawDescription) {
        finalDesc = formatDescriptionContent(rawDescription) || "Không thể tải dữ liệu từ máy chủ. Vui lòng thử tải lại trang.";
      }
    } else {
      if (
        messageStr.includes("There was an error creating") ||
        messageStr.startsWith("Error when updating") ||
        messageStr.startsWith("Error (status code")
      ) {
        finalTitle = "Thao tác không thành công";
      }
      finalDesc = formatDescriptionContent(rawDescription) || "Đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại.";
    }

    return {
      message: finalTitle,
      description: finalDesc,
      duration: 5.5,
    };
  }

  return {
    message: rawMessage,
    description: formatDescriptionContent(rawDescription),
    duration: 4.5,
  };
};

const getNotificationKey = (params: OpenNotificationParams): string =>
  params.key ?? `${params.type}-${typeof params.message === "string" ? params.message : "notification"}`;

export const useAntdNotificationProvider = (): NotificationProvider => {
  const { notification } = App.useApp();
  const { t } = useTranslation();

  return useMemo(
    () => ({
      open: (params: OpenNotificationParams) => {
        const resolved = resolveNotificationContent(params);
        const config = {
          key: getNotificationKey(params),
          message: resolved.message,
          description: resolved.description,
          duration: resolved.duration,
          btn: params.cancelMutation
            ? createElement(
                Button,
                { size: "small", onClick: params.cancelMutation },
                t("common.undo"),
              )
            : undefined,
        };

        if (params.type === "success") {
          notification.success(config);
        } else if (params.type === "error") {
          notification.error(config);
        } else {
          notification.open(config);
        }
      },
      close: (key: string) => notification.destroy(key),
    }),
    [notification, t],
  );
};
