/** Settlement list/lookup/calculation queries through the existing Refine transport. */
import { useCan, useCustom, useCustomMutation, useNotification } from "@refinedev/core";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError, PagedResponse } from "@/types/api.types";
import type {
  CalculateSettlementPayload,
  DriverSettlementView,
  PayPeriodView,
  SettlementFilterParams,
} from "@/types/settlement.dto";
import { SETTLEMENT_ENDPOINTS } from "./settlement.api";
import { settlementKeys } from "./settlement.keys";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useQueryClient } from "@tanstack/react-query";

export const SETTLEMENTS_QUERY_KEY = ["driver-settlements"];

export interface UseSettlementsReturn {
  settlements: DriverSettlementView[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export const useSettlements = (
  filters?: SettlementFilterParams
): UseSettlementsReturn => {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "settlements", action: "SETTLEMENT_VIEW" });
  const queryParams: Record<string, string> = {};
  if (filters?.payPeriodId) queryParams.payPeriodId = filters.payPeriodId;
  if (filters?.driverId) queryParams.driverId = filters.driverId;
  if (filters?.status) queryParams.status = filters.status;
  if (filters?.settlementType) queryParams.settlementType = filters.settlementType;

  const { data, isLoading, isError, error, refetch } = useCustom<
    DriverSettlementView[],
    ApiError,
    Record<string, string>
  >({
    url: SETTLEMENT_ENDPOINTS.list,
    errorNotification: false,
    queryOptions: { queryKey: settlementKeys.list(tenant?.tenantKey, filters), enabled: Boolean(tenant?.tenantKey && access.data?.can) },
    method: "get",
    config: {
      query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    },
  });

  return {
    settlements: Array.isArray(data?.data) ? data.data : [],
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export interface UsePayPeriodsReturn {
  payPeriods: PayPeriodView[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const usePayPeriods = (): UsePayPeriodsReturn => {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "settlements", action: "SETTLEMENT_VIEW" });
  const { data, isLoading, isError, refetch } = useCustom<
    PayPeriodView[],
    ApiError
  >({
    url: SETTLEMENT_ENDPOINTS.payPeriods,
    queryOptions: { queryKey: settlementKeys.periods(tenant?.tenantKey), enabled: Boolean(tenant?.tenantKey && access.data?.can) },
    method: "get",
  });

  return {
    payPeriods: Array.isArray(data?.data) ? data.data : [],
    isLoading,
    isError,
    refetch,
  };
};

export interface DriverOption {
  id: string;
  fullName: string;
  email?: string;
}

export interface UseDriversReturn {
  drivers: DriverOption[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface RawEmployee {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const useDrivers = (): UseDriversReturn => {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "drivers", action: "read" });
  const { data, isLoading, isError, refetch } = useCustom<
    PagedResponse<RawEmployee>,
    ApiError
  >({
    url: SETTLEMENT_ENDPOINTS.drivers,
    queryOptions: { queryKey: settlementKeys.drivers(tenant?.tenantKey), enabled: Boolean(tenant?.tenantKey && access.data?.can) },
    method: "get",
    config: {
      query: {
        page: 1,
        pageSize: 100,
      },
    },
  });

  const rawList = Array.isArray(data?.data?.items)
    ? data.data.items
    : [];

  const drivers: DriverOption[] = rawList.map((emp) => ({
    id: emp.id,
    fullName: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.email || emp.id,
    email: emp.email,
  }));

  return {
    drivers,
    isLoading,
    isError,
    refetch,
  };
};

export interface UseCalculateSettlementReturn {
  calculateSettlement: (
    payload: CalculateSettlementPayload
  ) => Promise<DriverSettlementView | null>;
  isCalculating: boolean;
}

export const useCalculateSettlement = (): UseCalculateSettlementReturn => {
  const { t } = useTranslation();
  const { open } = useNotification();
  const queryClient = useQueryClient();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "settlements", action: "SETTLEMENT_CALCULATE" });
  const tenantKey = tenant?.tenantKey;
  const canCalculate = access.data?.can;
  // Ref closes the same-render gap before React can disable the submit button.
  const flight = useRef(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const { mutateAsync: mutateCustom } = useCustomMutation<
    DriverSettlementView,
    ApiError
  >();

  const calculateSettlement = useCallback(
    async (
      payload: CalculateSettlementPayload
    ): Promise<DriverSettlementView | null> => {
      if (flight.current || !tenantKey || canCalculate !== true) return null;
      flight.current = true;
      setIsCalculating(true);
      try {
        const response = await mutateCustom({
          url: SETTLEMENT_ENDPOINTS.calculate,
          method: "post",
          values: payload,
        });

        open?.({
          type: "success",
          message: t(
            "settlements.calculateSuccess",
            "Settlement calculated successfully"
          ),
        });

        await queryClient.invalidateQueries({ queryKey: ["settlements", tenantKey, "list"], refetchType: "active" });

        return response.data;
      } catch (err: unknown) {
        const apiError = err as ApiError;
        open?.({
          type: "error",
          message: t(
            "settlements.calculateError",
            "Failed to calculate settlement"
          ),
          description: apiError?.message || String(err),
        });
        return null;
      } finally {
        flight.current = false;
        setIsCalculating(false);
      }
    },
    [mutateCustom, open, queryClient, tenantKey, canCalculate, t]
  );

  return {
    calculateSettlement,
    isCalculating,
  };
};
