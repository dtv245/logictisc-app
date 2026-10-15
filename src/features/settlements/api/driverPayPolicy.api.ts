/**
 * API endpoints and contract adapters for Driver Pay Policies.
 */

export const DRIVER_PAY_POLICY_ENDPOINTS = {
  list: "/api/driver-pay-policies",
  get: (id: string) => `/api/driver-pay-policies/${id}`,
  create: "/api/driver-pay-policies",
  newVersion: (id: string) => `/api/driver-pay-policies/${id}/new-version`,
} as const;
