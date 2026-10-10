/** Every newly introduced payroll label and domain error must exist in all supported languages. */
import { describe, expect, it } from "vitest";
import { enMessages, viMessages, jaMessages } from "@/locales";
function paths(value: unknown, parent = ""): string[] {
  return typeof value === "object" && value !== null ? Object.entries(value).flatMap(([key, child]) => paths(child, parent ? `${parent}.${key}` : key)) : typeof value === "string" ? [parent] : [];
}
describe("payroll translations", () => {
  it("has identical payroll keys in vi/en/ja, including payment domain errors", () => {
    const expected = paths(enMessages.payroll).sort(); expect(paths(viMessages.payroll).sort()).toEqual(expected); expect(paths(jaMessages.payroll).sort()).toEqual(expected);
    for (const key of ["errors.PAYROLL_JURISDICTION_NOT_CONFIGURED", "errors.PAYMENT_ALREADY_SUCCEEDED", "errors.BANK_COUNTERPARTY_MISMATCH", "paymentStates.SUCCEEDED", "statuses.LOCKED", "statuses.COMPLETED"]) expect(expected).toContain(key);
  });
});
