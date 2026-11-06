/** Real Refine reporting queries: paged projection, filter refetch, permissions and async states. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfitabilityPage } from "@/pages/profitability/ProfitabilityPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { loadId, summaryRow, tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/utils/httpError";

const loader = vi.hoisted(() => vi.fn());

vi.mock("@/features/profitability/api/profitability.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/profitability/api/profitability.api")>();
  return { ...actual, listLoadProfitabilityPage: loader };
});

const identity = vi.hoisted(() => ({ tenantKey: "tenant-finance" as string | undefined }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: identity.tenantKey ? { tenantKey: identity.tenantKey } : undefined }) }));

const pageOf = (rows: typeof summaryRow[], page = 1, total = rows.length) => ({
  rows,
  pagination: total > rows.length
    ? { page, size: 20, total, totalPages: Math.ceil(total / 20), hasNext: page * 20 < total, hasPrevious: page > 1 }
    : null,
});
const singleRow = () => pageOf([summaryRow]);

describe("ProfitabilityPage", () => {
  beforeEach(() => { loader.mockReset(); });
  it("projects collection DTO values and fetches only the first server page", async () => {
    loader.mockResolvedValueOnce(singleRow());
    const { client } = await renderFinance(<ProfitabilityPage />, async () => []);
    expect(await screen.findByTestId("profitability-summary")).toHaveTextContent("777.00");
    expect(screen.getByTestId("profitability-summary")).toHaveTextContent("25%");
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader.mock.calls[0]?.slice(0, 3)).toEqual([1, 10, undefined]);
    expect(client.getQueryData(["profitability", tenantKey, "by-load", null, "pages", 10])).toBeDefined();
  });
  it("validates UUID and refetches only the supported loadId filter", async () => {
    loader.mockResolvedValueOnce(singleRow());
    await renderFinance(<ProfitabilityPage />, async () => []);
    await screen.findByTestId("profitability-summary");
    fireEvent.change(screen.getByLabelText("Load ID"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Filter" }));
    expect(await screen.findByText("Enter a valid load UUID.")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);
    loader.mockResolvedValueOnce(singleRow());
    fireEvent.change(screen.getByLabelText("Load ID"), { target: { value: loadId } });
    fireEvent.click(screen.getByRole("button", { name: "Apply Filter" }));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
    expect(loader.mock.calls[1]?.slice(0, 3)).toEqual([1, 10, loadId]);
    fireEvent.click(screen.getByRole("button", { name: "Reset Filter" }));
    expect(screen.getByLabelText("Load ID")).toHaveValue("");
  });
  it("appends the next server page and stops at the reported end", async () => {
    loader.mockResolvedValueOnce(pageOf([summaryRow], 1, 21));
    await renderFinance(<ProfitabilityPage />, async () => []);
    await screen.findByTestId("profitability-summary");
    const second = { ...summaryRow, loadId: "22222222-2222-4222-8222-222222222222", loadNumber: "L-102" };
    loader.mockResolvedValueOnce({ rows: [second], pagination: null });
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
    expect(loader.mock.calls[1]?.slice(0, 3)).toEqual([2, 10, undefined]);
    expect(await screen.findByText("L-102")).toBeInTheDocument();
    expect(screen.getByText("All 21 loads loaded.")).toBeInTheDocument();
  });
  it("shows collection empty state without fabricating summary metrics", async () => {
    loader.mockResolvedValueOnce(pageOf([]));
    await renderFinance(<ProfitabilityPage />, async () => []);
    expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument();
    expect(screen.queryByTestId("profitability-summary")).not.toBeInTheDocument();
  });
  it("shows domain code/request ID and lets the user retry", async () => {
    loader.mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "CURRENCY_MISMATCH", message: "Mismatch", requestId: "profit-request" }))
      .mockResolvedValueOnce(singleRow());
    await renderFinance(<ProfitabilityPage />, async () => []);
    expect(await screen.findByText("Currency does not match the financial records.")).toBeInTheDocument();
    expect(screen.getByText(/profit-request/)).toHaveTextContent("CURRENCY_MISMATCH");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("profitability-summary")).toBeInTheDocument();
  });
  it("keeps loading separate from empty state", async () => {
    loader.mockReturnValueOnce(new Promise(() => undefined));
    await renderFinance(<ProfitabilityPage />, async () => []);
    await screen.findByText("Load ID");
    expect(screen.queryByText("No data", { selector: "strong" })).not.toBeInTheDocument();
    expect(document.querySelector(".ant-spin")).not.toBeNull();
  });
  it("denies Dispatcher and does not request reports", async () => {
    await renderFinance(<ProfitabilityPage />, async () => [], { role: "DISPATCHER" });
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(loader).not.toHaveBeenCalled();
  });
  it("does not fetch before a current tenant is available", async () => {
    identity.tenantKey = undefined;
    try {
      await renderFinance(<ProfitabilityPage />, async () => []);
      await screen.findByText("Load ID");
      expect(loader).not.toHaveBeenCalled();
    } finally { identity.tenantKey = tenantKey; }
  });
});
