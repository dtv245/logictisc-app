/** Real Refine reporting queries: DTO projection, filter refetch, permissions and async states. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfitabilityPage } from "@/pages/profitability/ProfitabilityPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { loadId, summaryRow, tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
import type { CustomParams } from "@refinedev/core";

const identity = vi.hoisted(() => ({ tenantKey: "tenant-finance" as string | undefined }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: identity.tenantKey ? { tenantKey: identity.tenantKey } : undefined }) }));

describe("ProfitabilityPage", () => {
  it("projects collection DTO values and fetches no summary/getOne or other resources", async () => {
    const request = vi.fn(async () => [summaryRow]);
    const { client } = await renderFinance(<ProfitabilityPage />, request);
    expect(await screen.findByTestId("profitability-summary")).toHaveTextContent("777.00");
    expect(screen.getByTestId("profitability-summary")).toHaveTextContent("25%");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]).toBeDefined();
    expect(client.getQueryData(["profitability", tenantKey, "by-load", null])).toEqual({ data: [summaryRow] });
  });
  it("validates UUID and refetches only the supported loadId filter, then resets", async () => {
    const request = vi.fn(async (options: CustomParams) => { expect(options.method).toBe("get"); return [summaryRow]; });
    await renderFinance(<ProfitabilityPage />, request);
    await screen.findByTestId("profitability-summary");
    fireEvent.change(screen.getByLabelText("Load ID"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Filter" }));
    expect(await screen.findByText("Enter a valid load UUID.")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText("Load ID"), { target: { value: loadId } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]?.[0].query).toEqual({ loadId });
    expect(request.mock.calls.every(([x]) => x.url === "/api/reports/profitability/by-load")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Reset Filter" }));
    expect(screen.getByLabelText("Load ID")).toHaveValue("");
  });
  it("shows collection empty state without fabricating summary metrics", async () => {
    await renderFinance(<ProfitabilityPage />, async () => []);
    expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument();
    expect(screen.queryByTestId("profitability-summary")).not.toBeInTheDocument();
  });
  it("shows domain code/request ID and lets the user retry", async () => {
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "CURRENCY_MISMATCH", message: "Mismatch", requestId: "profit-request" })).mockResolvedValue([summaryRow]);
    await renderFinance(<ProfitabilityPage />, request);
    expect(await screen.findByText("Currency does not match the financial records.")).toBeInTheDocument();
    expect(screen.getByText(/profit-request/)).toHaveTextContent("CURRENCY_MISMATCH");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("profitability-summary")).toBeInTheDocument();
  });
  it("keeps loading separate from empty state", async () => {
    await renderFinance(<ProfitabilityPage />, () => new Promise(() => undefined));
    await screen.findByText("Load ID");
    expect(screen.queryByText("No data", { selector: "strong" })).not.toBeInTheDocument();
    expect(document.querySelector(".ant-spin")).not.toBeNull();
  });
  it("denies Dispatcher and does not request reports", async () => {
    const request = vi.fn(async () => [summaryRow]);
    await renderFinance(<ProfitabilityPage />, request, { role: "DISPATCHER" });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
  it("does not fetch before a current tenant is available", async () => {
    identity.tenantKey = undefined;
    try {
      const request = vi.fn(async () => [summaryRow]);
      await renderFinance(<ProfitabilityPage />, request);
      await screen.findByText("Load ID");
      expect(request).not.toHaveBeenCalled();
    } finally { identity.tenantKey = tenantKey; }
  });
});
