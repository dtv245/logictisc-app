/**
 * Adapts the existing text-only Refine notification contract to the shared error
 * resolver. Public parsing/formatting helpers retain their original behavior.
 */
import { createElement, isValidElement, type ReactNode } from "react";
import type { OpenNotificationParams } from "@refinedev/core";
import {
  compatibilityT,
  notificationCodeMessages,
  notificationResourceLabels,
} from "@locales/notificationCompatibility";
import { resolveNotificationError } from "./apiErrorNotification";

// Danh mục ánh xạ tên resource sang tiếng Việt
export const RESOURCE_LABELS = notificationResourceLabels;

// Danh mục thông điệp lỗi nghiệp vụ và hệ thống
export const ERROR_CODE_TRANSLATIONS = notificationCodeMessages;

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

/** Trích xuất mã trạng thái HTTP (status code) nếu có tiền tố tường minh */
export const extractStatusCode = (message?: string, description?: string): number | undefined => {
  const combined = `${message ?? ""} ${description ?? ""}`;
  const match = combined.match(/(?:status code:?|mã:?|http_?|mã trạng thái:?)\s*(\d{3})/i);
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

    return trimmed;
  }

  return String(rawDescription);
};

export const resolveNotificationContent = (params: OpenNotificationParams): {
  message: ReactNode;
  description?: ReactNode;
  duration?: number;
} => {
  const { type, message: rawMessage, description: rawDescription, key } = params;
  const messageStr = typeof rawMessage === "string" ? rawMessage : "";
  const descStr = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const operation = detectOperation(key, messageStr);
  const resourceName = detectResourceName(key, messageStr);
  const statusCode = extractStatusCode(messageStr, descStr);

  // Xử lý thông báo thành công (Success)
  if (type === "success") {
    let title: ReactNode = rawMessage;
    if (messageStr.startsWith("Successfully") || messageStr === "success" || messageStr === "Successful") {
      if (operation === "create") {
        title = resourceName ? compatibilityT("successCreateResource", { resource: resourceName }) : compatibilityT("successCreate");
      } else if (operation === "update") {
        title = resourceName ? compatibilityT("successUpdateResource", { resource: resourceName }) : compatibilityT("successUpdate");
      } else if (operation === "delete") {
        title = resourceName ? compatibilityT("successDeleteResource", { resource: resourceName }) : compatibilityT("successDelete");
      } else if (operation === "auth") {
        title = compatibilityT("successAuth");
      } else {
        title = compatibilityT("successGeneric");
      }
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
      message: rawMessage || compatibilityT("progress"),
      description: formatDescriptionContent(rawDescription),
      duration: (params.undoableTimeout ?? 5000) / 1000,
    };
  }

  if (type === "error") {
    return resolveNotificationError({
      kind: "compatibility",
      statusCode,
      rawMessage: messageStr,
      rawDescription: descStr,
      operation,
      resourceLabel: resourceName,
      message: rawMessage,
      description: formatDescriptionContent(rawDescription),
    });
  }

  return {
    message: rawMessage,
    description: formatDescriptionContent(rawDescription),
    duration: 4.5,
  };
};
