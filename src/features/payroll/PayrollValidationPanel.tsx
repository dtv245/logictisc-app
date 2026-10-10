/** Validation evidence is distinct from empty data and keeps backend reasons actionable. */
import { Alert, List, Space } from "antd";
import { useTranslation } from "react-i18next";
import type { PayrollRun } from "@/types/payroll.dto";
import { payrollIsValidated } from "./usePayrollActions";
import { PayrollJurisdictionSummary } from "./PayrollJurisdictionSummary";
export function PayrollValidationPanel({ run }: { run: PayrollRun }) {
  const { t } = useTranslation();
  const valid = payrollIsValidated(run);
  return <Space direction="vertical" style={{ width: "100%" }}>
    <Alert type={valid ? "success" : "warning"} showIcon message={t(valid ? "payroll.validationComplete" : "payroll.statuses.VALIDATION_REQUIRED")}
      description={run.validationReason ? t(`payroll.errors.${run.validationReason}`, { defaultValue: run.validationReason }) : undefined} />
    <List dataSource={run.items} renderItem={(item) => <List.Item><Space direction="vertical" style={{ width: "100%" }}>
      <strong>{item.driverId}</strong>{item.validationReason && <Alert type="warning" message={t(`payroll.errors.${item.validationReason}`, { defaultValue: item.validationReason })} description={item.validationReason} />}
      <PayrollJurisdictionSummary item={item} />
    </Space></List.Item>} />
  </Space>;
}
