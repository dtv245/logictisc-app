/** Định nghĩa columns cho Payment resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { formatMoney } from "@formatters/money";
import { formatDateTime } from "@formatters/dateTime";
import type { StatusTone } from "@components/StatusTag";
import type { Payment } from "../types";

/** Bảng ánh xạ trạng thái thanh toán sang tone ngữ nghĩa */
export const paymentStatusMap: Record<string, StatusTone> = {
  succeeded: "success",
  pending: "warning",
  failed: "error",
};

/** Helper format tiền tệ an toàn cho Payment */
export const formatPaymentAmount = (
  value: unknown,
  record?: Payment,
): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const numericAmount = Number(value);
  if (!Number.isFinite(numericAmount)) {
    return "";
  }
  const currency = record?.amountCurrency || "VND";
  try {
    return formatMoney(numericAmount, {
      currency,
      locale: "vi-VN",
    });
  } catch {
    return `${numericAmount.toLocaleString("vi-VN")} ${currency}`;
  }
};

export const paymentColumns = createCrudColumns<Payment>(
  "payments",
  [
    {
      dataIndex: "referenceNumber",
      titleKey: "columns.payments.referenceNumber",
      sorter: true,
      width: 170,
      minWidth: 150,
      ellipsis: true,
      render: (value: unknown, record: Payment) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Tooltip title={text}>
            <Link
              to={routes.resources.payments.show.replace(":id", String(record.id))}
              className="table-number-link table-mono-cell"
            >
              <span className="table-cell-ellipsis">{text}</span>
            </Link>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "amountAmount",
      titleKey: "columns.payments.amount",
      sorter: true,
      numeric: true,
      align: "right",
      width: 160,
      minWidth: 140,
      render: (value: unknown, record: Payment) => {
        const text = formatPaymentAmount(value, record);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{text}</span>;
      },
    },
    {
      dataIndex: "status",
      titleKey: "columns.payments.status",
      status: paymentStatusMap,
      sorter: true,
      width: 150,
      minWidth: 130,
    },
    {
      dataIndex: "invoiceId",
      titleKey: "columns.payments.invoiceId",
      width: 170,
      minWidth: 150,
      ellipsis: true,
      render: (value: unknown, record: Payment) => {
        const text = record.invoiceNumber
          ? `#${String(record.invoiceNumber)}`
          : value
            ? String(value)
            : "";
        if (!text || text.trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        if (record.invoiceId) {
          return (
            <Tooltip title={text}>
              <Link
                to={routes.resources.invoices.show.replace(":id", String(record.invoiceId))}
                className="table-number-link table-mono-cell"
              >
                <span className="table-cell-ellipsis">{text}</span>
              </Link>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={text}>
            <span className="table-mono-cell table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "recordedAt",
      titleKey: "columns.payments.recordedAt",
      sorter: true,
      width: 180,
      minWidth: 160,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = formatDateTime(value as string, { locale: "vi-VN" });
        if (!text || text === "—") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{text}</span>;
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
