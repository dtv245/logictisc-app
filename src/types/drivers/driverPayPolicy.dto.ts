/**
 * DTOs and contracts for Driver Pay Policies (Phase 4).
 * Aligned with Spring Boot backend: DriverPayPolicyController, DriverPayPolicyView, DriverPayPolicyRequest.
 */

export const PAY_METHODS = [
  "PER_MILE",
  "PER_LOAD",
  "PERCENT_REVENUE",
  "HOURLY",
  "DAILY",
  "FLAT_RATE",
] as const;

export type PayMethod = (typeof PAY_METHODS)[number];

export const MILEAGE_BASES = [
  "ACTUAL_ALL_MILES",
  "PLANNED_ALL_MILES",
] as const;

export type MileageBasis = (typeof MILEAGE_BASES)[number];

export const REVENUE_BASES = ["INVOICE_SUBTOTAL"] as const;

export type RevenueBasis = (typeof REVENUE_BASES)[number];

export interface DriverPayPolicyView {
  id: string;
  policyCode: string;
  name: string;
  driverId: string | null;
  payMethod: PayMethod;
  perMileRate: number | null;
  perLoadRate: number | null;
  hourlyRate: number | null;
  dailyRate: number | null;
  flatRate: number | null;
  /** Ratio between 0.0 and 1.0 (e.g. 0.25 for 25%) */
  revenuePercentage: number | null;
  mileageBasis: MileageBasis | null;
  revenueBasis: RevenueBasis | null;
  detentionRate: number | null;
  detentionFreeMinutes: number | null;
  detentionBlockMinutes: number | null;
  layoverRate: number | null;
  stopPayRate: number | null;
  currency: string;
  /** ISODate format YYYY-MM-DD */
  effectiveFrom: string;
  /** ISODate format YYYY-MM-DD */
  effectiveTo: string | null;
  policyVersion: number;
  active: boolean;
}

export interface DriverPayPolicyRequest {
  policyCode: string;
  name: string;
  driverId?: string | null;
  payMethod: PayMethod;
  perMileRate?: number | null;
  perLoadRate?: number | null;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  flatRate?: number | null;
  /** Ratio between 0.0 and 1.0 */
  revenuePercentage?: number | null;
  mileageBasis?: string | null;
  revenueBasis?: string | null;
  detentionRate?: number | null;
  detentionFreeMinutes?: number | null;
  detentionBlockMinutes?: number | null;
  layoverRate?: number | null;
  stopPayRate?: number | null;
  currency: string;
  /** Date-only string YYYY-MM-DD */
  effectiveFrom: string;
  /** Date-only string YYYY-MM-DD */
  effectiveTo?: string | null;
}

/**
 * UI Form values where revenue percentage is represented as 0 - 100 (%)
 * and dates can be dayjs objects or strings.
 */
export interface DriverPayPolicyFormValues {
  policyCode: string;
  name: string;
  isDefaultScope: boolean;
  driverId?: string | null;
  payMethod: PayMethod;
  perMileRate?: number | null;
  perLoadRate?: number | null;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  flatRate?: number | null;
  /** User inputs 25 for 25% */
  revenuePercentageInput?: number | null;
  mileageBasis?: MileageBasis | null;
  revenueBasis?: RevenueBasis | null;
  detentionRate?: number | null;
  detentionFreeMinutes?: number | null;
  detentionBlockMinutes?: number | null;
  layoverRate?: number | null;
  stopPayRate?: number | null;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

/**
 * Converts user percentage (0-100) to backend ratio (0.0-1.0) with max 6 decimal places.
 */
export const percentToRatio = (percent: number | null | undefined): number | null => {
  if (percent === null || percent === undefined || Number.isNaN(percent)) {
    return null;
  }
  const ratio = percent / 100;
  return Number(ratio.toFixed(6));
};

/**
 * Converts backend ratio (0.0-1.0) to user display percentage (0-100).
 */
export const ratioToPercent = (ratio: number | null | undefined): number | null => {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) {
    return null;
  }
  return Number((ratio * 100).toFixed(4));
};

/**
 * Formats ratio as display percentage string, e.g. 0.25 -> "25%"
 */
export const formatPercentDisplay = (ratio: number | null | undefined): string => {
  const percent = ratioToPercent(ratio);
  if (percent === null) return "-";
  return `${percent}%`;
};
