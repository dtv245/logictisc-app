/** Validates the current server snapshot projection, retaining unavailable fields as unavailable. */
import { z } from "zod";
const decimal = z.union([z.string().regex(/^-?\d+(\.\d+)?$/), z.number().finite()]).nullish();
const jurisdiction = z.object({ countryCode: z.string(), subdivisionCode: z.string().nullish(), localityCode: z.string().nullish() }).nullish();
export const payslipSnapshotSchema = z.object({
  employeeName: z.string().optional(), runNumber: z.string().optional(), payrollRunId: z.string().optional(),
  periodStart: z.string(), periodEnd: z.string(), currency: z.string().min(1), incomeTaxAmount: decimal, insuranceAmount: decimal,
  calculation: z.object({ grossAmount: decimal, otherDeductionAmount: decimal, reimbursementAmount: decimal, netAmount: decimal,
    availability: z.string().optional(), reason: z.string().nullish(), jurisdiction, workerClassification: z.string().nullish(),
    policyId: z.string().nullish(), policyVersion: z.number().nullish(), effectiveDate: z.string().optional(),
    jurisdictionResolution: z.object({ source: z.string().nullish(), profileId: z.string().nullish(), profileVersion: z.number().nullish() }).optional(),
  }),
});
export type PayslipSnapshot = z.infer<typeof payslipSnapshotSchema>;
export function readPayslipSnapshot(value: string): PayslipSnapshot | undefined {
  try { const result = payslipSnapshotSchema.safeParse(JSON.parse(value)); return result.success ? result.data : undefined; } catch { return undefined; }
}
