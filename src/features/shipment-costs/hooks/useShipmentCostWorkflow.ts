/**
 * Cost workflow commands (verify, approve, void) with fail-closed permissions,
 * single-flight execution and tenant-scoped cache invalidation.
 */
import { useCan, useCustomMutation, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { financialQueryKeys } from "@/features/profitability";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { ApiHttpError } from "@/utils/httpError";
import type { ShipmentCostView } from "@/types/shipmentCost.types";

export type ShipmentCostCommand = "verify" | "approve" | "void";

export const useShipmentCostWorkflow = (loadId: string) => {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const tenantKey = tenant?.tenantKey;
  const verifyAccess = useCan({ resource: "shipment-costs", action: "COST_VERIFY" });
  const approveAccess = useCan({ resource: "shipment-costs", action: "COST_APPROVE" });
  const voidAccess = useCan({ resource: "shipment-costs", action: "COST_VOID" });
  const queryClient = useQueryClient();
  const { open } = useNotification();
  const mutation = useCustomMutation<ShipmentCostView, ApiHttpError>();
  const flight = useRef(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const can = {
    verify: verifyAccess.data?.can === true,
    approve: approveAccess.data?.can === true,
    void: voidAccess.data?.can === true,
  };

  const run = async (
    command: ShipmentCostCommand,
    id: string,
    reason?: string,
  ): Promise<void> => {
    if (flight.current) return;
    const allowed =
      command === "verify" ? can.verify
        : command === "approve" ? can.approve
          : can.void;
    if (!tenantKey || !loadId || !id || !allowed) {
      throw new Error(t("forbidden.description"));
    }
    const trimmedReason = reason?.trim();
    if (command === "void" && !trimmedReason) {
      throw new Error(t("loads.financial.voidReasonRequired"));
    }
    flight.current = true;
    setPendingId(id);
    setError(null);
    const messageKey =
      command === "approve" ? "approveCost" : command === "void" ? "voidCost" : "verify";
    try {
      const query =
        command === "void"
          ? `?reason=${encodeURIComponent(trimmedReason ?? "")}`
          : "";
      await mutation.mutateAsync({
        url: `/api/loads/${encodeURIComponent(loadId)}/costs/${encodeURIComponent(id)}/${command}${query}`,
        method: "post",
        values: {},
        errorNotification: false,
        successNotification: false,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: financialQueryKeys.costs(tenantKey, loadId),
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          queryKey: financialQueryKeys.summary(tenantKey, loadId),
          refetchType: "active",
        }),
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            queryKey[0] === "profitability" &&
            queryKey[1] === tenantKey &&
            queryKey[2] === "by-load" &&
            (queryKey[3] === loadId || queryKey[3] === null),
          refetchType: "active",
        }),
      ]);
      open?.({ type: "success", message: t(`loads.financial.${messageKey}Success`) });
    } catch (cause) {
      const failure =
        cause instanceof Error
          ? cause
          : new Error(t(`loads.financial.${messageKey}Failed`));
      setError(failure);
      open?.({
        type: "error",
        message: t(`loads.financial.${messageKey}Failed`),
        description: failure.message,
      });
      throw failure;
    } finally {
      flight.current = false;
      setPendingId(null);
    }
  };

  return {
    can,
    run,
    verify: (id: string) => run("verify", id),
    approve: (id: string) => run("approve", id),
    voidCost: (id: string, reason: string) => run("void", id, reason),
    pendingId,
    error,
  };
};
