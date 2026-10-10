/** Settlement columns use server amounts and centralized status presentation. */
import { EyeOutlined } from "@ant-design/icons";
import { Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";

import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { routes } from "@/constants/routes";
import { formatMoney } from "@/formatters/money";
import { formatDateTime } from "@/formatters/dateTime";
import type {
  DriverSettlementView,
  SettlementStatus,
  SettlementType,
} from "@/types/settlement.dto";

export const formatCurrencyAmount = (
  amount: number | string | null | undefined,
  currency?: string | null,
  locale = "en-US"
): string => {
  if (amount === null || amount === undefined || amount === "" || !currency) return "-";
  try { return formatMoney(amount, { currency, locale }); } catch { return "-"; }
};

export const getSettlementStatusColor = (
  status: SettlementStatus | string
): string => {
  switch (status) {
    case "CALCULATED":
      return "blue";
    case "VALIDATION_REQUIRED":
      return "gold";
    case "IN_REVIEW":
      return "cyan";
    case "APPROVED":
      return "green";
    case "LOCKED":
      return "purple";
    case "PAYMENT_SCHEDULED":
      return "geekblue";
    case "PAID":
      return "success";
    case "REVERSED":
      return "red";
    case "CANCELLED":
    default:
      return "default";
  }
};

export const getSettlementTypeColor = (
  type: SettlementType | string
): string => {
  switch (type) {
    case "ORIGINAL":
      return "blue";
    case "ADJUSTMENT":
      return "orange";
    case "REVERSAL":
      return "red";
    default:
      return "default";
  }
};

export interface SettlementColumnsOptions {
  t: TFunction;
  locale?: string;
  onView?: (record: DriverSettlementView) => void;
}

export const createSettlementColumns = ({
  t, locale = "en-US",
}: SettlementColumnsOptions): ColumnsType<DriverSettlementView> => [
  {
    title: t("settlements.settlementNumber", "Settlement #"),
    dataIndex: "settlementNumber",
    key: "settlementNumber",
    render: (settlementNumber: string, record: DriverSettlementView) => (
      <Link to={routes.resources.settlements.show.replace(":id", encodeURIComponent(record.id))}>
        <strong>{settlementNumber}</strong>
      </Link>
    ),
  },
  {
    title: t("settlements.driver", "Driver"),
    dataIndex: "driverName",
    key: "driverName",
    render: (driverName: string | null | undefined, record: DriverSettlementView) =>
      driverName || record.driverId,
  },
  {
    title: t("settlements.payPeriod", "Pay Period"),
    dataIndex: "payPeriodCode",
    key: "payPeriodCode",
    render: (code: string | null | undefined, record: DriverSettlementView) =>
      code || record.payPeriodId,
  },
  {
    title: t("settlements.type", "Type"),
    dataIndex: "settlementType",
    key: "settlementType",
    render: (type: SettlementType) => (
      <Tag color={getSettlementTypeColor(type)}>
        {t(`settlements.types.${type.toLowerCase()}`, type)}
      </Tag>
    ),
  },
  {
    title: t("settlements.status", "Status"),
    dataIndex: "status",
    key: "status",
    render: (status: SettlementStatus) => (
      <StatusTag tone={statusTone(status)} label={t(`settlements.statuses.${status.toLowerCase()}`, status)} />
    ),
  },
  {
    title: t("settlements.gross", "Gross"),
    dataIndex: "grossEarnings",
    key: "grossEarnings",
    align: "right",
    render: (gross: number | string, record: DriverSettlementView) =>
      formatCurrencyAmount(gross, record.currency, locale),
  },
  {
    title: t("settlements.deductions", "Deductions"),
    dataIndex: "deductionAmount",
    key: "deductionAmount",
    align: "right",
    render: (deductions: number | string, record: DriverSettlementView) =>
      formatCurrencyAmount(deductions, record.currency, locale),
  },
  {
    title: t("settlements.reimbursements", "Reimbursements"),
    dataIndex: "reimbursementAmount",
    key: "reimbursementAmount",
    align: "right",
    render: (reimbursements: number | string, record: DriverSettlementView) =>
      formatCurrencyAmount(reimbursements, record.currency, locale),
  },
  {
    title: t("settlements.net", "Net"),
    dataIndex: "settlementNet",
    key: "settlementNet",
    align: "right",
    render: (net: number | string, record: DriverSettlementView) => (
      <strong>
        {formatCurrencyAmount(net, record.currency, locale)}
      </strong>
    ),
  },
  {
    title: t("settlements.currency", "Currency"),
    dataIndex: "currency",
    key: "currency",
    render: (currency: string) => <Tag>{currency}</Tag>,
  },
  {
    title: t("settlements.calculatedAt", "Calculated At"),
    dataIndex: "calculatedAt",
    key: "calculatedAt",
    render: (date: string | null) => (date ? formatDateTime(date) : "-"),
  },
  {
    title: t("common.actions", "Actions"),
    key: "actions",
    render: (_, record: DriverSettlementView) => (
      <Space size="small">
        <Link to={routes.resources.settlements.show.replace(":id", encodeURIComponent(record.id))}>
          <Button icon={<EyeOutlined />} size="small">
            {t("common.view", "View")}
          </Button>
        </Link>
      </Space>
    ),
  },
];
