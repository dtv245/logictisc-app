/**
 * Driver Settlement DTOs and view models.
 * Strictly mirrors backend contracts from DriverSettlementView and DriverSettlementController.
 */

export type SettlementStatus =
  | "CALCULATED"
  | "VALIDATION_REQUIRED"
  | "IN_REVIEW"
  | "APPROVED"
  | "LOCKED"
  | "PAYMENT_SCHEDULED"
  | "PAID"
  | "REVERSED"
  | "CANCELLED";

export type SettlementType = "ORIGINAL" | "ADJUSTMENT" | "REVERSAL";

export type SettlementLineClass = "EARNING" | "DEDUCTION" | "REIMBURSEMENT";

export interface SettlementLineView {
  id: string;
  lineType: string;
  lineClass: SettlementLineClass;
  description: string;
  quantity: number | string;
  unit: string;
  rate: number | string;
  amount: number | string;
  currency: string;
  sourceType?: string | null;
  sourceId?: string | null;
  loadId?: string | null;
  tripId?: string | null;
  businessDate?: string | null;
}

export interface DriverSettlementView {
  id: string;
  settlementNumber: string;
  driverId: string;
  payPeriodId: string;
  settlementType: SettlementType;
  status: SettlementStatus;
  currency: string;
  grossEarnings: number | string;
  reimbursementAmount: number | string;
  deductionAmount: number | string;
  settlementNet: number | string;
  calculatedAt: string | null;
  approvedAt: string | null;
  lockedAt: string | null;
  lines?: SettlementLineView[];
  parentSettlementId?: string | null;
  sequenceNumber?: number;
  policyId?: string;
  policyVersion?: number;
  validationReason?: string | null;
  driverName?: string | null;
  payPeriodCode?: string | null;
}

export interface CalculateSettlementPayload {
  driverId: string;
  payPeriodId: string;
}

export interface SettlementFilterParams {
  payPeriodId?: string;
  driverId?: string;
  status?: SettlementStatus | string;
  settlementType?: SettlementType | string;
  currency?: string;
  search?: string;
}

export interface PayPeriodView {
  id: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  paymentDate?: string | null;
  status: string;
}

export interface ValidationReasonPayload {
  reason: string;
}

/** Current adjustment command carries positive explicit amounts; currency is inherited by the server. */
export interface SettlementAdjustmentPayload {
  idempotencyKey: string;
  reason: string;
  lines: { lineClass: SettlementLineClass; lineType: string; description: string; amount: string | number; loadId?: string; tripId?: string }[];
}
