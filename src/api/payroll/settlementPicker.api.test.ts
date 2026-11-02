import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPayrollSettlements } from "@/api/payroll/settlementPicker.api";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/apiClient", () => ({ getLogisticsApiClient: () => ({ instance: { get } }) }));

describe("danh sách quyết toán cho payroll", () => {
  beforeEach(() => get.mockReset());
  it("gửi kỳ, trạng thái khóa và phân trang một-based", async () => {
    get.mockResolvedValue({ data: { data: [], meta: { pagination: { total: 23 } } } });
    expect((await listPayrollSettlements("period", 2, 20)).meta.pagination.total).toBe(23);
    expect(get).toHaveBeenCalledWith("/api/driver-settlements", expect.objectContaining({
      params: { payPeriodId: "period", status: "LOCKED", page: 2, pageSize: 20 },
      logistics: { responseMode: "raw" },
    }));
  });
  it("báo lỗi khi thiếu metadata phân trang", async () => {
    get.mockResolvedValue({ data: { data: [], meta: {} } });
    await expect(listPayrollSettlements("period", 1, 20)).rejects.toThrow("Không thể đọc danh sách quyết toán phân trang.");
  });
});
