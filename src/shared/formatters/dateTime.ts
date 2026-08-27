/**
 * Parses, serializes and formats absolute instants.
 *
 * Strings without an offset are rejected because interpreting them in the
 * browser timezone would silently change the instant sent back to the API.
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
