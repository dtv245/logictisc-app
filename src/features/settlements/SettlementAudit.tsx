/** Audit presentation is limited to available backend timestamps and immutable policy version. */
import { Alert, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/formatters/dateTime";
import type { DriverSettlementView } from "@/types/settlement.dto";
export function SettlementAudit({ settlement }: { settlement: DriverSettlementView }) {
  const { t, i18n } = useTranslation();
  return <>
    <Alert type="info" showIcon message={t("settlements.workflow.auditLimit")} />
    <Descriptions bordered column={1} items={[
      { key: "calculated", label: t("settlements.calculatedAt"), children: formatDateTime(settlement.calculatedAt, { locale: i18n.language }) },
      { key: "approved", label: t("settlements.workflow.approvedAt"), children: formatDateTime(settlement.approvedAt, { locale: i18n.language }) },
      { key: "locked", label: t("settlements.workflow.lockedAt"), children: formatDateTime(settlement.lockedAt, { locale: i18n.language }) },
      { key: "policy", label: t("settlements.workflow.policyVersion"), children: `${settlement.policyId ?? "—"} / ${settlement.policyVersion ?? "—"}` },
    ]} />
  </>;
}
