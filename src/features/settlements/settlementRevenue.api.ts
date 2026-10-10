/** Revenue correction commands keep snapshot concurrency distinct from billing-document recovery identity. */
import type { DataProvider } from "@refinedev/core";
import type { Adjustment, DriverSettlementView, Impact, Recalculate } from "@/types/handoff.generated";
import { createCommandIntent } from "@/providers/api/commandIntent";

export const settlementRevenueApi = {
  recalculate: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/recalculate-revenue`,
  adjustment: (id: string) => `/api/driver-settlements/${encodeURIComponent(id)}/billing-adjustments`,
};
export function createSettlementRevenueCommands(custom: NonNullable<DataProvider["custom"]>, id: string) {
  return {
    recalculate: createCommandIntent<Recalculate, DriverSettlementView>(async (payload) => (await custom<DriverSettlementView>({ url: settlementRevenueApi.recalculate(id), method: "post", payload })).data),
    adjustment: createCommandIntent<Adjustment, Impact>(async (payload) => (await custom<Impact>({ url: settlementRevenueApi.adjustment(id), method: "post", payload })).data),
  };
}
