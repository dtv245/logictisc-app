/**
 * Covers display fallback, date mapping and integer clamp helpers.
 */
import { describe, expect, it } from "vitest";

import { toDate, toDateOrNull } from "@formatters/dateTime";
import { displayValue, EMPTY_VALUE_PLACEHOLDER } from "@formatters/display";
import {
  clampInteger,
  parseClampedInteger,
  truncateToInteger,
} from "@formatters/number";

describe("displayValue", () => {
  it("stringifies present values", () => {
    expect(displayValue("IN-1001")).toBe("IN-1001");
    expect(displayValue(42)).toBe("42");
  });

  it("keeps the falsy-cell contract of the former inline pattern", () => {
    // Giữ nguyên behavior cũ: value ? String(value) : placeholder
    expect(displayValue(0)).toBe(EMPTY_VALUE_PLACEHOLDER);
    expect(displayValue(false)).toBe(EMPTY_VALUE_PLACEHOLDER);
  });

  it("falls back to the placeholder for empty values", () => {
    expect(displayValue(null)).toBe(EMPTY_VALUE_PLACEHOLDER);
    expect(displayValue(undefined)).toBe(EMPTY_VALUE_PLACEHOLDER);
    expect(displayValue("")).toBe(EMPTY_VALUE_PLACEHOLDER);
  });

  it("supports a custom fallback", () => {
    expect(displayValue(null, "TRK-0001")).toBe("TRK-0001");
  });
});

describe("date mappers", () => {
  it("maps required and optional date fields", () => {
    expect(toDate("2026-07-27T10:00:00Z").toISOString()).toBe(
      "2026-07-27T10:00:00.000Z",
    );
    expect(toDateOrNull("2026-07-27T10:00:00Z")).toBeInstanceOf(Date);
    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull(undefined)).toBeNull();
  });
});

describe("integer normalization", () => {
  it("truncates decimals and falls back for non-finite values", () => {
    expect(truncateToInteger(7.9, 20)).toBe(7);
    expect(truncateToInteger(Number.NaN, 20)).toBe(20);
    expect(truncateToInteger(Number.POSITIVE_INFINITY, 20)).toBe(20);
  });

  it("clamps values into the allowed range", () => {
    expect(clampInteger(5, 1, 3)).toBe(3);
    expect(clampInteger(-2, 1, 3)).toBe(1);
    expect(clampInteger(2, 1, 3)).toBe(2);
  });

  it("parses and clamps URL state values", () => {
    expect(parseClampedInteger("12", 1, 1, 100)).toBe(12);
    expect(parseClampedInteger("500", 1, 1, 100)).toBe(100);
    expect(parseClampedInteger("abc", 1, 1, 100)).toBe(1);
    expect(parseClampedInteger(null, 20, 1, 100)).toBe(20);
    expect(parseClampedInteger(2.9, 20, 1, 100)).toBe(2);
  });
});
