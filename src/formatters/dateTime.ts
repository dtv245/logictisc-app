/**
 * Parses, serializes and maps date/instant values.
 *
 * Strings without an offset are rejected by `parseInstant` because
 * interpreting them in the browser timezone would silently change the instant
 * sent back to the API. `toDate`/`toDateOrNull` are thin mappers kept
 * behavior-compatible with direct `new Date(...)` usage in feature mappers.
 */

import { EMPTY_VALUE_PLACEHOLDER } from "./display";

export type InstantInput = string | Date;

const isoOffsetSuffixPattern = /(Z|[+-]\d{2}:\d{2})$/i;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface InstantFormatOptions {
  locale: string;
  format: Intl.DateTimeFormatOptions;
  timeZone?: string;
}

export interface DateTimeFormatOptions {
  locale?: string;
  format?: Intl.DateTimeFormatOptions;
  timeZone?: string;
  fallback?: string;
}

export interface DateOnlyFormatOptions {
  locale?: string;
  format?: Intl.DateTimeFormatOptions;
  timeZone?: string;
  fallback?: string;
}

const defaultDateTimeFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

const defaultDateFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

export function parseInstant(value: InstantInput): Date {
  if (typeof value === "string" && !isoOffsetSuffixPattern.test(value)) {
    throw new RangeError("An ISO-8601 instant must include an offset or Z.");
  }

  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError("The supplied instant is invalid.");
  }

  return parsed;
}

export function serializeInstant(value: InstantInput): string {
  return parseInstant(value).toISOString();
}

export function getBrowserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatInstant(
  value: InstantInput,
  { locale, format, timeZone }: InstantFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...format,
    ...(timeZone ? { timeZone } : {}),
  }).format(parseInstant(value));
}

/**
 * An toàn format date-only string (YYYY-MM-DD) mà không bị lệch ngày theo timezone.
 * Trả về fallback nếu giá trị null, undefined hoặc không hợp lệ.
 */
export function formatDateOnly(
  value: InstantInput | null | undefined,
  options: DateOnlyFormatOptions = {},
): string {
  const {
    locale,
    format = defaultDateFormat,
    timeZone,
    fallback = EMPTY_VALUE_PLACEHOLDER,
  } = options;

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const match = value.match(dateOnlyPattern);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      if (
        !Number.isNaN(utcDate.getTime()) &&
        utcDate.getUTCFullYear() === year &&
        utcDate.getUTCMonth() === month - 1 &&
        utcDate.getUTCDate() === day
      ) {
        return new Intl.DateTimeFormat(locale, {
          ...format,
          timeZone: "UTC",
        }).format(utcDate);
      }
      return fallback;
    }
  }

  try {
    const parsed = value instanceof Date ? value : parseInstant(value);
    return new Intl.DateTimeFormat(locale, {
      ...format,
      ...(timeZone ? { timeZone } : {}),
    }).format(parsed);
  } catch {
    if (typeof value === "string") {
      const fallbackDate = new Date(value);
      if (!Number.isNaN(fallbackDate.getTime())) {
        return new Intl.DateTimeFormat(locale, {
          ...format,
          ...(timeZone ? { timeZone } : {}),
        }).format(fallbackDate);
      }
    }
    return fallback;
  }
}

/**
 * An toàn format datetime string (ISO instant hoặc Date object).
 * Trả về fallback nếu giá trị null, undefined hoặc không hợp lệ thay vì throw error.
 */
export function formatDateTime(
  value: InstantInput | null | undefined,
  options: DateTimeFormatOptions = {},
): string {
  const {
    locale,
    format = defaultDateTimeFormat,
    timeZone,
    fallback = EMPTY_VALUE_PLACEHOLDER,
  } = options;

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  try {
    const parsed = value instanceof Date ? value : parseInstant(value);
    return new Intl.DateTimeFormat(locale, {
      ...format,
      ...(timeZone ? { timeZone } : {}),
    }).format(parsed);
  } catch {
    if (typeof value === "string") {
      const fallbackDate = new Date(value);
      if (!Number.isNaN(fallbackDate.getTime())) {
        return new Intl.DateTimeFormat(locale, {
          ...format,
          ...(timeZone ? { timeZone } : {}),
        }).format(fallbackDate);
      }
    }
    return fallback;
  }
}

/**
 * Chuyển ISO date string bắt buộc (createdAt, …) thành `Date`.
 * Dùng cho các mapper DTO → domain khi API luôn gửi giá trị.
 */
export function toDate(value: string): Date {
  return new Date(value);
}

/**
 * Chuyển ISO date string có thể thiếu thành `Date | null`.
 * Dùng cho các mapper DTO → domain với field ngày tùy chọn.
 */
export function toDateOrNull(
  value: string | null | undefined,
): Date | null {
  return value ? new Date(value) : null;
}
