/** Exact payroll states, incomplete jurisdiction and scoped mutation verification. */
import { useCan, type CustomParams } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePayrollActions, type PayrollCommand } from "@/features/payroll/usePayrollActions";
import type { PayrollRun } from "@/types/payroll.dto";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { payroll, payrollId } from "@/tests/fixtures/payroll";
import { tenantKey } from "@/tests/fixtures/finance";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe({ run = payroll, command = { action: "submit-review" } }: { run?: PayrollRun; command?: PayrollCommand }) {
  const actions = usePayrollActions(run); const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  return <><button disabled={access.isLoading} onClick={() => void actions.execute(command).catch(() => undefined)}>Execute</button><span>{actions.pending ? "pending" : "idle"}</span><span>{actions.error?.message}</span>
    {(["recalculate", "submit-review", "approve", "lock"] as const).filter(actions.canExecute).map((x) => <span key={x}>{x}</span>)}</>;
}
describe("usePayrollActions", () => {
  it.each<[string, string[]]>([["CALCULATED", ["recalculate", "submit-review"]], ["VALIDATION_REQUIRED", ["recalculate"]], ["IN_REVIEW", ["approve"]], ["APPROVED", ["lock"]], ["LOCKED", []], ["PAYMENT_SCHEDULED", []], ["COMPLETED", []]])("offers only actual workflow commands for %s", async (status, expected) => {
    await renderFinance(<Probe run={{ ...payroll, status }} />, async () => payroll);
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    for (const action of ["recalculate", "submit-review", "approve", "lock"]) expect(Boolean(screen.queryByText(action))).toBe(expected.includes(action));
  });
  it("blocks finalization with missing jurisdiction even if the run says APPROVED", async () => {
    const request = vi.fn(async () => payroll);
    await renderFinance(<Probe run={{ ...payroll, status: "APPROVED", items: [{ ...payroll.items[0]!, jurisdiction: null, taxAvailability: "UNAVAILABLE", validationReason: "PAYROLL_JURISDICTION_NOT_CONFIGURED", netAmount: null }] }} command={{ action: "lock" }} />, request);
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    expect(screen.queryByText("lock")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it("guards direct unauthorized invocation", async () => {
    const request = vi.fn(async () => payroll); await renderFinance(<Probe />, request, { role: "DISPATCHER" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled();
  });
  it("runs once and invalidates only the returned payroll in the current tenant", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn<(options: CustomParams) => Promise<unknown>>(() => new Promise((resolve) => { finish = resolve; })); const client = new QueryClient();
    const related = ["payroll", tenantKey, "run", payrollId]; const unrelated = [["payroll", "other-tenant", "run", payrollId], ["payroll", tenantKey, "run", "another-run"], ["settlements", tenantKey, "list", {}], ["dashboard"]];
    for (const key of [related, ...unrelated]) client.setQueryData(key, {});
    await renderFinance(<Probe />, request, { client }); await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); fireEvent.click(screen.getByRole("button", { name: "Execute" })); await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: `/api/payroll/runs/${payrollId}/submit-review`, method: "post", payload: {} }); expect(screen.getByText("pending")).toBeInTheDocument(); finish(payroll);
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument()); expect(client.getQueryState(related)?.isInvalidated).toBe(true); for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  });
  it("keeps server conflicts actionable and permits a later retry", async () => {
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "PAYROLL_TRANSITION_INVALID", message: "Payroll changed", requestId: "payroll-request" })).mockResolvedValueOnce(payroll);
    const { client } = await renderFinance(<Probe />, request); const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(await screen.findByText("Payroll changed")).toBeInTheDocument(); expect(invalidate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  });
});
