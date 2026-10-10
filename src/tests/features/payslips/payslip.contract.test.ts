/** Primary contracts: known authenticated authorities, immutable snapshot projection and no unsafe PDF paths. */
import { describe, expect, it, vi } from "vitest";
import { canJwtRolesAccess } from "@/providers/permissions/roleMatrix";
import { JWT_ROLES } from "@/types/roles.types";
import { readPayslipSnapshot } from "@/features/payslips/payslip.snapshot";
import { downloadPayslipPdf, type PayslipDownloader } from "@/features/payslips/payslip.api";
import { payslipSnapshot } from "@/tests/fixtures/payslip";
import { enMessages, viMessages, jaMessages } from "@/locales";
describe("payslip contract", () => {
  it.each(JWT_ROLES)("allows own-data access for known authenticated %s without edit/global list/payment bypass", (role) => {
    expect(canJwtRolesAccess([role], "payslips", "PAYSLIP_VIEW")).toBe(true);
    for (const action of ["list", "edit", "PAYROLL_SCHEDULE_PAYMENT", "delete", "arbitrary"]) expect(canJwtRolesAccess([role], "payslips", action)).toBe(false);
  });
  it("keeps malformed snapshots unavailable and projects only actual server fields", () => {
    expect(readPayslipSnapshot(JSON.stringify(payslipSnapshot))?.calculation.netAmount).toBe("811.21"); for (const value of ["{", "null", "{}", JSON.stringify({ ...payslipSnapshot, currency: "", calculation: null })]) expect(readPayslipSnapshot(value)).toBeUndefined();
  });
  it("rejects unvalidated identifiers before invoking the downloader", async () => {
    const download = vi.fn<PayslipDownloader>(); await expect(downloadPayslipPdf("../outside", download)).rejects.toThrow("INVALID_PAYSLIP_ID"); expect(download).not.toHaveBeenCalled();
  });
  it("has every new payslip string in all supported locales", () => {
    expect(Object.keys(viMessages.payslips).sort()).toEqual(Object.keys(enMessages.payslips).sort()); expect(Object.keys(jaMessages.payslips).sort()).toEqual(Object.keys(enMessages.payslips).sort());
    expect(viMessages.payslips.errors.PAYSLIP_PDF_UNAVAILABLE).toBeTruthy(); expect(jaMessages.payslips.errors.PAYSLIP_PDF_UNAVAILABLE).toBeTruthy();
  });
});
