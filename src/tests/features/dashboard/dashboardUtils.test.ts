import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDurationMinutes,
  formatNumber,
  formatPercent,
  getMetricDisplay,
} from "../../../features/dashboard/utils/formatters";
import {
  calculateDelta,
  calculateDriverScore,
  calculateProfit,
} from "../../../features/dashboard/utils/calculations";
import type { MetricDto } from "../../../features/dashboard/types";

describe("Dashboard Formatters", () => {
  describe("formatCurrency", () => {
    it("formats standard USD currency", () => {
      expect(formatCurrency(12450, "USD", false)).toContain("12,450");
    });

    it("formats compact currency correctly", () => {
      expect(formatCurrency(1200, "USD", true)).toBe("$1.2K");
      expect(formatCurrency(3400000, "USD", true)).toBe("$3.4M");
      expect(formatCurrency(500, "USD", true)).toBe("$500");
    });

    it("handles null, undefined and NaN safely", () => {
      expect(formatCurrency(null)).toBe("—");
      expect(formatCurrency(undefined)).toBe("—");
      expect(formatCurrency(NaN)).toBe("—");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with thousand separators", () => {
      expect(formatNumber(14250)).toBe("14,250");
      expect(formatNumber(14250.55, 1)).toBe("14,250.6");
    });

    it("formats compact numbers", () => {
      expect(formatNumber(15000, 0, true)).toBe("15.0K");
      expect(formatNumber(2500000, 0, true)).toBe("2.5M");
    });

    it("handles null and undefined safely", () => {
      expect(formatNumber(null)).toBe("—");
      expect(formatNumber(undefined)).toBe("—");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage with decimals", () => {
      expect(formatPercent(98.54)).toBe("98.5%");
      expect(formatPercent(98.54, 2)).toBe("98.54%");
    });

    it("handles null and undefined safely", () => {
      expect(formatPercent(null)).toBe("—");
    });
  });

  describe("formatDurationMinutes", () => {
    it("formats minutes < 60", () => {
      expect(formatDurationMinutes(45)).toBe("45m");
    });

    it("formats hours and minutes >= 60", () => {
      expect(formatDurationMinutes(135)).toBe("2h 15m");
      expect(formatDurationMinutes(120)).toBe("2h");
    });

    it("handles edge cases", () => {
      expect(formatDurationMinutes(null)).toBe("—");
      expect(formatDurationMinutes(-10)).toBe("—");
    });
  });

  describe("getMetricDisplay", () => {
    it("returns formatted value when AVAILABLE", () => {
      const metric: MetricDto = {
        availability: "AVAILABLE",
        value: 1250,
      };
      const result = getMetricDisplay(metric, (v) => `$${v}`);
      expect(result.display).toBe("$1250");
      expect(result.isAvailable).toBe(true);
    });

    it("returns 'Một phần' and reason when PARTIAL", () => {
      const metric: MetricDto = {
        availability: "PARTIAL",
        value: 500,
        reason: "Fixed costs omitted",
      };
      const result = getMetricDisplay(metric, (v) => `$${v}`);
      expect(result.display).toBe("Một phần");
      expect(result.tooltip).toBe("Fixed costs omitted");
      expect(result.isAvailable).toBe(false);
    });

    it("returns '—' and reason when UNAVAILABLE", () => {
      const metric: MetricDto = {
        availability: "UNAVAILABLE",
        reason: "Sensor uncalibrated",
      };
      const result = getMetricDisplay(metric, (v) => `$${v}`);
      expect(result.display).toBe("—");
      expect(result.tooltip).toBe("Sensor uncalibrated");
      expect(result.isAvailable).toBe(false);
    });

    it("handles undefined metric", () => {
      const result = getMetricDisplay(undefined, (v) => `$${v}`);
      expect(result.display).toBe("—");
      expect(result.isAvailable).toBe(false);
    });
  });
});

describe("Dashboard Calculations", () => {
  describe("calculateDelta", () => {
    it("calculates positive delta and percentage", () => {
      const result = calculateDelta(120, 100);
      expect(result.delta).toBe(20);
      expect(result.percent).toBe(20);
    });

    it("calculates negative delta and percentage", () => {
      const result = calculateDelta(80, 100);
      expect(result.delta).toBe(-20);
      expect(result.percent).toBe(-20);
    });

    it("returns null percent when previous is 0", () => {
      const result = calculateDelta(50, 0);
      expect(result.delta).toBe(50);
      expect(result.percent).toBeNull();
    });

    it("handles null or undefined inputs", () => {
      const result = calculateDelta(null, 100);
      expect(result.delta).toBe(0);
      expect(result.percent).toBeNull();
    });
  });

  describe("calculateProfit", () => {
    it("calculates profit and margin percentage", () => {
      const result = calculateProfit(1000, 800);
      expect(result.profit).toBe(200);
      expect(result.marginPercent).toBe(20);
    });

    it("handles zero revenue", () => {
      const result = calculateProfit(0, 100);
      expect(result.profit).toBe(-100);
      expect(result.marginPercent).toBeNull();
    });
  });

  describe("calculateDriverScore", () => {
    it("calculates composite score correctly", () => {
      const weights = { onTimeWeight: 0.4, productivityWeight: 0.3, revenueWeight: 0.3 };
      const score = calculateDriverScore(
        { onTimePercent: 100, miles: 15000, revenue: 50000, exceptionsCount: 0 },
        weights,
        { maxMiles: 15000, maxRevenue: 50000 },
      );
      // 100*0.4 + 1.0*0.3*100 + 1.0*0.3*100 = 40 + 30 + 30 = 100
      expect(score).toBe(100);
    });

    it("applies penalty for exceptions", () => {
      const weights = { onTimeWeight: 0.4, productivityWeight: 0.3, revenueWeight: 0.3 };
      const score = calculateDriverScore(
        { onTimePercent: 100, miles: 15000, revenue: 50000, exceptionsCount: 2 },
        weights,
        { maxMiles: 15000, maxRevenue: 50000 },
      );
      // 100 - (2 * 2) = 96
      expect(score).toBe(96);
    });

    it("clamps score between 0 and 100", () => {
      const weights = { onTimeWeight: 0.4, productivityWeight: 0.3, revenueWeight: 0.3 };
      const lowScore = calculateDriverScore(
        { onTimePercent: 10, miles: 100, revenue: 200, exceptionsCount: 50 },
        weights,
      );
      expect(lowScore).toBe(0);
    });
  });
});
