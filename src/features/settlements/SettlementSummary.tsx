/** Read-only settlement amounts and immutable policy/parent references returned by the backend. */
import { Alert, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { financialAmount } from "@/features/profitability/financialDisplay";
import type { DriverSettlementView } from "@/types/settlement.dto";

export function SettlementSummary({ settlement: s }: { settlement: DriverSettlementView }) {
  const { t, i18n } = useTranslation();
  return <>
    {s.validationReason && <Alert type="warning" showIcon message={t("settlements.statuses.validation_required")} description={s.validationReason} />}
    <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} items={[
      { key: "number", label: t("settlements.settlementNumber"), children: s.settlementNumber },
      { key: "driver", label: t("settlements.driver"), children: s.driverName ?? s.driverId },
      { key: "period", label: t("settlements.payPeriod"), children: s.payPeriodCode ?? s.payPeriodId },
      { key: "status", label: t("finance.workflowStatus"), children: <StatusTag label={t(`settlements.statuses.${s.status.toLowerCase()}`, { defaultValue: s.status })} tone={statusTone(s.status)} /> },
      { key: "type", label: t("settlements.type"), children: t(`settlements.types.${s.settlementType.toLowerCase()}`) },
      { key: "gross", label: t("settlements.gross"), children: financialAmount(s.grossEarnings, s.currency, i18n.language) },
      { key: "deductions", label: t("settlements.deductions"), children: financialAmount(s.deductionAmount, s.currency, i18n.language) },
      { key: "reimbursements", label: t("settlements.reimbursements"), children: financialAmount(s.reimbursementAmount, s.currency, i18n.language) },
      { key: "net", label: t("settlements.net"), children: financialAmount(s.settlementNet, s.currency, i18n.language) },
      { key: "currency", label: t("finance.currency"), children: s.currency },
      { key: "policy", label: t("settlements.workflow.policyVersion"), children: `${s.policyId ?? "—"} / ${s.policyVersion ?? "—"}` },
      { key: "parent", label: t("settlements.workflow.parent"), children: s.parentSettlementId ?? "—" },
    ]} />
  </>;
}
