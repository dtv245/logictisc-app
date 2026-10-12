/* eslint-disable react-refresh/only-export-components */
/** Định nghĩa columns cho Invoice resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tag, Tooltip } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatMoney } from "@formatters/money";
import { formatDateOnly, getBrowserTimeZone } from "@formatters/dateTime";
import type { Invoice } from "@/types/invoice.types";

/**
 * Kiểm tra xem hóa đơn đã được thanh toán đầy đủ hay chưa.
 * Hóa đơn đã thanh toán đầy đủ (hoặc đã hủy/vô hiệu) thì không coi là quá hạn.
 */
export function isInvoiceFullyPaid(record: Invoice): boolean {
  const status = (record.status || "").trim().toLowerCase();
  if (status === "paid" || status === "cancelled" || status === "voided") {
    return true;
  }
  const balance = record.balance ?? record.openBalance;
  if (balance !== undefined && balance !== null && Number(balance) <= 0) {
    return true;
  }
  return false;
}

/**
 * Tính số ngày quá hạn của hóa đơn theo múi giờ dự án.
 * Trả về số ngày quá hạn (> 0 nếu quá hạn, <= 0 nếu chưa tới hạn).
 */
export function calculateOverdueDays(
  dueDateStr: string | null | undefined,
  referenceDate: Date = new Date(),
  timeZone: string = getBrowserTimeZone() || "Asia/Ho_Chi_Minh",
): number {
  if (!dueDateStr) return 0;

  try {
    const dateMatch = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let dueYear: number, dueMonth: number, dueDay: number;

    if (dateMatch) {
      dueYear = Number(dateMatch[1]);
      dueMonth = Number(dateMatch[2]);
      dueDay = Number(dateMatch[3]);
    } else {
      const parsed = new Date(dueDateStr);
      if (Number.isNaN(parsed.getTime())) return 0;
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(parsed);
      dueYear = Number(parts.find((p) => p.type === "year")?.value);
      dueMonth = Number(parts.find((p) => p.type === "month")?.value);
      dueDay = Number(parts.find((p) => p.type === "day")?.value);
    }

    const refFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const refParts = refFormatter.formatToParts(referenceDate);
    const refYear = Number(refParts.find((p) => p.type === "year")?.value);
    const refMonth = Number(refParts.find((p) => p.type === "month")?.value);
    const refDay = Number(refParts.find((p) => p.type === "day")?.value);

    const dueUtc = Date.UTC(dueYear, dueMonth - 1, dueDay);
    const refUtc = Date.UTC(refYear, refMonth - 1, refDay);

    const diffMs = refUtc - dueUtc;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/** Component hiển thị cột tiền tệ, bảo toàn dữ liệu gốc không làm tròn */
const MoneyCell = ({
  amount,
  currency,
}: {
  amount?: number | null;
  currency?: string | null;
}) => {
  const { i18n } = useTranslation();
  if (amount === null || amount === undefined) {
    return <span className="table-cell-empty">—</span>;
  }

  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const curr = currency || "VND";

  let formattedText: string;
  try {
    formattedText = formatMoney(amount, { locale, currency: curr });
  } catch {
    formattedText = String(amount);
  }

  return <span className="tabular-nums">{formattedText}</span>;
};

/** Component hiển thị cột hạn thanh toán với cảnh báo quá hạn khi chưa thanh toán đủ */
const DueDateCell = ({
  value,
  record,
}: {
  value: unknown;
  record: Invoice;
}) => {
  const { t, i18n } = useTranslation();
  if (!value || String(value).trim() === "") {
    return <span className="table-cell-empty">—</span>;
  }

  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  const formattedDate = formatDateOnly(String(value), { locale });
  const isPaid = isInvoiceFullyPaid(record);
  const overdueDays = calculateOverdueDays(String(value));
  const isOverdue = !isPaid && overdueDays > 0;

  if (!isOverdue) {
    return <span className="tabular-nums">{formattedDate}</span>;
  }

  const overdueText = t("columns.invoices.overdueDays", {
    count: overdueDays,
    defaultValue: `Quá hạn ${overdueDays} ngày`,
  });

  return (
    <div className="table-cell-due-overdue">
      <span className="tabular-nums">{formattedDate}</span>
      <Tag
        color="error"
        className="table-overdue-tag"
        role="status"
        aria-label={overdueText}
      >
        <ClockCircleOutlined aria-hidden="true" style={{ fontSize: 11 }} />
        {overdueText}
      </Tag>
    </div>
  );
};

export const invoiceColumns = createCrudColumns<Invoice>(
  "invoices",
  [
    {
      dataIndex: "number",
      titleKey: "columns.invoices.number",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Invoice) => {
        if (value === null || value === undefined || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Link
            to={routes.resources.invoices.show.replace(":id", String(record.id))}
            className="table-number-link"
          >
            {displayValue(value)}
          </Link>
        );
      },
    },
    {
      dataIndex: "type",
      titleKey: "columns.invoices.type",
      options: true,
      sorter: true,
      width: 140,
      minWidth: 120,
    },
    {
      dataIndex: "status",
      titleKey: "columns.invoices.status",
      status: true,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "customerName",
      titleKey: "columns.invoices.customerName",
      minWidth: 160,
      ellipsis: true,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "totalAmount",
      titleKey: "columns.invoices.totalAmount",
      align: "right",
      width: 150,
      minWidth: 130,
      render: (value: unknown, record: Invoice) => (
        <MoneyCell
          amount={value as number | null | undefined}
          currency={record.totalCurrency}
        />
      ),
    },
    {
      dataIndex: "balance",
      titleKey: "columns.invoices.balance",
      align: "right",
      width: 150,
      minWidth: 130,
      render: (value: unknown, record: Invoice) => {
        const bal = (value as number | null | undefined) ?? record.openBalance;
        return <MoneyCell amount={bal} currency={record.totalCurrency} />;
      },
    },
    {
      dataIndex: "dueDate",
      titleKey: "columns.invoices.dueDate",
      sorter: true,
      width: 180,
      minWidth: 150,
      render: (value: unknown, record: Invoice) => (
        <DueDateCell value={value} record={record} />
      ),
    },
    {
      dataIndex: "employeeName",
      titleKey: "columns.invoices.employeeName",
      minWidth: 160,
      ellipsis: true,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
