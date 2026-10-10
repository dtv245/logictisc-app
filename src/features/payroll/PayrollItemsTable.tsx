/** Per-driver authoritative amounts; unavailable taxes/net never become zero. */
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { financialAmount } from "@/features/profitability/financialDisplay";
import type { PayrollItem } from "@/types/payroll.dto";
import { PayrollJurisdictionSummary } from "./PayrollJurisdictionSummary";
export function PayrollItemsTable({ items }: { items: PayrollItem[] }) {
  const { t, i18n } = useTranslation();
  const moneyColumns: ColumnsType<PayrollItem> = (["grossAmount", "incomeTaxAmount", "insuranceAmount", "otherDeductionAmount", "reimbursementAmount", "netAmount"] as const).map((field) => ({
    key: field, title: t(`payroll.${field}`), render: (_, row) => <span data-testid={`${row.id}-${field}`}>{financialAmount(
      ["incomeTaxAmount", "insuranceAmount", "netAmount"].includes(field) && row.taxAvailability !== "AVAILABLE" ? null : row[field], row.currency, i18n.language)}</span>,
  }));
  return <Table rowKey="id" dataSource={items} scroll={{ x: "max-content" }} pagination={false} locale={{ emptyText: <EmptyState /> }}
    expandable={{ expandedRowRender: (item) => <PayrollJurisdictionSummary item={item} /> }} columns={[
      { title: t("settlements.driver"), dataIndex: "driverId" },
      { title: t("finance.workflowStatus"), dataIndex: "status", render: (value: string) => <StatusTag tone={statusTone(value)} label={t(`payroll.statuses.${value}`, { defaultValue: value })} /> },
      ...moneyColumns,
      { title: t("finance.currency"), dataIndex: "currency" },
    ]} />;
}
