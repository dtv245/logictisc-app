/** Settlement line/source details use the detail DTO; no row-level getOne waterfall. */
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { formatDateOnly } from "@/formatters/dateTime";
import type { SettlementLineView } from "@/types/settlement.dto";

export function SettlementLinesTable({ lines, sourceOnly = false }: { lines: SettlementLineView[]; sourceOnly?: boolean }) {
  const { t, i18n } = useTranslation();
  const columns: ColumnsType<SettlementLineView> = sourceOnly ? [
    { title: t("finance.load"), dataIndex: "loadId", render: (value: string | null) => value ?? "—" },
    { title: t("settlements.workflow.trip"), dataIndex: "tripId", render: (value: string | null) => value ?? "—" },
    { title: t("finance.source"), render: (_, row) => `${row.sourceType ?? "—"} / ${row.sourceId ?? "—"}` },
    { title: t("settlements.workflow.businessDate"), dataIndex: "businessDate", render: (value: string | null) => formatDateOnly(value, { locale: i18n.language }) },
  ] : [
    { title: t("settlements.workflow.lineClass"), dataIndex: "lineClass", render: (value: string) => t(`settlements.workflow.lineClasses.${value}`, { defaultValue: value }) },
    { title: t("settlements.workflow.lineType"), dataIndex: "lineType" },
    { title: t("settlements.workflow.description"), dataIndex: "description" },
    { title: t("loads.financial.quantity"), render: (_, row) => `${row.quantity ?? "—"} ${row.unit ?? ""}` },
    { title: t("settlements.workflow.rate"), render: (_, row) => financialAmount(row.rate, row.currency, i18n.language) },
    { title: t("loads.financial.amount"), render: (_, row) => financialAmount(row.amount, row.currency, i18n.language) },
  ];
  return <Table rowKey="id" dataSource={lines} columns={columns} pagination={false} scroll={{ x: "max-content" }} locale={{ emptyText: <EmptyState /> }} />;
}
