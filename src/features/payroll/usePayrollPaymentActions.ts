import { useFrozenCustomMutation } from "@/hooks/useFrozenCustomMutation";
/** Consequential payment commands keep single-flight and invalidate only affected tenant evidence. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { toMoneyDecimal } from "@/formatters/money";
import type { PayrollItem, PayrollRun, PayrollPayment, PayrollPaymentEvent, ReconcileBankPayload, SchedulePayrollPaymentPayload } from "@/types/payroll.dto";
import { payrollApi, payrollKeys } from "./payroll.api";
import { payrollIsValidated } from "./usePayrollActions";
export function canScheduleItem(run: PayrollRun, item: PayrollItem, attempts: PayrollPayment[]): boolean {
  try { return ["LOCKED", "PAYMENT_SCHEDULED"].includes(run.status) && payrollIsValidated(run) && ["CALCULATED", "SCHEDULED", "PAYMENT_FAILED"].includes(item.status) && item.taxAvailability === "AVAILABLE" && !item.validationReason && item.jurisdiction != null && item.policyId != null && item.policyVersion != null && item.netAmount != null && toMoneyDecimal(item.netAmount).greaterThan(0) &&
    !attempts.some((p) => ["SCHEDULED", "SUBMITTED", "PROCESSING", "RECONCILIATION_REQUIRED", "SUCCEEDED"].includes(p.status)); }
  catch { return false; }
}
export type PayrollPaymentCommand = { action: "schedule"; itemId: string; payload: SchedulePayrollPaymentPayload } |
  { action: "dispatch"; payment: PayrollPayment } | { action: "reconcile"; paymentId: string; payload: ReconcileBankPayload };
export function usePayrollPaymentActions(run?: PayrollRun, item?: PayrollItem, attempts?: PayrollPayment[]) {
  const { tenant } = useCurrentTenant(); const { t } = useTranslation(); const client = useQueryClient(); const { open } = useNotification();
  const schedule = useCan({ resource: "payroll", action: "PAYROLL_SCHEDULE_PAYMENT" }); const dispatch = useCan({ resource: "payroll", action: "PAYROLL_DISPATCH_PAYMENT" }); const reconcile = useCan({ resource: "payroll", action: "PAYROLL_RECONCILE" });
  const mutation = useFrozenCustomMutation<PayrollPayment | PayrollPaymentEvent>(); const flight = useRef(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState<Error | null>(null);
  const canSchedule = Boolean(tenant?.tenantKey && schedule.data?.can && run && item && attempts && canScheduleItem(run, item, attempts));
  const canDispatch = (payment: PayrollPayment) => Boolean(tenant?.tenantKey && dispatch.data?.can && run?.status === "PAYMENT_SCHEDULED" && payment.payrollItemId === item?.id && payment.status === "SCHEDULED" && payment.paymentMethod !== "MANUAL" && payrollIsValidated(run));
  const canReconcile = Boolean(tenant?.tenantKey && reconcile.data?.can);
  const execute = async (command: PayrollPaymentCommand): Promise<PayrollPayment | undefined> => {
    if (flight.current) return undefined;
    const allowed = command.action === "schedule" ? canSchedule && command.itemId === item?.id : command.action === "dispatch" ? canDispatch(command.payment) : canReconcile;
    if (!allowed) throw new Error(t("forbidden.description"));
    flight.current = true; setPending(true); setError(null);
    try {
      const url = command.action === "schedule" ? payrollApi.payments(command.itemId) : command.action === "dispatch" ? payrollApi.dispatch(command.payment.id) : payrollApi.reconcileBank(command.paymentId);
      const response = await mutation.mutateAsync({ url, method: "post", meta: RAW_RESPONSE_META, values: "payload" in command ? command.payload : {}, errorNotification: false, successNotification: false });
      const payment = "payment" in response.data ? response.data.payment : response.data;
      const cachedRuns = client.getQueriesData<{ data: PayrollRun }>({ queryKey: ["payroll", tenant?.tenantKey, "run"] });
      const affectedRuns = new Map(cachedRuns.filter(([, data]) => data?.data?.items?.some((x) => x.id === payment.payrollItemId)).map(([, data]) => [data!.data.id, data!.data]));
      if (run) affectedRuns.set(run.id, run);
      const settlements = new Set([...affectedRuns.values()].flatMap((r) => r.items.filter((x) => x.id === payment.payrollItemId).flatMap((x) => x.settlementIds)));
      await Promise.all([
        client.invalidateQueries({ queryKey: payrollKeys.payments(tenant?.tenantKey, payment.payrollItemId), refetchType: "active" }),
        ...[...affectedRuns.keys()].map((id) => client.invalidateQueries({ queryKey: payrollKeys.run(tenant?.tenantKey, id), refetchType: "active" })),
        ...(command.action === "reconcile" ? [client.invalidateQueries({ queryKey: ["payroll", tenant?.tenantKey, "reconciliation-cases"], refetchType: "active" })] : []),
        ...(settlements.size ? [client.invalidateQueries({ queryKey: ["settlements", tenant?.tenantKey, "list"], refetchType: "active" }), ...[...settlements].map((id) => client.invalidateQueries({ queryKey: ["settlements", tenant?.tenantKey, "detail", id], refetchType: "active" }))] : []),
      ]);
      open?.({ type: "success", message: t("payroll.paymentActionSuccess") }); return payment;
    } catch (cause) { const failure = cause instanceof Error ? cause : new Error(t("payroll.actionFailed")); setError(failure);
      // Provider dispatch may have committed PROCESSING before I/O failed. Refresh that evidence before permitting another action.
      if (command.action === "dispatch" && item && run) await Promise.all([
        client.invalidateQueries({ queryKey: payrollKeys.payments(tenant?.tenantKey, item.id), refetchType: "active" }),
        client.invalidateQueries({ queryKey: payrollKeys.run(tenant?.tenantKey, run.id), refetchType: "active" }),
      ]);
      open?.({ type: "error", message: t("payroll.actionFailed"), description: failure.message }); throw failure; }
    finally { flight.current = false; setPending(false); }
  };
  return { canSchedule, canDispatch, canReconcile, execute, pending, error };
}
export type PayrollPaymentActionsResult = ReturnType<typeof usePayrollPaymentActions>;
