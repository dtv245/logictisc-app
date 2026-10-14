/** Tenant-scoped settlement keys; custom query invalidation must target these keys explicitly. */
import type { SettlementFilterParams } from "@/types/settlement.dto";
export const settlementKeys = {
  list: (tenantKey: string | undefined, filters: SettlementFilterParams = {}) => ["settlements", tenantKey, "list", filters] as const,
  detail: (tenantKey: string | undefined, id: string) => ["settlements", tenantKey, "detail", id] as const,
  periods: (tenantKey: string | undefined) => ["settlements", tenantKey, "pay-periods"] as const,
  drivers: (tenantKey: string | undefined) => ["settlements", tenantKey, "drivers"] as const,
};
