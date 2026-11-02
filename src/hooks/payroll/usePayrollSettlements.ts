import { useQuery } from "@tanstack/react-query";
import { useCan } from "@refinedev/core";
import { listPayrollSettlements } from "@/api/payroll/settlementPicker.api";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { isUuid } from "@/utils/uuid";

export function usePayrollSettlements(payPeriodId: string, page: number, pageSize: number) {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "settlements", action: "SETTLEMENT_VIEW" });
  const query = useQuery({
    queryKey: ["payroll-settlement-picker", tenant?.tenantKey, payPeriodId, page, pageSize],
    queryFn: ({ signal }) => listPayrollSettlements(payPeriodId, page, pageSize, signal),
    enabled: Boolean(tenant?.tenantKey && access.data?.can && isUuid(payPeriodId)),
    keepPreviousData: false,
  });
  return { ...query, allowed: access.data?.can === true, checkingAccess: access.isLoading };
}
