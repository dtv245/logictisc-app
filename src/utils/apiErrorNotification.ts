/**
 * Builds Refine error notifications while the structured HTTP error is still
 * available. Backend sentences are preserved; standalone codes use locales.
 */
import type { OpenNotificationParams } from "@refinedev/core";
import axios from "axios";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import type { CompatibilityNotificationError, ErrorNotificationContext, NotificationContent, NotificationError, StructuredNotificationError } from "@/types/notificationProvider.types";

import { compatibilityT } from "@locales/notificationCompatibility";
import { isRecord, readApiResponse } from "@/utils/envelope";
import { ApiHttpError, normalizeHttpError } from "@/utils/httpError";
import { resolveApiErrorMessage } from "@/utils/errorMessages";

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

/** Shared status mapping; compatibility hints apply only to existing text-only callers. */
const getNotificationKind = (error: NotificationError, compatibility?: CompatibilityNotificationError): string => {
  const statusKind = getStatusFallback(error.statusCode);
  if (!compatibility) return getTransportKind(error) ?? statusKind;

  const { rawMessage, rawDescription: code, operation } = compatibility;
  if (error.statusCode === 0 || rawMessage === "Network Error"
      || ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "NETWORK_ERROR"].includes(code)) {
    return ["ECONNABORTED", "ETIMEDOUT"].includes(code) || error.statusCode === 504 ? "timeout" : "network";
  }
  if (statusKind === "unauthorized" || operation === "auth"
      || ["UNAUTHORIZED", "AUTH_SESSION_EXPIRED", "TOKEN_REFRESH_RETURNED_NO_TOKEN", "AUTH_REQUEST_FAILED"].includes(code)
      || code.startsWith("LARK_")) return "unauthorized";
  if (statusKind === "forbidden" || ["FORBIDDEN", "ACCESS_DENIED"].includes(code)) return "forbidden";
  if (statusKind === "notFound" || ["NOT_FOUND", "RESOURCE_NOT_FOUND"].includes(code)) return "notFound";
  // A bare legacy HTTP 504 used the server presentation, unlike a transport timeout.
  return error.statusCode === 504 ? "server" : statusKind;
};

const getCompatibilityFailureTitle = (input: CompatibilityNotificationError, server: boolean): ReactNode => {
  const entry = ([
    ["There was an error creating", "Create"],
    ["Error when updating", "Update"],
    ["Error when deleting", "Delete"],
  ] as const).find(([prefix]) => input.rawMessage.startsWith(prefix));
  if (!entry) return input.message;
  const key = `${server ? "server" : "failure"}${entry[1]}${input.resourceLabel ? "Resource" : ""}`;
  return compatibilityT(key, { resource: input.resourceLabel });
};

const getCompatibilityContent = (input: CompatibilityNotificationError, kind: string): NotificationContent => {
  const { rawDescription: code, statusCode, description } = input;
  const fallback = (title: string, detail: string): NotificationContent => ({
    message: compatibilityT(title), description: compatibilityT(detail), duration: 6,
  });
  const original = { message: input.message, description, duration: 6 };
  if (kind === "network" || kind === "timeout") return fallback(`${kind}Title`, `${kind}Description`);
  if (kind === "unauthorized") {
    const override = ([
      ["LARK_AUTH_CANCELLED", "authFailedTitle", "authCancelledDescription"],
      ["LARK_CODE_MISSING", "authFailedTitle", "authMissingCodeDescription"],
      ["LARK_API_CLIENT_REQUIRED", "authConfigTitle", "authConfigDescription"],
    ] as const).find(([candidate]) => code === candidate);
    if (override) return fallback(override[1], override[2]);
    if (statusCode === 401 && (code === "UNAUTHORIZED" || !code)) {
      return fallback("sessionExpiredTitle", "sessionExpiredDescription");
    }
    return original;
  }
  if (kind === "forbidden") {
    return !description || description === "FORBIDDEN" || description === "ACCESS_DENIED"
      ? fallback("forbiddenTitle", "forbiddenDescription") : original;
  }
  if (kind === "notFound") {
    return !description || description === "NOT_FOUND" || description === "RESOURCE_NOT_FOUND"
      ? fallback("notFoundTitle", "notFoundDescription") : original;
  }
  if (kind === "conflict" && statusCode === 409
      && [code, input.rawMessage].some((value) => ["VERSION_CONFLICT", "CONCURRENT_MODIFICATION_CONFLICT"].includes(value))) {
    return fallback("conflictTitle", "conflictDescription");
  }
  if (kind === "server") {
    return {
      message: getCompatibilityFailureTitle(input, true),
      description: !description || description === "INTERNAL_SERVER_ERROR" || description === "INTERNAL_ERROR"
        ? compatibilityT("serverDescription", { statusCode }) : description,
      duration: 6,
    };
  }
  return { message: getCompatibilityFailureTitle(input, false), description, duration: 5.5 };
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

/** Both structured API errors and compatibility notifications enter the same resolver. */
export function resolveNotificationError(input: StructuredNotificationError): OpenNotificationParams;
export function resolveNotificationError(input: CompatibilityNotificationError): NotificationContent;
export function resolveNotificationError(input: StructuredNotificationError | CompatibilityNotificationError): OpenNotificationParams | NotificationContent {
  if (input.kind === "compatibility") {
    const error = { statusCode: input.statusCode ?? Number.NaN, message: input.rawDescription };
    return getCompatibilityContent(input, getNotificationKind(error, input));
  }
  const { t, context } = input;
  const error = readNotificationError(input.cause);
  const title = getNotificationKind(error);
  return {
    key: context.key,
    type: "error",
    message: context.operation
      ? t(`notifications.apiTitles.${context.operation}`, { resource: context.resourceLabel ?? "" })
      : t(`notifications.apiTitles.${title}`),
    description: getErrorDescription(error, t),
  };
}

export const createApiErrorNotification = (
  cause: unknown,
  t: TFunction,
  context: ErrorNotificationContext = {},
): OpenNotificationParams => resolveNotificationError({ kind: "structured", cause, t, context });
