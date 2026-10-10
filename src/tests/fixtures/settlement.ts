/** Server totals intentionally disagree with line totals to detect client recalculation. */
import type { DriverSettlementView } from "@/types/settlement.dto";
import { loadId } from "./finance";
export const settlementId = "22222222-2222-4222-8222-222222222222";
export const settlement: DriverSettlementView = {
  id: settlementId, settlementNumber: "DS-VERIFIED-101", driverId: "33333333-3333-4333-8333-333333333333",
  payPeriodId: "44444444-4444-4444-8444-444444444444", driverName: "Driver Contract", payPeriodCode: "PP-101",
  settlementType: "ORIGINAL", status: "CALCULATED", currency: "EUR", grossEarnings: "777.12", reimbursementAmount: "40", deductionAmount: "17",
  settlementNet: "811.01", calculatedAt: "2026-10-01T10:00:00Z", approvedAt: null, lockedAt: null, policyId: "policy-101", policyVersion: 3,
  lines: [{ id: "line-101", lineClass: "EARNING", lineType: "MILEAGE", description: "Server mileage pay", quantity: "100", unit: "MILE", rate: "0.25", amount: "25", currency: "EUR", loadId, sourceType: "TRIP", sourceId: "trip-source", businessDate: "2026-10-01" }],
};
