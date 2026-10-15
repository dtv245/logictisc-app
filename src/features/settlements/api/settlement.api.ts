/**
 * API endpoints and contract adapters for Driver Settlements.
 */

export const SETTLEMENT_ENDPOINTS = {
  list: "/api/driver-settlements",
  get: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}`,
  calculate: "/api/driver-settlements/calculate",
  submitReview: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/submit-review`,
  approve: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/approve`,
  lock: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/lock`,
  requireValidation: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/require-validation`,
  resolveValidation: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/resolve-validation`,
  adjustments: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/adjustments`,
  reversal: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/reversal`,
  payPeriods: "/api/pay-periods",
  drivers: "/api/drivers",
} as const;
