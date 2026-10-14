/** Settlement columns use server amounts and centralized status presentation. */
import { EyeOutlined } from "@ant-design/icons";
import { Button, Space, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";

import { StatusTag, type StatusTone } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { routes } from "@/constants/routes";
import { displayValue } from "@/formatters/display";
import { formatDateTime } from "@/formatters/dateTime";
import { formatMoney } from "@/formatters/money";
import type {
  DriverSettlementView,
  SettlementStatus,
  SettlementType,
} from "@/types/settlement.dto";

export const formatCurrencyAmount = (
  amount: number | string | null | undefined,
  currency?: string | null,
  locale = "en-US",
): string => {
  if (amount === null || amount === undefined || amount === "" || !currency) return "-";
  try {
    return formatMoney(amount, { currency, locale });
  } catch {
    return "-";
  }
};

export const getSettlementStatusColor = (
  status: SettlementStatus | string,
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
  type: SettlementType | string,
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

/** Ánh xạ màu ngữ nghĩa chuẩn theo StatusTag cho Settlement Type */
export const SETTLEMENT_TYPE_TONE_MAP: Record<SettlementType | string, StatusTone> = {
  ORIGINAL: "processing",
  ADJUSTMENT: "warning",
  REVERSAL: "error",
};

export interface SettlementColumnsOptions {
  t: TFunction;
  locale?: string;
  onView?: (record: DriverSettlementView) => void;
}

export const createSettlementColumns = ({
  t,
  locale = "en-US",
  onView,
}: SettlementColumnsOptions): ColumnsType<DriverSettlementView> => [
  {
    title: t("settlements.settlementNumber", "Settlement #"),
    dataIndex: "settlementNumber",
    key: "settlementNumber",
    sorter: (a, b) => a.settlementNumber.localeCompare(b.settlementNumber),
    width: 170,
    minWidth: 150,
    render: (settlementNumber: string, record: DriverSettlementView) => (
      <Link
        to={routes.resources.settlements.show.replace(":id", encodeURIComponent(record.id))}
        className="table-number-link"
      >
        {displayValue(settlementNumber)}
      </Link>
    ),
  },
  {
    title: t("settlements.driver", "Driver"),
    dataIndex: "driverName",
    key: "driverName",
    width: 180,
    minWidth: 160,
    ellipsis: true,
    render: (driverName: string | null | undefined, record: DriverSettlementView) => {
      const text = driverName || record.driverId;
      if (!text || String(text).trim() === "") {
        return <span className="table-cell-empty">—</span>;
      }
      return (
        <Tooltip title={String(text)}>
          <span className="table-cell-ellipsis">{String(text)}</span>
        </Tooltip>
      );
    },
  },
  {
    title: t("settlements.payPeriod", "Pay Period"),
    dataIndex: "payPeriodCode",
    key: "payPeriodCode",
    width: 160,
    minWidth: 140,
    render: (code: string | null | undefined, record: DriverSettlementView) => {
      const text = code || record.payPeriodId;
      if (!text || String(text).trim() === "") {
        return <span className="table-cell-empty">—</span>;
      }
      return <span className="tabular-nums">{String(text)}</span>;
    },
  },
  {
    title: t("settlements.type", "Type"),
    dataIndex: "settlementType",
    key: "settlementType",
    width: 150,
    minWidth: 130,
    render: (type: SettlementType) => (
      <StatusTag
        tone={SETTLEMENT_TYPE_TONE_MAP[type] ?? "neutral"}
        statusKey={String(type).toLowerCase()}
        label={t(`settlements.types.${type.toLowerCase()}`, type)}
      />
    ),
  },
  {
    title: t("settlements.status", "Status"),
    dataIndex: "status",
    key: "status",
    width: 170,
    minWidth: 150,
    render: (status: SettlementStatus) => (
      <StatusTag
        tone={statusTone(status)}
        statusKey={String(status).toLowerCase()}
        label={t(`settlements.statuses.${status.toLowerCase()}`, status)}
      />
    ),
  },
  {
    title: t("settlements.gross", "Gross"),
    dataIndex: "grossEarnings",
    key: "grossEarnings",
    align: "right",
    className: "tabular-nums",
    width: 150,
    minWidth: 130,
    sorter: (a, b) => Number(a.grossEarnings) - Number(b.grossEarnings),
    render: (gross: number | string, record: DriverSettlementView) => {
      if (gross === null || gross === undefined || gross === "") {
        return <span className="table-cell-empty">—</span>;
      }
      return (
        <span className="tabular-nums">
          {formatCurrencyAmount(gross, record.currency, locale)}
        </span>
      );
    },
  },
  {
    title: t("settlements.deductions", "Deductions"),
    dataIndex: "deductionAmount",
    key: "deductionAmount",
    align: "right",
    className: "tabular-nums",
    width: 150,
    minWidth: 130,
    sorter: (a, b) => Number(a.deductionAmount) - Number(b.deductionAmount),
    render: (deductions: number | string, record: DriverSettlementView) => {
      if (deductions === null || deductions === undefined || deductions === "") {
        return <span className="table-cell-empty">—</span>;
      }
      const num = Number(deductions);
      if (Number.isNaN(num)) {
        return <span className="table-cell-empty">—</span>;
      }
      // Khấu trừ là số trừ: nếu > 0 hiển thị dấu âm (-), nếu 0 thì 0
      const signedAmount = num > 0 ? -num : num;
      return (
        <span className="tabular-nums">
          {formatCurrencyAmount(signedAmount, record.currency, locale)}
        </span>
      );
    },
  },
  {
    title: t("settlements.reimbursements", "Reimbursements"),
    dataIndex: "reimbursementAmount",
    key: "reimbursementAmount",
    align: "right",
    className: "tabular-nums",
    width: 160,
    minWidth: 140,
    sorter: (a, b) => Number(a.reimbursementAmount) - Number(b.reimbursementAmount),
    render: (reimbursements: number | string, record: DriverSettlementView) => {
      if (reimbursements === null || reimbursements === undefined || reimbursements === "") {
        return <span className="table-cell-empty">—</span>;
      }
      return (
        <span className="tabular-nums">
          {formatCurrencyAmount(reimbursements, record.currency, locale)}
        </span>
      );
    },
  },
  {
    title: t("settlements.net", "Net"),
    dataIndex: "settlementNet",
    key: "settlementNet",
    align: "right",
    className: "tabular-nums",
    width: 160,
    minWidth: 140,
    sorter: (a, b) => Number(a.settlementNet) - Number(b.settlementNet),
    render: (net: number | string, record: DriverSettlementView) => {
      if (net === null || net === undefined || net === "") {
        return <span className="table-cell-empty">—</span>;
      }
      return (
        <strong className="tabular-nums" style={{ fontWeight: 600 }}>
          {formatCurrencyAmount(net, record.currency, locale)}
        </strong>
      );
    },
  },
  {
    title: t("settlements.currency", "Currency"),
    dataIndex: "currency",
    key: "currency",
    width: 100,
    minWidth: 90,
    align: "center",
    render: (currency: string) =>
      currency ? <Tag className="tabular-nums">{currency}</Tag> : <span className="table-cell-empty">—</span>,
  },
  {
    title: t("settlements.calculatedAt", "Calculated At"),
    dataIndex: "calculatedAt",
    key: "calculatedAt",
    width: 180,
    minWidth: 160,
    sorter: (a, b) => {
      const timeA = a.calculatedAt ? new Date(a.calculatedAt).getTime() : 0;
      const timeB = b.calculatedAt ? new Date(b.calculatedAt).getTime() : 0;
      return timeA - timeB;
    },
    render: (date: string | null) => {
      if (!date) {
        return <span className="table-cell-empty">—</span>;
      }
      return <span className="tabular-nums">{formatDateTime(date)}</span>;
    },
  },
  {
    title: t("common.actions", "Actions"),
    key: "actions",
    width: 120,
    minWidth: 100,
    align: "center",
    fixed: "right",
    render: (_, record: DriverSettlementView) => {
      const viewLabel = t("common.view", "View");
      const targetUrl = routes.resources.settlements.show.replace(":id", encodeURIComponent(record.id));
      return (
        <Space size="small">
          <Tooltip title={viewLabel}>
            <Link to={targetUrl}>
              <Button
                icon={<EyeOutlined />}
                size="small"
                aria-label={`${viewLabel} ${record.settlementNumber}`}
                className="table-action-btn table-action-btn--show"
                style={{ minWidth: 32, minHeight: 32 }}
                onClick={() => onView?.(record)}
              >
                {viewLabel}
              </Button>
            </Link>
          </Tooltip>
        </Space>
      );
    },
  },
];
