import { useFrozenCustomMutation } from "@/hooks/useFrozenCustomMutation";
/** Server workflow guards and shared single-flight for validated payroll commands. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { CalculatePayrollPayload, PayrollRun } from "@/types/payroll.dto";
import { payrollApi, payrollKeys } from "./payroll.api";
export type PayrollCommand = { action: "calculate"; payload: CalculatePayrollPayload } | { action: "recalculate" | "submit-review" | "approve" | "lock" };
export type PayrollAction = PayrollCommand["action"];
const states: Record<Exclude<PayrollAction, "calculate">, string[]> = {
  recalculate: ["CALCULATED", "VALIDATION_REQUIRED"], "submit-review": ["CALCULATED"], approve: ["IN_REVIEW"], lock: ["APPROVED"],
};
export function payrollIsValidated(run: PayrollRun): boolean {
  return !run.validationReason && run.items.length > 0 && run.items.every((item) => item.taxAvailability === "AVAILABLE" && !item.validationReason && item.netAmount != null && item.jurisdiction != null && item.policyId != null && item.policyVersion != null);
}
export function usePayrollActions(run?: PayrollRun) {
  const { tenant } = useCurrentTenant(); const { t } = useTranslation(); const client = useQueryClient(); const { open } = useNotification();
  const calculate = useCan({ resource: "payroll", action: "PAYROLL_CALCULATE" });
  const recalculate = useCan({ resource: "payroll", action: "PAYROLL_RECALCULATE" });
  const review = useCan({ resource: "payroll", action: "PAYROLL_REVIEW" });
  const approve = useCan({ resource: "payroll", action: "PAYROLL_APPROVE" });
  const lock = useCan({ resource: "payroll", action: "PAYROLL_LOCK" });
  const permissions = { calculate: calculate.data?.can, recalculate: recalculate.data?.can, "submit-review": review.data?.can, approve: approve.data?.can, lock: lock.data?.can };
  const mutation = useFrozenCustomMutation<PayrollRun>(); const flight = useRef(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState<Error | null>(null);
  const canExecute = (action: PayrollAction) => Boolean(tenant?.tenantKey && permissions[action] === true &&
    (action === "calculate" ? !run : run && states[action].includes(run.status) && (action === "recalculate" || payrollIsValidated(run))));
  const execute = async (command: PayrollCommand): Promise<PayrollRun | undefined> => {
    if (flight.current) return undefined;
    if (!canExecute(command.action)) throw new Error(t("forbidden.description"));
    flight.current = true; setPending(true); setError(null);
    try {
      const result = await mutation.mutateAsync({ url: command.action === "calculate" ? payrollApi.calculate : payrollApi.command(run!.id, command.action),
        method: "post", meta: RAW_RESPONSE_META, values: command.action === "calculate" ? command.payload : {}, errorNotification: false, successNotification: false });
      await client.invalidateQueries({ queryKey: payrollKeys.run(tenant?.tenantKey, result.data.id), refetchType: "active" });
      open?.({ type: "success", message: t("payroll.actionSuccess") }); return result.data;
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error(t("payroll.actionFailed")); setError(failure);
      open?.({ type: "error", message: t("payroll.actionFailed"), description: failure.message }); throw failure;
    } finally { flight.current = false; setPending(false); }
  };
  return { canExecute, execute, pending, error };
}
export type PayrollActionsResult = ReturnType<typeof usePayrollActions>;
