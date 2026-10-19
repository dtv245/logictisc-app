import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShipmentGapsCard } from "@/features/loads/components/redesign/ShipmentGapsCard";

vi.mock("@/hooks/ai/useLoadAiGaps", () => ({
  useLoadAiGaps: () => ({
    blockingGaps: [{
      id: "gap-1",
      loadId: "load-1",
      severity: "BLOCKING",
      status: "OPEN",
      fieldKey: "pickupDate",
      fieldName: "pickupDate",
      fieldLabel: "Ngày lấy hàng",
      questionNatural: "Vui lòng cung cấp ngày lấy hàng.",
      askCount: 0,
      maxAsks: 3,
    }],
    warningGaps: [],
    dismissGap: vi.fn(),
  }),
}));

describe("ShipmentGapsCard edit gating", () => {
  it("disables Fill and explains that the core Load editor is unavailable", () => {
    render(<ShipmentGapsCard loadId="load-1" />);

    expect(screen.getByRole("button", { name: /Điền trên form/ })).toBeDisabled();
    expect(screen.getByRole("note")).toHaveTextContent("Chỉnh sửa Load chưa khả dụng");
  });
});
