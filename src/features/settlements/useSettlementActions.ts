/** Owns confirmed settlement commands, state/permission checks, single-flight and affected cache invalidation. */
import { useCan, useCustomMutation, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { DriverSettlementView, SettlementAdjustmentPayload, SettlementStatus } from "@/types/settlement.dto";
import { ApiHttpError } from "@/providers/api/httpError";
import { SETTLEMENT_ENDPOINTS } from "./settlement.api";

export type SettlementCommand =
  | { action: "submitReview" | "approve" | "lock" | "resolveValidation" }
  | { action: "requireValidation" | "reversal"; payload: { reason: string } }
  | { action: "adjustments"; payload: SettlementAdjustmentPayload };
export type SettlementAction = SettlementCommand["action"];
const finalized: SettlementStatus[] = ["LOCKED", "PAYMENT_SCHEDULED", "PAID"];
export const SETTLEMENT_COMMAND_STATES: Record<SettlementAction, readonly SettlementStatus[]> = {
  submitReview: ["CALCULATED"], approve: ["IN_REVIEW"], lock: ["APPROVED"], resolveValidation: ["VALIDATION_REQUIRED"],
  requireValidation: ["CALCULATED", "VALIDATION_REQUIRED", "IN_REVIEW", "APPROVED"], adjustments: finalized, reversal: finalized,
};
export interface UseSettlementActionsResult {
  pending: boolean;
  error: Error | null;
  canExecute: (action: SettlementAction) => boolean;
  execute: (command: SettlementCommand) => Promise<DriverSettlementView | undefined>;
}
export function useSettlementActions(settlement: DriverSettlementView): UseSettlementActionsResult {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const client = useQueryClient();
  const { open } = useNotification();
  const mutation = useCustomMutation<DriverSettlementView, ApiHttpError>();
  const review = useCan({ resource: "settlements", action: "SETTLEMENT_REVIEW" });
  const approve = useCan({ resource: "settlements", action: "SETTLEMENT_APPROVE" });
  const lock = useCan({ resource: "settlements", action: "SETTLEMENT_LOCK" });
  const requireValidation = useCan({ resource: "settlements", action: "SETTLEMENT_REQUIRE_VALIDATION" });
  const resolveValidation = useCan({ resource: "settlements", action: "SETTLEMENT_RESOLVE_VALIDATION" });
  const adjust = useCan({ resource: "settlements", action: "SETTLEMENT_ADJUST" });
  const reverse = useCan({ resource: "settlements", action: "SETTLEMENT_REVERSE" });
  const permissions = { submitReview: review.data?.can, approve: approve.data?.can, lock: lock.data?.can,
    requireValidation: requireValidation.data?.can, resolveValidation: resolveValidation.data?.can, adjustments: adjust.data?.can, reversal: reverse.data?.can };
  // One ref shared by every command prevents parallel approve/lock/correction clicks.
  const flight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const canExecute = (action: SettlementAction): boolean => Boolean(tenant?.tenantKey && permissions[action] === true && SETTLEMENT_COMMAND_STATES[action].includes(settlement.status));
  const execute = async (command: SettlementCommand): Promise<DriverSettlementView | undefined> => {
    if (flight.current) return undefined;
    if (!canExecute(command.action)) throw new Error(t("forbidden.description"));
    flight.current = true; setPending(true); setError(null);
    try {
      const result = await mutation.mutateAsync({ url: SETTLEMENT_ENDPOINTS[command.action](settlement.id), method: "post",
        values: "payload" in command ? command.payload : {}, errorNotification: false, successNotification: false });
      const affectedLines = [...(settlement.lines ?? []), ...(result.data.lines ?? []), ...(command.action === "adjustments" ? command.payload.lines : [])];
      const loadIds = new Set(affectedLines.flatMap((line) => line.loadId ? [line.loadId] : []));
      await Promise.all([
        client.invalidateQueries({ queryKey: ["settlements", tenant?.tenantKey, "detail", settlement.id], refetchType: "active" }),
        client.invalidateQueries({ queryKey: ["settlements", tenant?.tenantKey, "list"], refetchType: "active" }),
        client.invalidateQueries({ predicate: ({ queryKey: key }) => key[1] === tenant?.tenantKey &&
          ((key[0] === "load-finance" && typeof key[2] === "string" && loadIds.has(key[2])) ||
          (key[0] === "profitability" && key[2] === "by-load" && (key[3] === null || (typeof key[3] === "string" && loadIds.has(key[3]))))), refetchType: "active" }),
      ]);
      open?.({ type: "success", message: t("settlements.workflow.actionSuccess") });
      return result.data;
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error(t("settlements.workflow.actionFailed"));
      setError(failure);
      open?.({ type: "error", message: t("settlements.workflow.actionFailed"), description: failure.message });
      throw failure;
    } finally { flight.current = false; setPending(false); }
  };
  return { pending, error, canExecute, execute };
}
