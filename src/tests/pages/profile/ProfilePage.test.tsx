import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConfigProvider, App as AntdApp } from "antd";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import * as currentUserHook from "@/hooks/useCurrentUser";
import * as currentTenantHook from "@/hooks/useCurrentTenant";
import type { CurrentUser } from "@/types/auth.types";
import type { Tenant } from "@/types/tenant.types";

vi.mock("@/hooks/useCurrentUser");
vi.mock("@/hooks/useCurrentTenant");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "profile.title": "Profile",
        "profile.subtitle": "View your user identity, tenant association, and assigned roles",
        "profile.personalInfo": "Personal Information",
        "profile.name": "Full Name",
        "profile.email": "Email",
        "profile.userId": "User ID",
        "profile.openId": "Open ID",
        "profile.employeeId": "Employee ID",
        "profile.tenantInfo": "Tenant Information",
        "profile.tenantName": "Tenant Name",
        "profile.tenantKey": "Tenant Key",
        "profile.tenantId": "Tenant ID",
        "profile.rolesAndPermissions": "Roles & Permissions",
        "profile.roles": "Assigned Roles",
        "profile.permissions": "Permissions",
        "profile.noRoles": "No roles assigned",
        "profile.noPermissions": "No specific permissions",
        "queryError.title": "Unable to load content",
        "queryError.description": "Something went wrong while loading this content.",
      };
      return translations[key] ?? key;
    },
  }),
}));

const mockUser: CurrentUser = {
  id: "user-123",
  openId: "openid-456",
  name: "John Dispatcher",
  email: "john@example.com",
  tenantId: "tenant-789",
  tenantKey: "alpha-logistics",
  tenantName: "Alpha Logistics LLC",
  employeeId: "emp-999",
  roles: ["DISPATCHER", "MANAGER"] as const,
  permissions: ["loads:read", "loads:write"],
};

const mockTenant: Tenant = {
  id: "tenant-789",
  tenantKey: "alpha-logistics",
  tenantName: "Alpha Logistics LLC",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <ConfigProvider>
        <AntdApp>
          <ProfilePage />
        </AntdApp>
      </ConfigProvider>,
    );

  it("renders user information correctly without calling extra endpoints", () => {
    vi.spyOn(currentUserHook, "useCurrentUser").mockReturnValue({
      data: mockUser,
      isLoading: false,
      isError: false,
    } as unknown as currentUserHook.UseCurrentUserResult);

    vi.spyOn(currentTenantHook, "useCurrentTenant").mockReturnValue({
      tenant: mockTenant,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as currentTenantHook.UseCurrentTenantResult);

    renderComponent();

    // Verify user details
    expect(screen.getAllByText("John Dispatcher").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("john@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("user-123")).toBeInTheDocument();
    expect(screen.getByText("openid-456")).toBeInTheDocument();
    expect(screen.getByText("emp-999")).toBeInTheDocument();

    // Verify tenant details
    expect(screen.getAllByText("Alpha Logistics LLC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("alpha-logistics")).toBeInTheDocument();
    expect(screen.getByText("tenant-789")).toBeInTheDocument();

    // Verify roles and permissions
    expect(screen.getByText("DISPATCHER")).toBeInTheDocument();
    expect(screen.getByText("MANAGER")).toBeInTheDocument();
    expect(screen.getByText("loads:read")).toBeInTheDocument();
    expect(screen.getByText("loads:write")).toBeInTheDocument();

    // Ensure useCurrentUser was called exactly once to reuse identity cache
    expect(currentUserHook.useCurrentUser).toHaveBeenCalledTimes(1);
    expect(currentTenantHook.useCurrentTenant).toHaveBeenCalledTimes(1);
  });

  it("renders loading state when identity is being fetched", () => {
    vi.spyOn(currentUserHook, "useCurrentUser").mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as currentUserHook.UseCurrentUserResult);

    vi.spyOn(currentTenantHook, "useCurrentTenant").mockReturnValue({
      tenant: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as currentTenantHook.UseCurrentTenantResult);

    const { container } = renderComponent();
    expect(container.querySelector(".ant-spin")).toBeInTheDocument();
    expect(screen.queryByText("John Dispatcher")).not.toBeInTheDocument();
  });

  it("renders error state when identity fails to load", () => {
    vi.spyOn(currentUserHook, "useCurrentUser").mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as currentUserHook.UseCurrentUserResult);

    vi.spyOn(currentTenantHook, "useCurrentTenant").mockReturnValue({
      tenant: undefined,
      isLoading: false,
      error: new Error("Failed to load user"),
      refetch: vi.fn(),
    } as unknown as currentTenantHook.UseCurrentTenantResult);

    renderComponent();
    expect(screen.getByText("Unable to load content")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong while loading this content.")).toBeInTheDocument();
  });
});
