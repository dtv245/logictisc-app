/**
 * Parses, serializes and maps date/instant values.
 *
 * Strings without an offset are rejected by `parseInstant` because
 * interpreting them in the browser timezone would silently change the instant
 * sent back to the API. `toDate`/`toDateOrNull` are thin mappers kept
 * behavior-compatible with direct `new Date(...)` usage in feature mappers.
 */

export type InstantInput = string | Date;

const isoOffsetSuffixPattern = /(Z|[+-]\d{2}:\d{2})$/i;

export interface InstantFormatOptions {
  locale: string;
  format: Intl.DateTimeFormatOptions;
  timeZone?: string;
}

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
