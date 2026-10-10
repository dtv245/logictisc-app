/** Ownership selectors, membership failures and dormant commands use the real frontend provider. */
import { AxiosHeaders, type AxiosAdapter } from "axios";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@/providers/api/apiClient";
import { createLogisticsDataProvider } from "@/providers/dataProvider";
import { createMessagingCommands } from "@/features/messaging/messaging.api";
import { MessagingPanel } from "@/features/messaging/MessagingPanel";
import { PaymentCommandForm } from "@/features/payments/PaymentCommandForm";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import type { CurrentUser } from "@/types/auth.types";

const session = vi.hoisted(() => ({ employeeId: "self-employee" as string | undefined }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { id: "self-subject", tenantId: "tenant-finance", employeeId: session.employeeId, roles: ["ADMIN"] }, isLoading: false }) }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance" } }) }));
const identity: CurrentUser = { id: "self-subject", openId: "self-subject", name: "Fixture", tenantId: "tenant-finance", employeeId: "self-employee", roles: ["DRIVER"] };

describe("Messaging identity and activation", () => {
  it("binds reads to the current employee and omits spoofable send/participant selectors", async () => {
    const requests: Record<string, unknown>[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push({ url: config.url, query: config.params, body: config.data === undefined ? undefined : JSON.parse(config.data) });
      return { config, data: { success: true, code: "OK", message: "OK", data: { id: "conversation" }, errors: [], meta: { timestamp: "2026-10-07T00:00:00Z", path: config.url, requestId: "fixture" } }, status: 200, statusText: "200", headers: new AxiosHeaders() };
    };
    const apiClient = createApiClient({ runtimeConfig: { apiBaseUrl: "http://localhost:8080", healthPath: "/api/health", requestTimeoutMs: 5000 }, tokenProvider: { getAccessToken: () => "fixture", refreshAccessToken: async () => null }, adapter });
    const commands = createMessagingCommands(createLogisticsDataProvider({ apiClient, resources: {} }).custom!, identity);
    await commands.conversations(2, 20); await commands.send("conversation", "Message"); await commands.create({ isTenantChat: false, name: "Private" });
    expect(requests[0]?.query).toEqual({ employeeId: "self-employee", page: 2, pageSize: 20 });
    expect(requests[1]?.body).toEqual({ conversationId: "conversation", content: "Message" });
    expect(requests[2]?.body).toEqual({ isTenantChat: false, name: "Private" });
    await expect(commands.create({ isTenantChat: true })).rejects.toThrow("FORBIDDEN");
  });

  it("rejects null employee mapping before any caller-selected request", async () => {
    const request = vi.fn(); const commands = createMessagingCommands(request, { ...identity, employeeId: undefined });
    await expect(commands.conversations()).rejects.toThrow("MESSAGING_EMPLOYEE_REQUIRED");
    await expect(commands.send("conversation", "Hello")).rejects.toThrow("MESSAGING_EMPLOYEE_REQUIRED");
    expect(request).not.toHaveBeenCalled();
  });

  it("dormant Messaging and Payment forms make no production request", async () => {
    const request = vi.fn(); await renderFinance(<><MessagingPanel /><PaymentCommandForm action="create" /><PaymentCommandForm action="edit" id="payment" /><PaymentCommandForm action="cancel" id="payment" /></>, request);
    expect(screen.getAllByText("Waiting for backend runtime verification")).toHaveLength(4);
    expect(request).not.toHaveBeenCalled();
  });

  it("renders null mapping without opening a different employee selector", async () => {
    session.employeeId = undefined; const request = vi.fn(); await renderFinance(<MessagingPanel runtimeVerified />, request);
    await screen.findByText("Your account needs a mapped employee to use this workflow."); expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument(); session.employeeId = "self-employee";
  });

  it("retains message input when membership is denied and does not retry automatically", async () => {
    const { ApiHttpError } = await import("@/providers/api/httpError");
    const request = vi.fn(async (options) => {
      if (options.method === "post") throw new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Nonmember", requestId: "denied" });
      if (options.url.includes("conversations")) return { items: [{ id: "private", name: "Private", isTenantChat: false, createdAt: "2026-10-07T00:00:00Z" }], totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 20 };
      return { items: [], totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 50 };
    });
    await renderFinance(<MessagingPanel runtimeVerified />, request);
    fireEvent.mouseDown(await screen.findByRole("combobox")); fireEvent.click(await screen.findByText("Private"));
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Keep this draft" } }); fireEvent.click(screen.getByText("Send message"));
    await screen.findByText("Access denied. This conversation requires current membership.");
    expect(screen.getByLabelText("Message")).toHaveValue("Keep this draft");
    await waitFor(() => expect(request.mock.calls.filter(([options]) => options.method === "post")).toHaveLength(1));
  });
});
