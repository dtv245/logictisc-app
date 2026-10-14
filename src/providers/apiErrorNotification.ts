/**
 * Builds Refine error notifications while the structured HTTP error is still
 * available. Backend sentences are preserved; standalone codes use locales.
 */
import type { OpenNotificationParams } from "@refinedev/core";
import axios from "axios";
import type { TFunction } from "i18next";

import { isRecord, readApiResponse } from "./api/envelope";
import { ApiHttpError, normalizeHttpError } from "./api/httpError";
import { resolveApiErrorMessage } from "./api/errorMessages";
import type { ErrorParams } from "../types/api.types";

interface NotificationError {
  message: string;
  statusCode: number;
  code?: string;
  cause?: unknown;
  params?: ErrorParams;
  hasMachineParams?: boolean;
}

interface ErrorNotificationContext {
  key?: string;
  operation?: "create" | "update" | "delete";
  resourceLabel?: string;
}

const ERROR_LOCALE_KEYS: Record<string, string> = {
  ERR_NETWORK: "notifications.apiFallback.network",
  NETWORK_ERROR: "notifications.apiFallback.network",
  ECONNABORTED: "notifications.apiFallback.timeout",
  ETIMEDOUT: "notifications.apiFallback.timeout",
  UNKNOWN_TRANSPORT_ERROR: "notifications.apiFallback.generic",
  INVALID_API_RESPONSE: "notifications.apiFallback.invalidResponse",
  UNAUTHORIZED: "notifications.apiFallback.unauthorized",
  AUTH_SESSION_EXPIRED: "notifications.apiFallback.unauthorized",
  TOKEN_REFRESH_RETURNED_NO_TOKEN: "notifications.apiFallback.unauthorized",
  FORBIDDEN: "notifications.apiFallback.forbidden",
  ACCESS_DENIED: "notifications.apiFallback.forbidden",
  NOT_FOUND: "notifications.apiFallback.notFound",
  VALIDATION_FAILED: "notifications.apiFallback.validation",
  VALIDATION_ERROR: "notifications.apiFallback.validation",
  CONCURRENT_MODIFICATION_CONFLICT: "notifications.apiFallback.concurrentModification",
  LARK_AUTH_CANCELLED: "notifications.apiCodes.LARK_AUTH_CANCELLED",
  LARK_CODE_MISSING: "notifications.apiCodes.LARK_CODE_MISSING",
  LARK_API_CLIENT_REQUIRED: "notifications.apiCodes.LARK_API_CLIENT_REQUIRED",
  AUTH_REQUEST_FAILED: "notifications.apiFallback.authentication",
  INVOICE_IMMUTABLE_HISTORY: "contractErrors.INVOICE_IMMUTABLE_HISTORY",
  PAYMENT_AMOUNT_INVALID: "contractErrors.PAYMENT_AMOUNT_INVALID",
  PAYMENT_EXCEEDS_INVOICE_BALANCE: "contractErrors.PAYMENT_EXCEEDS_INVOICE_BALANCE",
  PAYMENT_IDEMPOTENCY_CONFLICT: "contractErrors.PAYMENT_IDEMPOTENCY_CONFLICT",
  CURRENCY_MISMATCH: "contractErrors.CURRENCY_MISMATCH",
  DECIMAL_PRECISION_UNSUPPORTED: "contractErrors.DECIMAL_PRECISION_UNSUPPORTED",
  CONTRACT_VERSION_UNAVAILABLE: "contractErrors.CONTRACT_VERSION_UNAVAILABLE",
  COMMAND_INTENT_FROZEN: "contractErrors.COMMAND_INTENT_FROZEN",
  LOAD_PICKUP_DATE_CONFLICT: "contractErrors.LOAD_PICKUP_DATE_CONFLICT",
  INVALID_FLEET_REPORT_PERIOD: "notifications.apiCodes.INVALID_FLEET_REPORT_PERIOD",
  FLEET_VALIDATION_REQUIRED: "notifications.apiCodes.FLEET_VALIDATION_REQUIRED",
  COMMAND_RESOURCE_REQUIRES_FEATURE_ADAPTER: "notifications.apiCodes.COMMAND_RESOURCE_REQUIRES_FEATURE_ADAPTER",
  CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER: "notifications.apiCodes.CUSTOM_FILTERS_AND_SORTERS_REQUIRE_FEATURE_ADAPTER",
  INVALID_RECORD_RESPONSE: "notifications.apiFallback.invalidResponse",
  INVALID_RECORD_ID: "notifications.apiCodes.INVALID_RECORD_ID",
  INVALID_PAGED_RESPONSE: "notifications.apiFallback.invalidResponse",
  EMPTY_CUSTOM_RESPONSE: "notifications.apiFallback.invalidResponse",
  SETTLEMENT_ALREADY_LOCKED: "notifications.apiCodes.SETTLEMENT_ALREADY_LOCKED",
  TRIP_ALREADY_DISPATCHED: "notifications.apiCodes.TRIP_ALREADY_DISPATCHED",
  HOS_VIOLATION: "notifications.apiCodes.HOS_VIOLATION",
  DVIR_DEFECT_UNRESOLVED: "notifications.apiCodes.DVIR_DEFECT_UNRESOLVED",
};

const readNotificationError = (error: unknown): NotificationError => {
  if (error instanceof ApiHttpError) return error;
  // Refine accepts plain HttpError objects too. Treating those as unknown
  // transport errors would discard their message and actual HTTP status.
  if (isRecord(error) && typeof error.message === "string"
      && typeof error.statusCode === "number" && Number.isFinite(error.statusCode)) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: typeof error.code === "string" ? error.code : undefined,
      cause: error.cause,
    };
  }
  return normalizeHttpError(error);
};

const getCodeLocaleKey = (code?: string): string | undefined =>
  code && Object.hasOwn(ERROR_LOCALE_KEYS, code) ? ERROR_LOCALE_KEYS[code] : undefined;

const getTransportKind = (error: NotificationError): "network" | "timeout" | undefined => {
  // statusCode 0 also covers local exceptions; only explicit transport codes
  // identify an actual connection failure.
  if (error.statusCode !== 0) return undefined;
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return "timeout";
  if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") return "network";
  return undefined;
};

const getStatusFallback = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
    case 422: return "validation";
    case 401: return "unauthorized";
    case 403: return "forbidden";
    case 404: return "notFound";
    case 409: return "conflict";
    case 504: return "timeout";
    default: return statusCode >= 500 && statusCode < 600 ? "server" : "generic";
  }
};

const getErrorDescription = (error: NotificationError, t: TFunction): string => {
  const transportKind = getTransportKind(error);
  if (transportKind) return t(`notifications.apiFallback.${transportKind}`);

  // Shared transport codes have a machine contract. Domain sentences without a
  // shared catalogue entry keep their legacy detail below.
  if (error.code && error.hasMachineParams) {
    return resolveApiErrorMessage(error.code, error.params, error.message, t);
  }

  // Axios supplies technical text when there is no valid backend envelope.
  // Choose its fallback from structured status, without parsing that text.
  const hasTechnicalMessage = axios.isAxiosError(error.cause)
    && !readApiResponse(error.cause.response?.data);
  const message = error.message.trim();
  const messageLocaleKey = getCodeLocaleKey(message);
  const standaloneTranslation = resolveApiErrorMessage(message, error.params, message, t);
  const isStandaloneCode = Boolean(messageLocaleKey) || standaloneTranslation !== message;
  if (!hasTechnicalMessage && message && message !== error.code && !isStandaloneCode) {
    return error.message;
  }

  const code = isStandaloneCode ? message : error.code;
  const fallback = t(`notifications.apiFallback.${getStatusFallback(error.statusCode)}`);
  const localeKey = getCodeLocaleKey(code);
  const localizedFallback = localeKey ? t(localeKey, { defaultValue: fallback }) : fallback;
  return code ? resolveApiErrorMessage(code, error.params, localizedFallback, t) : localizedFallback;
};

export const createApiErrorNotification = (
  cause: unknown,
  t: TFunction,
  context: ErrorNotificationContext = {},
): OpenNotificationParams => {
  const error = readNotificationError(cause);
  const title = getTransportKind(error) ?? getStatusFallback(error.statusCode);
  return {
    key: context.key,
    type: "error",
    message: context.operation
      ? t(`notifications.apiTitles.${context.operation}`, { resource: context.resourceLabel ?? "" })
      : t(`notifications.apiTitles.${title}`),
    description: getErrorDescription(error, t),
  };
};
