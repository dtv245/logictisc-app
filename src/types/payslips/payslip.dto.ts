/** Immutable RAW payslip DTO returned by PayslipController; current payment status is absent. */
export interface PayslipDto {
  id: string; payrollItemId: string; driverId: string; issuedAt: string; issuedBy: string;
  snapshotJson: string; pdfUri: string; rendererVersion: string; pdfSha256: string;
}
