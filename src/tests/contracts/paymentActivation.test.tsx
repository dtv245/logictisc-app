import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentCommandForm } from "@/features/payments/PaymentCommandForm";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";

describe("Payment activation", () => {
  it("dormant Payment forms make no production request", async () => {
    const request = vi.fn();
    await renderFinance(
      <>
        <PaymentCommandForm action="create" />
        <PaymentCommandForm action="edit" id="payment" />
        <PaymentCommandForm action="cancel" id="payment" />
      </>,
      request,
    );
    expect(screen.getAllByText("Waiting for backend runtime verification")).toHaveLength(3);
    expect(request).not.toHaveBeenCalled();
  });
});
