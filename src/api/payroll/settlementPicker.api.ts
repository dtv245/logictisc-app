import { getLogisticsApiClient } from "@/lib/apiClient";
import type { DriverSettlementView } from "@/types/settlement.dto";

export interface SettlementPickerPage {
  data: DriverSettlementView[];
  meta: { pagination: { total: number } };
}

export async function listPayrollSettlements(payPeriodId: string, page: number, pageSize: number, signal?: AbortSignal): Promise<SettlementPickerPage> {
  const response = await getLogisticsApiClient().instance.get<SettlementPickerPage>("/api/driver-settlements", {
    params: { payPeriodId, status: "LOCKED", page, pageSize }, signal,
    logistics: { responseMode: "raw" },
  });
  if (!Array.isArray(response.data.data) || !Number.isFinite(response.data.meta?.pagination?.total)) {
    throw new Error("Không thể đọc danh sách quyết toán phân trang.");
  }
  return response.data;
}
