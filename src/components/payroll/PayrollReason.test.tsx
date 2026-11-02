import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PayrollReason } from "@/components/payroll/PayrollReason";

describe("lý do đối soát", () => {
  it("hiển thị mô tả dự phòng và mã hỗ trợ cho mã lạ", async () => {
    render(<PayrollReason reason="UNKNOWN_CODE" />);
    fireEvent.mouseOver(screen.getByText(/Chưa có mô tả/));
    expect(await screen.findByText("Mã hỗ trợ: UNKNOWN_CODE")).toBeInTheDocument();
  });
});
