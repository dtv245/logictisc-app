import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/AppHeader";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ data: { name: "Profile Owner", email: "owner@example.com" }, isLoading: false, isError: false }) }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: { tenantKey: "tenant-finance", tenantName: "Finance Tenant" } }) }));
vi.mock("@/hooks/useTenantList", () => ({ useTenantList: () => ({ tenants: [] }) }));
vi.mock("@/hooks/useSwitchTenant", () => ({ useSwitchTenant: () => ({ switchTenant: vi.fn(), isLoading: false }) }));
vi.mock("@/hooks/useLogoutUser", () => ({ useLogoutUser: () => ({ logoutUser: vi.fn() }) }));
vi.mock("@/hooks/useApiError", () => ({ useApiError: () => ({ showApiError: vi.fn() }) }));
vi.mock("@/features/notifications/components/NotificationHeaderIcon", () => ({ NotificationHeaderIcon: () => null }));
describe("AppHeader blocked Profile contract", () => {
  it("keeps existing identity and session actions without exposing a dead Profile menu or new requests", async () => {
    const request = vi.fn(async () => undefined); await renderFinance(<AppHeader />, request);
    fireEvent.mouseEnter(screen.getByText("Profile Owner")); expect(await screen.findByText("Sign out")).toBeInTheDocument();
    expect(screen.getByText("Change company")).toBeInTheDocument(); expect(screen.queryByText("Profile", { exact: true })).not.toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
});
