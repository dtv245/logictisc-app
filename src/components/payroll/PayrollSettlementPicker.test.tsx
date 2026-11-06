import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PayrollSettlementPicker } from "@/components/payroll/PayrollSettlementPicker";
import type { DriverSettlementView } from "@/types/settlements/settlement.dto";

const period = "11111111-1111-4111-8111-111111111111";
vi.mock("@/hooks/payroll/usePayrollSettlements", () => ({
  usePayrollSettlements: () => ({ allowed: true, checkingAccess: false, isFetching: false, isError: false,
    data: { data: [
      { id: "a", settlementNumber: "A", driverName: "An", payPeriodId: "11111111-1111-4111-8111-111111111111", status: "LOCKED", currency: "USD", settlementNet: "12.34" },
      { id: "b", settlementNumber: "B", driverName: "Bình", payPeriodId: "11111111-1111-4111-8111-111111111111", status: "LOCKED", currency: "EUR", settlementNet: "5" },
    ], meta: { pagination: { total: 2 } } }, refetch: vi.fn() }),
}));
function Harness() {
  const [value, setValue] = useState<DriverSettlementView[]>([]);
  return <PayrollSettlementPicker payPeriodId={period} currency="USD" value={value} onChange={setValue} />;
}
describe("chọn quyết toán tính lương", () => {
  it("chỉ cho chọn cùng tiền tệ và tính tổng từ các dòng đã chọn", () => {
    render(<Harness />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[2]).toBeDisabled();
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText(/Tổng: 12.34 USD/)).toBeInTheDocument();
  });
});
