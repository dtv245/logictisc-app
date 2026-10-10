/** Mark-read confirmation, permissions, single-flight and notification-only invalidation. */
import { useCan } from "@refinedev/core";
import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNotificationActions } from "@/features/notifications/useNotificationActions";
import { NotificationMarkAllRead } from "@/features/notifications/components/NotificationMarkAllRead";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
function Probe() {
  const actions = useNotificationActions(); const access = useCan({ resource: "notifications", action: "list" });
  return <><button disabled={access.isLoading} onClick={() => void actions.markAllRead().catch(() => undefined)}>Execute</button><span>{actions.pending ? "pending" : "idle"}</span><span>{actions.error?.message}</span></>;
}
describe("notification actions", () => {
  it("requires confirmation that explicitly states the tenant-wide effect", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn(() => new Promise<unknown>((resolve) => { finish = resolve; }));
    await renderFinance(<NotificationMarkAllRead />, request, { role: "OWNER" }); fireEvent.click(await screen.findByRole("button", { name: "Mark all as read" })); const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/shared state affects other users/)).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
    const confirm = within(dialog).getByRole("button", { name: "Confirm" }); fireEvent.click(confirm); fireEvent.click(confirm); await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled(); finish(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("sends the command once and invalidates only notifications/header in the current tenant", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn(() => new Promise<unknown>((resolve) => { finish = resolve; })); const client = new QueryClient();
    const related = ["notification-header", "tenant-finance"]; const unrelated = [["notification-header", "another-tenant"], ["default", "loads", "list", {}], ["dashboard"]];
    for (const key of [related, ...unrelated]) client.setQueryData(key, {}); const { notification } = await renderFinance(<Probe />, request, { role: "DRIVER", client });
    const invalidate = vi.spyOn(client, "invalidateQueries"); await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); fireEvent.click(screen.getByRole("button", { name: "Execute" })); await waitFor(() => expect(request).toHaveBeenCalledTimes(1)); expect(screen.getByText("pending")).toBeInTheDocument(); finish(0);
    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument()); expect(client.getQueryState(related)?.isInvalidated).toBe(true); for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ type: "success" })); expect(invalidate.mock.calls.every(([filter]) => !filter || JSON.stringify(filter).includes("notifications") || JSON.stringify(filter).includes("notification-header"))).toBe(true);
  });
  it("guards direct unauthorized invocation and hides the action", async () => {
    const request = vi.fn(async () => 0); await renderFinance(<><Probe /><NotificationMarkAllRead /></>, request, { role: "UNKNOWN" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(request).not.toHaveBeenCalled(); expect(screen.queryByRole("button", { name: "Mark all as read" })).not.toBeInTheDocument();
  });
  it("retains actionable error/request ID without faking local read success", async () => {
    const request = vi.fn().mockRejectedValueOnce(new ApiHttpError({ statusCode: 409, code: "NOTIFICATION_CONFLICT", message: "Server conflict", requestId: "notification-request" })).mockResolvedValueOnce(2);
    const { client, notification } = await renderFinance(<Probe />, request, { role: "OWNER" }); const invalidate = vi.spyOn(client, "invalidateQueries");
    await waitFor(() => expect(screen.getByRole("button", { name: "Execute" })).toBeEnabled()); fireEvent.click(screen.getByRole("button", { name: "Execute" })); expect(await screen.findByText("Server conflict")).toBeInTheDocument(); expect(invalidate).not.toHaveBeenCalled();
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({ type: "error", description: expect.stringContaining("notification-request") }));
    fireEvent.click(screen.getByRole("button", { name: "Execute" })); await waitFor(() => expect(screen.queryByText("Server conflict")).not.toBeInTheDocument());
  });
});
