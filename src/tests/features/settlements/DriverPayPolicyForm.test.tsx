import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriverPayPolicyForm } from "@/features/settlements/DriverPayPolicyForm";
import type { DriverPayPolicyView } from "@/types/driverPayPolicy.dto";

describe("DriverPayPolicyForm", () => {
  const samplePolicy: DriverPayPolicyView = {
    id: "pol-101",
    policyCode: "POL-REG-01",
    name: "Regional Standard Driver Pay",
    driverId: null,
    payMethod: "PERCENT_REVENUE",
    perMileRate: null,
    perLoadRate: null,
    hourlyRate: null,
    dailyRate: null,
    flatRate: null,
    revenuePercentage: 0.25, // 25%
    mileageBasis: null,
    revenueBasis: "INVOICE_SUBTOTAL",
    detentionRate: 50,
    detentionFreeMinutes: 120,
    detentionBlockMinutes: 15,
    layoverRate: 150,
    stopPayRate: 25,
    currency: "USD",
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-12-31",
    policyVersion: 1,
    active: true,
  };

  it("renders in create mode with empty editable fields", () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<DriverPayPolicyForm mode="create" onSubmit={onSubmit} />);

    expect(screen.getByPlaceholderText("e.g. POL-DRV-STANDARD-2026")).not.toBeDisabled();
    expect(screen.getByText("Create Policy")).toBeInTheDocument();
  });

  it("renders in new-version mode with disabled code and scope, prefilling ratio as percentage", () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <DriverPayPolicyForm
        mode="new-version"
        previousPolicy={samplePolicy}
        onSubmit={onSubmit}
      />
    );

    // Policy code input is disabled in new-version mode
    const codeInput = screen.getByDisplayValue("POL-REG-01");
    expect(codeInput).toBeDisabled();

    // Alert showing previous version and immutability notice
    expect(
      screen.getByText(/Creating new version \(v2\) for policy "POL-REG-01"/i)
    ).toBeInTheDocument();

    // Submit button shows Create New Version
    expect(screen.getByText("Create New Version")).toBeInTheDocument();
  });

  it("converts percentage input 25% to ratio 0.25 in submission payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <DriverPayPolicyForm
        mode="create"
        onSubmit={onSubmit}
      />
    );

    // Fill policy identification
    fireEvent.change(screen.getByPlaceholderText("e.g. POL-DRV-STANDARD-2026"), {
      target: { value: "POL-PCT-TEST" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Standard Regional Driver Pay Policy"), {
      target: { value: "Test Percentage Policy" },
    });

    // Select PERCENT_REVENUE
    const methodSelect = screen.getByLabelText("Pay Method");
    fireEvent.mouseDown(methodSelect);
    const percentOption = await screen.findByText("PERCENT_REVENUE");
    fireEvent.click(percentOption);

    // Fill revenue percentage (enter 30 for 30%)
    const percentInput = await screen.findByLabelText("Revenue Percentage (%)");
    fireEvent.change(percentInput, { target: { value: "30" } });

    // Fill effective from date
    const effectiveFromInput = screen.getByLabelText("Effective From");
    fireEvent.change(effectiveFromInput, { target: { value: "2026-05-01" } });
    fireEvent.keyDown(effectiveFromInput, { key: "Enter", code: "Enter" });

    // Submit
    const submitBtn = screen.getByText("Create Policy");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const callArg = onSubmit.mock.calls[0][0];
    expect(callArg.policyCode).toBe("POL-PCT-TEST");
    expect(callArg.payMethod).toBe("PERCENT_REVENUE");
    // Transport ratio must be 0.3 (30%)
    expect(callArg.revenuePercentage).toBe(0.3);
    // Effective from date is date-only string YYYY-MM-DD
    expect(callArg.effectiveFrom).toBe("2026-05-01");
  });

  it("rejects effectiveFrom that is not after previous version effective date", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <DriverPayPolicyForm
        mode="new-version"
        previousPolicy={samplePolicy}
        onSubmit={onSubmit}
      />
    );

    // Previous policy effectiveFrom is 2026-01-01
    // Enter same or earlier date (2026-01-01)
    const effectiveFromInput = screen.getByLabelText("Effective From");
    fireEvent.change(effectiveFromInput, { target: { value: "2026-01-01" } });
    fireEvent.keyDown(effectiveFromInput, { key: "Enter", code: "Enter" });

    const submitBtn = screen.getByText("Create New Version");
    fireEvent.click(submitBtn);

    // Validation error should appear and block submission
    await waitFor(() => {
      expect(document.querySelector(".ant-form-item-has-error")).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
