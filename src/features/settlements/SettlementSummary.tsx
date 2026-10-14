/** Read-only settlement amounts and immutable policy/parent references returned by the backend. */
import { Alert, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { financialAmount } from "@/features/profitability/utils/financialDisplay";
import type { DriverSettlementView } from "@/types/settlement.dto";

export function SettlementSummary({ settlement: s }: { settlement: DriverSettlementView }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="settlement-summary">
      {s.validationReason && <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t("settlements.statuses.validation_required")} description={s.validationReason} />}
      <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} className="settlement-descriptions" items={[
        { key: "number", label: t("settlements.settlementNumber"), children: <span className="break-all">{s.settlementNumber}</span> },
        { key: "driver", label: t("settlements.driver"), children: <span className="break-word">{s.driverName ?? s.driverId}</span> },
        { key: "period", label: t("settlements.payPeriod"), children: s.payPeriodCode ?? s.payPeriodId },
        { key: "status", label: t("finance.workflowStatus"), children: <StatusTag label={t(`settlements.statuses.${s.status.toLowerCase()}`, { defaultValue: s.status })} tone={statusTone(s.status)} /> },
        { key: "type", label: t("settlements.type"), children: t(`settlements.types.${s.settlementType.toLowerCase()}`) },
        { key: "gross", label: t("settlements.gross"), children: <span className="tabular-nums font-semibold">{financialAmount(s.grossEarnings, s.currency, i18n.language)}</span> },
        { key: "deductions", label: t("settlements.deductions"), children: <span className="tabular-nums">{financialAmount(s.deductionAmount, s.currency, i18n.language)}</span> },
        { key: "reimbursements", label: t("settlements.reimbursements"), children: <span className="tabular-nums">{financialAmount(s.reimbursementAmount, s.currency, i18n.language)}</span> },
        { key: "net", label: t("settlements.net"), children: <strong className="tabular-nums" style={{ fontWeight: 700, fontSize: 16, color: "#1677ff" }}>{financialAmount(s.settlementNet, s.currency, i18n.language)}</strong> },
        { key: "currency", label: t("finance.currency"), children: s.currency },
        { key: "policy", label: t("settlements.workflow.policyVersion"), children: <span className="break-all">{`${s.policyId ?? "—"} / ${s.policyVersion ?? "—"}`}</span> },
        { key: "parent", label: t("settlements.workflow.parent"), children: <span className="break-all">{s.parentSettlementId ?? "—"}</span> },
      ]} />
    </div>
  );
}
