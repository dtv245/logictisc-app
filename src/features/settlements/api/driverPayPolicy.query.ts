import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCan, useCustom, useCustomMutation, useInvalidate, useNotification } from "@refinedev/core";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type {
  DriverPayPolicyRequest,
  DriverPayPolicyView,
} from "@/types/driverPayPolicy.dto";
import { DRIVER_PAY_POLICY_ENDPOINTS } from "./driverPayPolicy.api";

export const DRIVER_PAY_POLICIES_QUERY_KEY = ["driver-pay-policies"];

export interface UseDriverPayPoliciesReturn {
  policies: DriverPayPolicyView[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export const useDriverPayPolicies = (): UseDriverPayPoliciesReturn => {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "driver-pay-policies", action: "POLICY_VIEW" });
  const { data, isLoading, isError, error, refetch } = useCustom<
    DriverPayPolicyView[],
    ApiError
  >({
    url: DRIVER_PAY_POLICY_ENDPOINTS.list,
    queryOptions: { queryKey: ["driver-pay-policies", tenant?.tenantKey, "list"], enabled: Boolean(tenant?.tenantKey && access.data?.can) },
    method: "get",
  });

  return {
    policies: data?.data ?? [],
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export interface UseDriverPayPolicyReturn {
  policy: DriverPayPolicyView | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export const useDriverPayPolicy = (id?: string): UseDriverPayPolicyReturn => {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "driver-pay-policies", action: "POLICY_VIEW" });
  const { data, isLoading, isError, error, refetch } = useCustom<
    DriverPayPolicyView,
    ApiError
  >({
    url: id ? DRIVER_PAY_POLICY_ENDPOINTS.get(id) : "",
    method: "get",
    queryOptions: {
      queryKey: ["driver-pay-policies", tenant?.tenantKey, "detail", id],
      enabled: Boolean(id && tenant?.tenantKey && access.data?.can),
    },
  });

  return {
    policy: data?.data ?? null,
    isLoading,
    isError,
    error: error ?? null,
    refetch,
  };
};

export interface UseDriverPayPolicyMutationsReturn {
  createPolicy: (request: DriverPayPolicyRequest) => Promise<DriverPayPolicyView | null>;
  createNewVersion: (
    previousId: string,
    request: DriverPayPolicyRequest
  ) => Promise<DriverPayPolicyView | null>;
  isSubmitting: boolean;
}

export const useDriverPayPolicyMutations = (): UseDriverPayPolicyMutationsReturn => {
  const { t } = useTranslation();
  const { open } = useNotification();
  const invalidate = useInvalidate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: mutateCustom } = useCustomMutation<
    DriverPayPolicyView,
    ApiError
  >();

  const createPolicy = useCallback(
    async (request: DriverPayPolicyRequest): Promise<DriverPayPolicyView | null> => {
      setIsSubmitting(true);
      try {
        const response = await mutateCustom({
          url: DRIVER_PAY_POLICY_ENDPOINTS.create,
          method: "post",
          values: request,
        });

        open?.({
          type: "success",
          message: t("settlements.policyCreatedSuccess", "Pay policy created successfully"),
        });

        await invalidate({
          resource: "settlements",
          invalidates: ["list"],
        });

        return response.data;
      } catch (err: unknown) {
        const apiError = err as ApiError;
        open?.({
          type: "error",
          message: t("settlements.policyCreatedError", "Failed to create pay policy"),
          description: apiError?.message || String(err),
        });
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mutateCustom, open, invalidate, t]
  );

  const createNewVersion = useCallback(
    async (
      previousId: string,
      request: DriverPayPolicyRequest
    ): Promise<DriverPayPolicyView | null> => {
      setIsSubmitting(true);
      try {
        const response = await mutateCustom({
          url: DRIVER_PAY_POLICY_ENDPOINTS.newVersion(previousId),
          method: "post",
          values: request,
        });

        open?.({
          type: "success",
          message: t(
            "settlements.policyVersionCreatedSuccess",
            "New policy version created successfully"
          ),
        });

        await invalidate({
          resource: "settlements",
          invalidates: ["list", "detail"],
        });

        return response.data;
      } catch (err: unknown) {
        const apiError = err as ApiError;
        open?.({
          type: "error",
          message: t(
            "settlements.policyVersionCreatedError",
            "Failed to create new policy version"
          ),
          description: apiError?.message || String(err),
        });
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [mutateCustom, open, invalidate, t]
  );

  return {
    createPolicy,
    createNewVersion,
    isSubmitting,
  };
};
