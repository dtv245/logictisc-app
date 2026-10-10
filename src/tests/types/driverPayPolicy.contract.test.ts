import { describe, expect, it } from "vitest";

import {
  formatPercentDisplay,
  MILEAGE_BASES,
  PAY_METHODS,
  percentToRatio,
  ratioToPercent,
  REVENUE_BASES,
} from "@/types/driverPayPolicy.dto";

describe("driverPayPolicy contract & utilities", () => {
  describe("percentage conversion convention", () => {
    it("converts 25% UI input to 0.25 transport ratio", () => {
      expect(percentToRatio(25)).toBe(0.25);
      expect(percentToRatio(100)).toBe(1.0);
      expect(percentToRatio(0)).toBe(0.0);
      expect(percentToRatio(33.3333)).toBe(0.333333);
      expect(percentToRatio(null)).toBeNull();
      expect(percentToRatio(undefined)).toBeNull();
    });

    it("converts 0.25 transport ratio to 25 UI percentage", () => {
      expect(ratioToPercent(0.25)).toBe(25);
      expect(ratioToPercent(1.0)).toBe(100);
      expect(ratioToPercent(0.0)).toBe(0);
      expect(ratioToPercent(null)).toBeNull();
      expect(ratioToPercent(undefined)).toBeNull();
    });

    it("formats display percentage string correctly", () => {
      expect(formatPercentDisplay(0.25)).toBe("25%");
      expect(formatPercentDisplay(0.275)).toBe("27.5%");
      expect(formatPercentDisplay(null)).toBe("-");
    });
  });

  describe("pay methods and basis enums", () => {
    it("defines exactly the backend supported pay methods", () => {
      expect(PAY_METHODS).toEqual([
        "PER_MILE",
        "PER_LOAD",
        "PERCENT_REVENUE",
        "HOURLY",
        "DAILY",
        "FLAT_RATE",
      ]);
    });

    it("defines the supported mileage bases", () => {
      expect(MILEAGE_BASES).toEqual([
        "ACTUAL_ALL_MILES",
        "PLANNED_ALL_MILES",
      ]);
    });

    it("defines the supported revenue bases", () => {
      expect(REVENUE_BASES).toEqual(["INVOICE_SUBTOTAL"]);
    });
  });

  describe("date-only convention", () => {
    it("validates date format YYYY-MM-DD without time or timezone offset", () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const validDate = "2026-10-04";
      expect(dateRegex.test(validDate)).toBe(true);

      const invalidIso = "2026-10-04T00:00:00Z";
      expect(dateRegex.test(invalidIso)).toBe(false);
    });
  });
});
