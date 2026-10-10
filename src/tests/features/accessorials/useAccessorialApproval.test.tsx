/** Tests the workflow boundary: authorization, single-flight, conflict and scoped cache invalidation. */
import { useCan } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAccessorialApproval } from "@/features/accessorials/useAccessorialApproval";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { financialQueryKeys } from "@/features/profitability/profitability.api";
import { loadId, tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";

vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe() {
  const approval = useAccessorialApproval(loadId);
  const permission = useCan({ resource: "accessorials", action: "ACCESSORIAL_APPROVE" });
  return <><button disabled={permission.isLoading} onClick={() => void approval.approve("acc-1").catch(() => undefined)}>Execute</button>
    <span>{approval.pending ? "pending" : "idle"}</span><span>{approval.error?.message}</span></>;
}

describe("useAccessorialApproval", () => {
  it("blocks double-clicks and invalidates only related reads in the same tenant", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const request = vi.fn(() => new Promise<unknown>((done) => { resolve = done; }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const related = [financialQueryKeys.costs(tenantKey, loadId), financialQueryKeys.summary(tenantKey, loadId), financialQueryKeys.byLoad(tenantKey), financialQueryKeys.byLoad(tenantKey, loadId)];
    const unrelated = [financialQueryKeys.summary("other-tenant", loadId), financialQueryKeys.byLoad(tenantKey, "other-load"), ["dashboard"]];
    for (const key of [...related, ...unrelated]) client.setQueryData(key, {});
    const { notification } = await renderFinance(<Probe />, request, { client });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    const button = screen.getByRole("button", { name: "Execute" });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(screen.getByText("pending")).toBeInTheDocument();
    resolve({ id: "acc-1" });
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument());
    for (const key of related) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
  });
  it("fails closed for Dispatcher even when the handler is invoked directly", async () => {
    const request = vi.fn(async () => ({}));
    await renderFinance(<Probe />, request, { role: "DISPATCHER" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    expect(request).not.toHaveBeenCalled();
  });
  it("retains a domain conflict and permits a later retry without invalidating on failure", async () => {
    const conflict = new ApiHttpError({ statusCode: 409, code: "ACCESSORIAL_STATE_INVALID", message: "Charge already approved", requestId: "request-conflict" });
    const request = vi.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce({ id: "acc-1" });
    const { client } = await renderFinance(<Probe />, request);
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    expect(await screen.findByText("Charge already approved")).toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Execute" }));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("Charge already approved")).not.toBeInTheDocument();
  });
});
