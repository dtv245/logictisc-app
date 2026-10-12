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
    { title: t("finance.load"), dataIndex: "loadId", width: 170, minWidth: 140, render: (value: string | null) => <span className="break-all">{value ?? "—"}</span> },
    { title: t("settlements.workflow.trip"), dataIndex: "tripId", width: 170, minWidth: 140, render: (value: string | null) => <span className="break-all">{value ?? "—"}</span> },
    { title: t("finance.source"), width: 180, minWidth: 150, render: (_, row) => <span className="break-all">{`${row.sourceType ?? "—"} / ${row.sourceId ?? "—"}`}</span> },
    { title: t("settlements.workflow.businessDate"), dataIndex: "businessDate", width: 150, minWidth: 130, render: (value: string | null) => <span className="tabular-nums">{formatDateOnly(value, { locale: i18n.language })}</span> },
  ] : [
    { title: t("settlements.workflow.lineClass"), dataIndex: "lineClass", width: 150, minWidth: 130, render: (value: string) => t(`settlements.workflow.lineClasses.${value}`, { defaultValue: value }) },
    { title: t("settlements.workflow.lineType"), dataIndex: "lineType", width: 140, minWidth: 120 },
    { title: t("settlements.workflow.description"), dataIndex: "description", width: 200, minWidth: 160, ellipsis: true },
    { title: t("loads.financial.quantity"), width: 130, minWidth: 110, align: "right", render: (_, row) => <span className="tabular-nums">{`${row.quantity ?? "—"} ${row.unit ?? ""}`}</span> },
    { title: t("settlements.workflow.rate"), width: 130, minWidth: 110, align: "right", render: (_, row) => <span className="tabular-nums">{financialAmount(row.rate, row.currency, i18n.language)}</span> },
    { title: t("loads.financial.amount"), width: 140, minWidth: 120, align: "right", render: (_, row) => <span className="tabular-nums font-semibold">{financialAmount(row.amount, row.currency, i18n.language)}</span> },
  ];
  return (
    <div className="settlement-table-wrapper">
      <Table rowKey="id" dataSource={lines} columns={columns} pagination={false} scroll={{ x: sourceOnly ? 680 : 890 }} locale={{ emptyText: <EmptyState /> }} size="middle" />
    </div>
  );
}
