import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RatingAcceptance } from "@/features/rates/components/RatingAcceptance";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";

describe("RatingAcceptance runtime gate", () => {
  it("keeps rating and invoice commands unavailable until runtime verification", async () => {
    const request = vi.fn(async () => ({}));
    await renderFinance(
      <RatingAcceptance
        loadId="load-id"
        request={{ currency: "USD", contextSource: "test", accessorialIds: [] }}
        preview={{ inputHash: "input-hash", resultHash: "result-hash" }}
      />,
      request,
    );

    expect(screen.queryByRole("button", { name: "Accept rating snapshot" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generate primary invoice" })).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
});
