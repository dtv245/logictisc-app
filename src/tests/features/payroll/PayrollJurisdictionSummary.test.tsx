/** Snapshot evidence and generic country/subdivision concepts survive unavailable/invalid data. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PayrollJurisdictionSummary } from "@/features/payroll/PayrollJurisdictionSummary";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll } from "@/tests/fixtures/payroll";
import { readPayrollResolution } from "@/features/payroll/payroll.snapshot";
describe("PayrollJurisdictionSummary", () => {
  it.each([["WORK_PAYROLL_OVERRIDE", "Work Override"], ["EMPLOYEE_PROFILE", "Employee Profile"], ["TENANT_DEFAULT", "Tenant Default"]])("shows backend resolution %s without inferring it", async (source, label) => {
    await renderFinance(<PayrollJurisdictionSummary item={{ ...payroll.items[0]!, calculationSnapshotJson: JSON.stringify({ jurisdictionResolution: { source, profileId: "profile-1", profileVersion: 2 } }) }} />, async () => ({}));
    expect(screen.getByText(label!)).toBeInTheDocument(); expect(screen.getByText("SG")).toBeInTheDocument(); expect(screen.getByText("Region / Subdivision")).toBeInTheDocument(); expect(screen.queryByText("State")).not.toBeInTheDocument();
  });
  it("leaves missing/malformed snapshot resolution unavailable", () => {
    for (const value of [null, "", "{invalid", "null", JSON.stringify({ jurisdictionResolution: { source: 0 } }), "{}"]) expect(readPayrollResolution(value)).toBeUndefined();
  });
});
