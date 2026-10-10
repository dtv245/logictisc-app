/**
 * Verifies instant preservation and explicit user-timezone formatting.
 */
import { describe, expect, it } from "vitest";

import {
  formatDateOnly,
  formatDateTime,
  formatInstant,
  serializeInstant,
} from "@formatters/dateTime";

describe("instant formatter", () => {
  it("preserves the instant when serializing an offset datetime", () => {
    expect(serializeInstant("2026-07-27T10:00:00+07:00")).toBe(
      "2026-07-27T03:00:00.000Z",
    );
  });

  it("formats in the supplied user timezone", () => {
    expect(
      formatInstant("2026-07-27T03:00:00Z", {
        locale: "en-GB",
        timeZone: "Asia/Ho_Chi_Minh",
        format: {
          day: "2-digit",
          hour: "2-digit",
          hourCycle: "h23",
          minute: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      }),
    ).toBe("27/07/2026, 10:00");
  });

  it("rejects a datetime without an offset", () => {
    expect(() => serializeInstant("2026-07-27T10:00:00")).toThrow(RangeError);
  });
});

describe("formatDateOnly", () => {
  it("formats a date-only string without timezone day shift", () => {
    expect(formatDateOnly("2026-10-15", { locale: "en-GB" })).toBe("15/10/2026");
    expect(formatDateOnly("2026-10-15", { locale: "en-US" })).toBe("10/15/2026");
  });

  it("handles empty or missing date values gracefully", () => {
    expect(formatDateOnly(null)).toBe("—");
    expect(formatDateOnly(undefined)).toBe("—");
    expect(formatDateOnly("")).toBe("—");
    expect(formatDateOnly(null, { fallback: "N/A" })).toBe("N/A");
  });

  it("falls back gracefully when given invalid date strings", () => {
    expect(formatDateOnly("invalid-date-string")).toBe("—");
    expect(formatDateOnly("9999-99-99", { fallback: "Unknown" })).toBe("Unknown");
  });
});

describe("formatDateTime", () => {
  it("formats ISO datetime string correctly with user timezone", () => {
    expect(
      formatDateTime("2026-07-27T03:00:00Z", {
        locale: "en-GB",
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    ).toBe("27/07/2026, 10:00");
  });

  it("formats a Date object correctly", () => {
    const date = new Date("2026-07-27T03:00:00Z");
    expect(
      formatDateTime(date, {
        locale: "en-GB",
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    ).toBe("27/07/2026, 10:00");
  });

  it("handles empty or missing datetime values gracefully without throwing", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
    expect(formatDateTime(null, { fallback: "Pending" })).toBe("Pending");
  });

  it("falls back gracefully for invalid datetime strings without throwing", () => {
    expect(formatDateTime("malformed-timestamp")).toBe("—");
    expect(formatDateTime("malformed-timestamp", { fallback: "Invalid" })).toBe("Invalid");
  });
});
