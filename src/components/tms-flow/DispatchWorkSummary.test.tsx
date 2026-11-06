import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DispatchWorkSummary } from "./DispatchWorkSummary";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) => {
      const labels: Record<string, string> = {
        "tmsDispatch.summary.label": "Việc cần xử lý",
        "tmsDispatch.summary.atRisk": "Lô cần chú ý",
        "tmsDispatch.summary.unassigned": "Lô chưa có xe",
        "tmsDispatch.summary.pendingApprovals": "Gợi ý chờ duyệt",
        "tmsDispatch.summary.count": `${values?.count ?? 0} lô`,
        "tmsDispatch.summary.atLeast": `Ít nhất ${values?.count ?? 0} lô`,
      };
      return labels[key] ?? key;
    },
  }),
}));

describe("DispatchWorkSummary", () => {
  it("distinguishes exact counts from lower-bound counts and filters on click", () => {
    const onAtRisk = vi.fn();
    render(
      <DispatchWorkSummary
        atRiskCount={6}
        atRiskIsLowerBound
        unassignedCount={4}
        pendingApprovalCount={2}
        onAtRisk={onAtRisk}
        onUnassigned={vi.fn()}
        onPendingApprovals={vi.fn()}
      />,
    );

    expect(screen.getByTestId("dispatch-summary-at-risk")).toHaveTextContent("Ít nhất 6 lô");
    expect(screen.getByTestId("dispatch-summary-unassigned")).toHaveTextContent("4 lô");
    expect(screen.getByTestId("dispatch-summary-approvals")).toHaveTextContent("2 lô");
    fireEvent.click(screen.getByTestId("dispatch-summary-at-risk"));
    expect(onAtRisk).toHaveBeenCalledOnce();
  });

  it("omits a count if the source has not produced one", () => {
    render(
      <DispatchWorkSummary
        onAtRisk={vi.fn()}
        onUnassigned={vi.fn()}
        onPendingApprovals={vi.fn()}
      />,
    );

    expect(screen.getByTestId("dispatch-summary-at-risk")).toHaveTextContent("Lô cần chú ý");
    expect(screen.getByTestId("dispatch-summary-at-risk")).not.toHaveTextContent("0 lô");
  });
});
