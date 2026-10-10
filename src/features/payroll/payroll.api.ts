/** Only confirmed run/item endpoints; no collection API is fabricated. */
export const payrollApi = {
  reconciliationCases: "/api/payroll/reconciliation-cases",
  dispatch: (id: string) => `/api/payroll/payments/${encodeURIComponent(id)}/dispatch`,
  reconcileBank: (id: string) => `/api/payroll/payments/${encodeURIComponent(id)}/reconcile-bank`,
  calculate: "/api/payroll/runs/calculate",
  run: (id: string) => `/api/payroll/runs/${encodeURIComponent(id)}`,
  command: (id: string, action: string) => `/api/payroll/runs/${encodeURIComponent(id)}/${action}`,
  payments: (id: string) => `/api/payroll/items/${encodeURIComponent(id)}/payments`,
};
export const payrollKeys = {
  run: (tenant: string | undefined, id: string) => ["payroll", tenant, "run", id] as const,
  payments: (tenant: string | undefined, itemId: string) => ["payroll", tenant, "payments", itemId] as const,
};

// Verified against :8080 OpenAPI and PayrollPaymentController on 2026-10-06.
export const PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED = true;
