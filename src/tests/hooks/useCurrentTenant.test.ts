/**
 * Kiểm thử useCurrentTenant và useAuthStatus là các hook mỏng,
 * đảm bảo rằng chúng suy ra đúng giá trị từ identity đã cung cấp.
 *
 * Không cần mount toàn bộ Refine/app: chỉ cần provider tối thiểu.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCurrentTenant } from "@hooks/useCurrentTenant";
import { useTenantList } from "@hooks/useTenantList";
import type { CurrentUser } from "@/types/auth.types";

// ---------------------------------------------------------------------------
// Shared mock infrastructure
// ---------------------------------------------------------------------------

/**
 * useCurrentUser là nguồn dữ liệu của cả hai hook.
 * Mock module để kiểm tra logic suy luận của hook mà không cần Refine context.
 */
vi.mock("@hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

import { useCurrentUser } from "@hooks/useCurrentUser";

const setCurrentUser = (data: CurrentUser | undefined) => {
  vi.mocked(useCurrentUser).mockReturnValue({
    data,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: data !== undefined,
    status: data !== undefined ? "success" : "pending",
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useCurrentUser>);
};

// ---------------------------------------------------------------------------
// useCurrentTenant
// ---------------------------------------------------------------------------

describe("useCurrentTenant", () => {
  it("returns the matching tenant from the tenants array", () => {
    setCurrentUser({
      id: "user-1",
      openId: "user-1",
      name: "Test User",
      tenantId: "t-1",
      tenantKey: "t-1",
      tenantName: "Tenant One",
      tenants: [
        { id: "t-1", tenantKey: "t-1", tenantName: "Tenant One" },
        { id: "t-2", tenantKey: "t-2", tenantName: "Tenant Two" },
      ],
      roles: ["MANAGER"],
    });

    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.tenant?.tenantKey).toBe("t-1");
    expect(result.current.tenant?.tenantName).toBe("Tenant One");
  });

  it("synthesizes a minimal tenant when tenants array does not contain the current key", () => {
    setCurrentUser({
      id: "user-1",
      openId: "user-1",
      name: "Test User",
      tenantId: "orphan-tenant",
      tenantKey: "orphan-tenant",
      tenantName: "Orphan",
      tenants: [],
      roles: ["DISPATCHER"],
    });

    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.tenant?.tenantKey).toBe("orphan-tenant");
    expect(result.current.tenant?.tenantName).toBe("Orphan");
  });

  it("returns undefined tenant when tenantKey is absent", () => {
    setCurrentUser({
      id: "user-1",
      openId: "user-1",
      name: "Test User",
      tenantId: "t-1",
      tenantKey: undefined,
      roles: ["OWNER"],
    });

    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.tenant).toBeUndefined();
  });

  it("returns undefined tenant when user data is not yet loaded", () => {
    setCurrentUser(undefined);

    const { result } = renderHook(() => useCurrentTenant());
    expect(result.current.tenant).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// useTenantList
// ---------------------------------------------------------------------------

describe("useTenantList", () => {
  it("returns the full tenant list from identity", () => {
    const tenants = [
      { id: "t-1", tenantKey: "t-1", tenantName: "Alpha" },
      { id: "t-2", tenantKey: "t-2", tenantName: "Beta" },
    ];
    setCurrentUser({
      id: "u-1",
      openId: "u-1",
      name: "User",
      tenantId: "t-1",
      tenantKey: "t-1",
      tenants,
      roles: ["SUPERADMIN"],
    });

    const { result } = renderHook(() => useTenantList());
    expect(result.current.tenants).toHaveLength(2);
    expect(result.current.tenants[0]?.tenantKey).toBe("t-1");
  });

  it("returns an empty array when tenants is undefined", () => {
    setCurrentUser({
      id: "u-1",
      openId: "u-1",
      name: "User",
      tenantId: "t-1",
      tenantKey: "t-1",
      roles: ["DRIVER"],
    });

    const { result } = renderHook(() => useTenantList());
    expect(result.current.tenants).toEqual([]);
  });
});
