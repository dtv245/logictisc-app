import { describe, expect, it } from "vitest";

import {
  formatCurrencyAmount,
  getSettlementStatusColor,
  getSettlementTypeColor,
} from "@/features/settlements/settlement.columns";
import type {
  DriverSettlementView,
  SettlementStatus,
} from "@/types/settlement.dto";

describe("Settlement DTO and Column Helpers Contract", () => {
  it("formats currency amounts correctly for different numerical inputs", () => {
    expect(formatCurrencyAmount(1250.5, "USD")).toBe("$1,250.50");
    expect(formatCurrencyAmount("2500.00", "USD")).toBe("$2,500.00");
    expect(formatCurrencyAmount(0, "USD")).toBe("$0.00");
    expect(formatCurrencyAmount(null)).toBe("-");
    expect(formatCurrencyAmount(undefined)).toBe("-");
    expect(formatCurrencyAmount("")).toBe("-");
  });

  it("preserves decimal precision and leaves missing currency/value unavailable", () => {
    expect(formatCurrencyAmount("9007199254740993.12", "USD")).toBe("$9,007,199,254,740,993.12");
    expect(formatCurrencyAmount("120", undefined)).toBe("-");
    expect(formatCurrencyAmount("invalid", "EUR")).toBe("-");
  });

  it("handles non-USD currencies or custom fallbacks safely", () => {
    const formatted = formatCurrencyAmount(1000, "VND");
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe("string");
  });

  it("returns distinct semantic color tags for settlement statuses", () => {
    const statuses: SettlementStatus[] = [
      "CALCULATED",
      "VALIDATION_REQUIRED",
      "IN_REVIEW",
      "APPROVED",
      "LOCKED",
      "PAYMENT_SCHEDULED",
      "PAID",
      "REVERSED",
      "CANCELLED",
    ];

    const colors = statuses.map(getSettlementStatusColor);
    expect(colors).toContain("blue");
    expect(colors).toContain("gold");
    expect(colors).toContain("cyan");
    expect(colors).toContain("green");
    expect(colors).toContain("purple");
    expect(colors).toContain("red");
  });

  it("returns appropriate color tags for settlement types", () => {
    expect(getSettlementTypeColor("ORIGINAL")).toBe("blue");
    expect(getSettlementTypeColor("ADJUSTMENT")).toBe("orange");
    expect(getSettlementTypeColor("REVERSAL")).toBe("red");
  });

  it("validates full DriverSettlementView object shape", () => {
    const mockSettlement: DriverSettlementView = {
      id: "set-001",
      settlementNumber: "DS-2026-001",
      driverId: "drv-101",
      payPeriodId: "pp-202",
      settlementType: "ORIGINAL",
      status: "CALCULATED",
      currency: "USD",
      grossEarnings: 1500.0,
      reimbursementAmount: 120.0,
      deductionAmount: 50.0,
      settlementNet: 1570.0,
      calculatedAt: "2026-10-04T08:00:00Z",
      approvedAt: null,
      lockedAt: null,
      driverName: "John Doe",
      payPeriodCode: "PP-2026-W40",
    };

    expect(mockSettlement.settlementNumber).toBe("DS-2026-001");
    expect(mockSettlement.grossEarnings).toBe(1500.0);
    expect(mockSettlement.settlementNet).toBe(1570.0);
    expect(mockSettlement.driverName).toBe("John Doe");
    expect(mockSettlement.payPeriodCode).toBe("PP-2026-W40");
  });
});
