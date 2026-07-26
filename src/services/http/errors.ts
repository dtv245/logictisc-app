/**
 * Chuyển lỗi Axios/Spring thành HttpError chuẩn của Refine.
 */

import axios from "axios";

import type {
  ApiError,
  ApiErrorPayload,
  ApiValidationErrors,
} from "../../types/api";

const statusMessages: Record<number, string> = {
  400: "Yêu cầu không hợp lệ.",
  401: "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  409: "Dữ liệu đang xung đột với một thay đổi khác.",
  422: "Dữ liệu gửi lên chưa hợp lệ.",
  500: "Máy chủ gặp lỗi. Vui lòng thử lại sau.",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeValidationErrors = (
  errors: unknown,
): ApiValidationErrors | undefined => {
  if (!isRecord(errors)) {
    return undefined;
  }

  const normalized = Object.entries(errors).reduce<ApiValidationErrors>(
    (result, [field, messages]) => {
      if (typeof messages === "string") {
        result[field] = [messages];
      } else if (
        Array.isArray(messages) &&
        messages.every((message) => typeof message === "string")
      ) {
        result[field] = messages;
      }

      return result;
    },
    {},
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const readErrorPayload = (value: unknown): ApiErrorPayload => {
  if (!isRecord(value)) {
    return {};
  }

  return {
    code: typeof value.code === "number" ? value.code : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
    statusCode:
      typeof value.statusCode === "number" ? value.statusCode : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    errors: isRecord(value.errors)
      ? (value.errors as Record<string, string | string[]>)
      : undefined,
  };
};

export class ApiHttpError extends Error implements ApiError {
  statusCode: number;
  errors?: ApiValidationErrors;

  constructor(
    statusCode: number,
    message: string,
    errors?: ApiValidationErrors,
  ) {
    super(message);
    this.name = "ApiHttpError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const normalizeApiError = (error: unknown): ApiHttpError => {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const payload = readErrorPayload(error.response?.data);
    const statusCode =
      error.response?.status ?? payload.statusCode ?? payload.status ?? 500;
    const message =
      payload.message ??
      payload.error ??
      statusMessages[statusCode] ??
      error.message ??
      "Đã xảy ra lỗi khi gọi API.";

    return new ApiHttpError(
      statusCode,
      message,
      normalizeValidationErrors(payload.errors),
    );
  }

  if (error instanceof Error) {
    return new ApiHttpError(500, error.message);
  }

  return new ApiHttpError(500, statusMessages[500]);
};

export const getApiErrorMessage = (error: unknown): string =>
  normalizeApiError(error).message;
