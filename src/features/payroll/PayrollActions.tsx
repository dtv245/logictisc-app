/** Confirmation and normalized errors for the current payroll action matrix. */
import { Alert, Space } from "antd";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { ApiHttpError } from "@/providers/api/httpError";
import type { PayrollActionsResult } from "./usePayrollActions";
export function PayrollActionError({ error }: { error: Error | null }) {
  const { t, i18n } = useTranslation();
  if (!error) return null;

  let message = error.message;
  if (error instanceof ApiHttpError) {
    if (error.code && i18n.exists(`payroll.errors.${error.code}`)) {
      message = t(`payroll.errors.${error.code}`);
    } else if (error.statusCode === 409) {
      message = t("payroll.errors.CONFLICT_409");
    }
  }

  return (
    <Alert
      type="error"
      showIcon
      message={message}
      description={
        error instanceof ApiHttpError
          ? `${error.code || error.statusCode}${error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${error.requestId}` : ""}`
          : undefined
      }
      style={{ marginBottom: 16 }}
    />
  );
}
export function PayrollActions({ actions }: { actions: PayrollActionsResult }) {
  const { t } = useTranslation();
  return <Space direction="vertical" style={{ width: "100%" }}><PayrollActionError error={actions.error} />
    <Space wrap>{(["recalculate", "submit-review", "approve", "lock"] as const).map((action) => actions.canExecute(action) &&
      <ConfirmActionModal key={action} triggerLabel={t(`payroll.actions.${action}`)} triggerAriaLabel={t(`payroll.actions.${action}`)} title={t(`payroll.actions.${action}`)}
        description={t("payroll.confirmAction")} disabled={actions.pending} onConfirm={async () => { await actions.execute({ action }); }} />)}</Space>
  </Space>;
}
