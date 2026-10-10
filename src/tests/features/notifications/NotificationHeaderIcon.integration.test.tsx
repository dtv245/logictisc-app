/** Real Refine list queries prove permission/tenant gates and server-owned read state. */
import type { BaseRecord, DataProvider, GetListParams } from "@refinedev/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotificationHeaderIcon } from "@/features/notifications/components/NotificationHeaderIcon";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { Notification } from "@/types/notification.types";
import { ApiHttpError } from "@/providers/api/httpError";
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
vi.mock("@/features/notifications/notificationSound", () => ({ playNotificationSound: vi.fn() }));
const item: Notification = { id: "notice-101", title: "Recent shipment", message: "Arrival recorded", isRead: false, createdDate: "2026-10-05T08:00:00Z" };
function listProvider(read: () => Notification[], observe: (params: GetListParams) => void = () => undefined): DataProvider["getList"] {
  // Only this typed HTTP mock adapts the generic Refine result boundary.
  return async <TData extends BaseRecord>(params: GetListParams) => { observe(params); return { data: read() as unknown as TData[], total: 42 }; };
}
describe("notification header integration", () => {
  it("fetches just recent widget data and does not fake read on navigation", async () => {
    const observe = vi.fn(); const request = vi.fn(async () => 2);
    await renderFinance(<NotificationHeaderIcon />, request, { role: "DRIVER", listRequest: listProvider(() => [item], observe) });
    fireEvent.click(await screen.findByRole("button", { name: "Notifications" })); expect(await screen.findByRole("button", { name: "Recent shipment (Unread)" })).toBeInTheDocument();
    expect(observe).toHaveBeenCalledWith(expect.objectContaining({ resource: "notifications", pagination: expect.objectContaining({ current: 1, pageSize: 5 }) }));
    expect(screen.queryByText("42")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Recent shipment (Unread)" }));
    fireEvent.click(screen.getByRole("button", { name: "Notifications" })); expect(await screen.findByRole("button", { name: "Recent shipment (Unread)" })).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("refetches the header after persisted mark-read and retains the server result", async () => {
    let read = false; const request = vi.fn(async () => { read = true; return 1; }); const observe = vi.fn();
    await renderFinance(<NotificationHeaderIcon />, request, { role: "OWNER", listRequest: listProvider(() => [{ ...item, isRead: read }], observe) });
    fireEvent.click(await screen.findByRole("button", { name: "Notifications" })); fireEvent.click(await screen.findByRole("button", { name: "Mark all as read" })); const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" })); expect(await screen.findByRole("button", { name: "Recent shipment (Read)" })).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1); expect(observe).toHaveBeenCalledTimes(2);
  });
  it("fails closed before list fetching when the authority is unknown", async () => {
    const observe = vi.fn(); const { client } = await renderFinance(<NotificationHeaderIcon />, async () => 0, { role: "UNKNOWN", listRequest: listProvider(() => [item], observe) });
    await waitFor(() => expect(client.getQueryCache().getAll().some((query) => query.state.status === "success")).toBe(true)); expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument(); expect(observe).not.toHaveBeenCalled();
  });
  it("distinguishes loading, empty and failed widget requests", async () => {
    const pending: DataProvider["getList"] = () => new Promise(() => undefined);
    const loading = await renderFinance(<NotificationHeaderIcon />, async () => 0, { role: "OWNER", listRequest: pending }); fireEvent.click(await screen.findByRole("button", { name: "Notifications" })); expect(document.querySelector(".ant-spin")).not.toBeNull(); expect(screen.queryByText("No notifications")).not.toBeInTheDocument(); loading.unmount();
    const empty = await renderFinance(<NotificationHeaderIcon />, async () => 0, { role: "OWNER", listRequest: listProvider(() => []) }); fireEvent.click(await screen.findByRole("button", { name: "Notifications" })); expect(await screen.findByText("No notifications")).toBeInTheDocument(); empty.unmount();
    let fail = true; const list: DataProvider["getList"] = async <TData extends BaseRecord>() => { if (fail) throw new ApiHttpError({ statusCode: 500, code: "SERVER_ERROR", message: "Notice unavailable", requestId: "notice-request" }); return { data: [item] as unknown as TData[], total: 1 }; };
    await renderFinance(<NotificationHeaderIcon />, async () => 0, { role: "OWNER", listRequest: list }); fireEvent.click(await screen.findByRole("button", { name: "Notifications" })); expect(await screen.findByText("Notice unavailable")).toBeInTheDocument(); fail = false; fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(await screen.findByRole("button", { name: "Recent shipment (Unread)" })).toBeInTheDocument();
  });
});
