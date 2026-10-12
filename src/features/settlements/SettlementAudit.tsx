/** Audit presentation is limited to available backend timestamps and immutable policy version. */
import { Alert, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/formatters/dateTime";
import type { DriverSettlementView } from "@/types/settlement.dto";
export function SettlementAudit({ settlement }: { settlement: DriverSettlementView }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="settlement-audit">
      <Alert type="info" showIcon message={t("settlements.workflow.auditLimit")} style={{ marginBottom: 16 }} />
      <Descriptions bordered column={1} className="settlement-descriptions" items={[
        { key: "calculated", label: t("settlements.calculatedAt"), children: <span className="tabular-nums">{formatDateTime(settlement.calculatedAt, { locale: i18n.language })}</span> },
        { key: "approved", label: t("settlements.workflow.approvedAt"), children: <span className="tabular-nums">{formatDateTime(settlement.approvedAt, { locale: i18n.language })}</span> },
        { key: "locked", label: t("settlements.workflow.lockedAt"), children: <span className="tabular-nums">{formatDateTime(settlement.lockedAt, { locale: i18n.language })}</span> },
        { key: "policy", label: t("settlements.workflow.policyVersion"), children: <span className="break-all">{`${settlement.policyId ?? "—"} / ${settlement.policyVersion ?? "—"}`}</span> },
      ]} />
    </div>
  );
}
