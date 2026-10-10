/** Immutable payslip fixture deliberately has a backend net that differs from browser arithmetic. */
import type { PayslipDto } from "@/types/payslip.dto";
import { payroll, payrollId } from "./payroll";
export const payslipId = "99999999-9999-4999-8999-999999999999";
export const payslipSnapshot = { employeeName: "Own Driver", payrollRunId: payrollId, runNumber: payroll.runNumber, periodStart: "2026-09-21", periodEnd: "2026-10-01", currency: "EUR", incomeTaxAmount: "12", insuranceAmount: "6",
  calculation: { grossAmount: "777", otherDeductionAmount: "3", reimbursementAmount: "5", netAmount: "811.21", availability: "AVAILABLE", reason: null,
    jurisdiction: { countryCode: "SG", subdivisionCode: null, localityCode: null }, workerClassification: "EMPLOYEE", policyId: "policy-101", policyVersion: 2,
    jurisdictionResolution: { source: "EMPLOYEE_PROFILE", profileId: "profile-101", profileVersion: 3 },
  } };
export const payslip: PayslipDto = { id: payslipId, payrollItemId: payroll.items[0]!.id, driverId: payroll.items[0]!.driverId, issuedAt: "2026-10-02T10:00:00Z", issuedBy: "finance-actor", snapshotJson: JSON.stringify(payslipSnapshot), pdfUri: "https://untrusted.example/ignored", rendererVersion: "v1", pdfSha256: "verified-artifact-hash" };
