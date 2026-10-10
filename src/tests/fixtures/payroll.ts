/** Payroll runtime fixture includes distinct run/payment states and server-only monetary results. */
import type { PayrollRun, PayrollPayment } from "@/types/payroll.dto";
import { settlementId } from "./settlement";
export const payrollId = "66666666-6666-4666-8666-666666666666";
export const payroll: PayrollRun = {
  id: payrollId, runNumber: "PR-CONTRACT-101", payPeriodId: "44444444-4444-4444-8444-444444444444", currency: "EUR", status: "CALCULATED", validationReason: null,
  effectiveDate: "2026-10-01", calculatedAt: "2026-10-01T10:00:00Z", approvedAt: null, lockedAt: null, completedAt: null, completedBy: null, completionSource: null,
  items: [{ id: "77777777-7777-4777-8777-777777777777", driverId: "33333333-3333-4333-8333-333333333333", status: "CALCULATED", currency: "EUR",
    grossAmount: "777", incomeTaxAmount: "12", insuranceAmount: "6", otherDeductionAmount: "3", reimbursementAmount: "5", netAmount: "811.21",
    taxAvailability: "AVAILABLE", validationReason: null, jurisdiction: { countryCode: "SG", subdivisionCode: null, localityCode: null }, workerClassification: "EMPLOYEE", policyId: "policy-101", policyVersion: 2, effectiveDate: "2026-10-01", settlementIds: [settlementId], calculationSnapshotJson: null,
    noPaymentRequiredAt: null, noPaymentRequiredBy: null, noPaymentReasonCode: null, noPaymentReason: null }],
};
export const payment: PayrollPayment = { id: "pay-attempt-1", payrollItemId: payroll.items[0]!.id, attemptNumber: 1, idempotencyKey: "payment-request-key", paymentMethod: "MANUAL", status: "FAILED", amount: "811.21", currency: "EUR", providerKey: "configured-bank", providerReference: "sensitive-reference-123456789", failureCode: "BANK_FAILURE", failureMessage: "Bank declined", scheduledAt: "2026-10-01T12:00:00Z", submittedAt: null, succeededAt: null, reconciledAt: null };
