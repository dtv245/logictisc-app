import { beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  getLogisticsApiClient: () => ({ instance: transport }),
}));

import { driverProfileApi } from "@/api/drivers/driver-profile.api";

describe("driverProfileApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the 1-based driver directory filters and reads PagedResponse from the envelope data", async () => {
    const page = {
      items: [{ id: "driver-1", firstName: "An", lastName: "Nguyen" }],
      totalItems: 41,
      totalPages: 3,
      currentPage: 2,
      pageSize: 20,
      hasNext: true,
    };
    transport.get.mockResolvedValue({ data: page });

    const result = await driverProfileApi.listDrivers({
      search: "An",
      availability: "AVAILABLE",
      status: "ACTIVE",
      page: 2,
      pageSize: 20,
    });

    expect(transport.get).toHaveBeenCalledWith("/api/drivers", {
      headers: { "Cache-Control": "no-store" },
      params: {
        search: "An",
        availability: "AVAILABLE",
        status: "ACTIVE",
        page: 2,
        pageSize: 20,
      },
    });
    expect(result).toEqual(page);
    expect(result.currentPage).toBe(2);
  });

  it("uses only the authenticated self route for driver profile records", async () => {
    const page = {
      items: [{ id: "license-1", licenseNumber: "****1234" }],
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
      hasNext: false,
    };
    transport.get.mockResolvedValue({ data: page });

    await driverProfileApi.listMyRecords("licenses", { page: 1, pageSize: 20 });

    expect(transport.get).toHaveBeenCalledWith("/api/driver/me/licenses", {
      headers: { "Cache-Control": "no-store" },
      params: { page: 1, pageSize: 20 },
    });
  });

  it("sends expiration filters as documented and requests sensitive values without caching", async () => {
    transport.get.mockResolvedValue({ data: { items: [], totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 20, hasNext: false } });

    await driverProfileApi.listExpiring({ days: 7, type: "HEALTH_INSURANCE", page: 1, pageSize: 20 });
    await driverProfileApi.getSensitiveRecord("driver-1", "bank-accounts", "account-1");

    expect(transport.get).toHaveBeenNthCalledWith(1, "/api/drivers/expiring", {
      headers: { "Cache-Control": "no-store" },
      params: { days: 7, type: "HEALTH_INSURANCE", page: 1, pageSize: 20 },
    });
    expect(transport.get).toHaveBeenNthCalledWith(2, "/api/drivers/driver-1/bank-accounts/account-1/sensitive", {
      headers: { "Cache-Control": "no-store" },
    });
  });
});
