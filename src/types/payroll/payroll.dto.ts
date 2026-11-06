/** Current PayrollRunController and PayrollPaymentController transport values. */
export type PayrollDecimal = string | number;
export interface PayrollJurisdiction { countryCode: string; subdivisionCode: string | null; localityCode: string | null }
export interface PayrollItem {
  id: string; driverId: string; status: string; currency: string; grossAmount: PayrollDecimal | null;
  incomeTaxAmount: PayrollDecimal | null; insuranceAmount: PayrollDecimal | null; otherDeductionAmount: PayrollDecimal | null;
  reimbursementAmount: PayrollDecimal | null; netAmount: PayrollDecimal | null; taxAvailability: string; validationReason: string | null;
  jurisdiction: PayrollJurisdiction | null; workerClassification: "EMPLOYEE" | "CONTRACTOR" | null; policyId: string | null; policyVersion: number | null;
  effectiveDate: string; settlementIds: string[]; calculationSnapshotJson: string | null;
  noPaymentRequiredAt: string | null; noPaymentRequiredBy: string | null; noPaymentReasonCode: string | null; noPaymentReason: string | null;
}
export interface PayrollRun {
  id: string; runNumber: string; payPeriodId: string; currency: string; status: string; validationReason: string | null; effectiveDate: string;
  calculatedAt: string | null; approvedAt: string | null; lockedAt: string | null; completedAt: string | null;
  completedBy: string | null; completionSource: string | null; items: PayrollItem[];
}
export interface CalculatePayrollPayload {
  idempotencyKey: string; payPeriodId: string; currency: string; effectiveDate: string; settlementIds: string[];
}
export interface PayrollPayment {
  id: string; payrollItemId: string; attemptNumber: number; idempotencyKey: string; paymentMethod: string; status: string;
  amount: PayrollDecimal | null; currency: string; providerKey: string | null; providerReference: string | null;
  failureCode: string | null; failureMessage: string | null; scheduledAt: string | null; submittedAt: string | null; succeededAt: string | null; reconciledAt: string | null;
}
export interface SchedulePayrollPaymentPayload { idempotencyKey: string; paymentMethod: "BANK_TRANSFER" | "STRIPE"; providerKey: string; destinationReference?: string }
export interface PayrollReconciliationCase {
  caseEventId: string; paymentId: string; paymentStatus: string; sourceKey: string; providerKey: string | null; outcome: string;
  amount: PayrollDecimal; currency: string; providerReference: string | null; occurredAt: string | null; reason: string | null;
}
export interface ReconcileBankPayload {
  idempotencyKey: string; caseEventId: string; bankSource: string; transactionReference: string; amount: string | number; currency: string;
  outcome: "SUCCEEDED" | "FAILED"; counterpartyReference: string; evidenceReference: string; reason: string; occurredAt: string;
}
export interface PayrollPaymentEvent { eventId: string; sourceKey: string; status: string; reason: string | null; payment: PayrollPayment }
export interface PayrollCasesPage { content: PayrollReconciliationCase[]; totalElements: number; number: number; size: number }
