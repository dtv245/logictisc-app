/** Renders returned classified costs without deriving shares or merging currency totals. */
import { Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { StatusTag } from "@/components/StatusTag";
import type { ClassifiedCostDto } from "@/types/profitability.dto";
import { financialAmount } from "./financialDisplay";

export function ProfitabilityBreakdownTable({ costs }: { costs: ClassifiedCostDto[] }) {
  const { t, i18n } = useTranslation();
  const columns: ColumnsType<ClassifiedCostDto> = [
    { title: t("loads.financial.category"), dataIndex: "category" },
    { title: t("finance.behavior"), dataIndex: "behavior", render: (value: ClassifiedCostDto["behavior"]) =>
      <StatusTag label={t(`finance.behaviorLabels.${value}`)} tone={value === "UNCLASSIFIED" ? "warning" : "neutral"} /> },
    { title: t("loads.financial.amount"), render: (_, row) => financialAmount(row.amount, row.currency, i18n.language) },
    // The current backend does not return share; do not calculate a denominator from this subset.
    { title: t("finance.share"), render: () => <Tooltip title={t("finance.shareUnavailable")}><span>—</span></Tooltip> },
    { title: t("finance.currency"), dataIndex: "currency" },
    { title: t("finance.source"), render: (_, row) => `${row.sourceType}${row.sourceId ? ` / ${row.sourceId}` : ""}` },
    { title: t("finance.allocation"), dataIndex: "allocationMethod", render: (value: string | null) => value ?? "—" },
    { title: t("finance.reason"), dataIndex: "reason", render: (value: string | null) => value ?? "—" },
  ];
  return <Table rowKey="costId" columns={columns} dataSource={costs} pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: <EmptyState /> }} />;
}
