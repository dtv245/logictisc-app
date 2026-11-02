import { describe, expect, it } from "vitest";
import { payrollReasonDescription } from "@/constants/payrollReasons";

describe("lý do đối soát", () => {
  it("mô tả hai mã đã biết và có thông điệp dự phòng cho mã lạ", () => {
    expect(payrollReasonDescription("PAYMENT_LATE_OUTCOME_REQUIRES_RECONCILIATION")).toContain("đến muộn");
    expect(payrollReasonDescription("PAYMENT_CASE_UNRESOLVED")).toContain("chưa được giải quyết");
    expect(payrollReasonDescription("UNKNOWN_CODE")).toContain("hỗ trợ");
    expect(payrollReasonDescription("Verify bank evidence")).toBe("Verify bank evidence");
  });
});
