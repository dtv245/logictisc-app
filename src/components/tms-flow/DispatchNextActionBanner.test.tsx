import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ShipmentNextAction } from "@/hooks/tms-flow/useShipmentNextAction";

import { DispatchNextActionBanner } from "./DispatchNextActionBanner";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      key === "tmsDispatch.nextAction.risk"
        ? `Cần chú ý: ${values?.reason}`
        : ({
            "tmsDispatch.nextAction.none": "Không cần làm gì",
            "tmsDispatch.nextAction.title": "Việc tiếp theo",
            "tmsDispatch.nextAction.viewDetails": "Xem đầy đủ",
            "tmsDispatch.nextAction.approve": "Đồng ý dùng xe này",
            "tmsDispatch.nextAction.suggestionReady": "Hệ thống đã chọn sẵn xe cho lô này",
            "tmsDispatch.nextAction.manualAssign": "Chọn xe thủ công",
            "tmsDispatch.nextAction.manualAssignUnavailable": "Chưa có thao tác phân công xe khả dụng ở màn hình này.",
            "tmsDispatch.nextAction.noSuggestion": "Chưa có gợi ý cho lô này",
          }[key] ?? key),
  }),
}));

const callbacks = () => ({ onViewLoad: vi.fn(), onReviewSuggestion: vi.fn() });

describe("DispatchNextActionBanner", () => {
  it("shows one prominent action for risk and invokes the matching callback", () => {
    const props = callbacks();
    const action: ShipmentNextAction = { kind: "risk", reason: "Giao hàng quá hạn" };
    render(<DispatchNextActionBanner action={action} {...props} />);

    expect(screen.getByText("Cần chú ý: Giao hàng quá hạn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem đầy đủ" }));
    expect(props.onViewLoad).toHaveBeenCalledOnce();
    expect(props.onReviewSuggestion).not.toHaveBeenCalled();
  });

  it("offers review for a pending suggestion", () => {
    const props = callbacks();
    render(<DispatchNextActionBanner action={{ kind: "approve-suggestion", approval: {} as never }} {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Đồng ý dùng xe này" }));
    expect(props.onReviewSuggestion).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("explains why manual assignment is disabled", () => {
    render(<DispatchNextActionBanner action={{ kind: "manual-assignment-unavailable" }} {...callbacks()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Chưa có gợi ý cho lô này");
    expect(screen.getByRole("button", { name: "Chọn xe thủ công" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa có thao tác phân công xe khả dụng ở màn hình này.");
  });
});
