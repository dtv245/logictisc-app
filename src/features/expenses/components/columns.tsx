/** Định nghĩa columns cho Expense resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatMoney } from "@formatters/money";
import { formatDateOnly } from "@formatters/dateTime";
import type { StatusTone } from "@components/StatusTag";
import type { Expense } from "@/types/expense.types";
import type { Money } from "@/types/common.types";

/** Bảng ánh xạ trạng thái chi phí sang tone ngữ nghĩa */
export const expenseStatusMap: Record<string, StatusTone> = {
  draft: "neutral",
  submitted: "processing",
  approved: "success",
  rejected: "error",
  paid: "success",
};

/** Helper format tiền tệ an toàn từ object Money, number hoặc string */
export const formatExpenseAmount = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  let numericAmount: number | string | undefined;
  let currency = "VND";

  if (typeof value === "object" && value !== null) {
    const money = value as Partial<Money>;
    numericAmount = money.amount;
    if (money.currency) {
      currency = money.currency;
    }
  } else if (typeof value === "number" || typeof value === "string") {
    numericAmount = value;
  }

  if (
    numericAmount === null ||
    numericAmount === undefined ||
    numericAmount === "" ||
    !Number.isFinite(Number(numericAmount))
  ) {
    return "";
  }

  try {
    return formatMoney(numericAmount, {
      currency,
      locale: "vi-VN",
    });
  } catch {
    return `${Number(numericAmount).toLocaleString("vi-VN")} ${currency}`;
  }
};

export const expenseColumns = createCrudColumns<Expense>(
  "expenses",
  [
    {
      dataIndex: "number",
      titleKey: "columns.expenses.number",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Expense) => {
        if (value === null || value === undefined || value === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Link
            to={routes.resources.expenses.show.replace(":id", String(record.id))}
            className="table-number-link tabular-nums"
          >
            {displayValue(value)}
          </Link>
        );
      },
    },
    {
      dataIndex: "type",
      titleKey: "columns.expenses.type",
      options: true,
      sorter: true,
      width: 150,
      minWidth: 130,
    },
    {
      dataIndex: "status",
      titleKey: "columns.expenses.status",
      status: expenseStatusMap,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "vendorName",
      titleKey: "columns.expenses.vendorName",
      sorter: true,
      width: 200,
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
      dataIndex: "amount",
      titleKey: "columns.expenses.amount",
      sorter: true,
      numeric: true,
      align: "right",
      width: 160,
      minWidth: 140,
      render: (value: unknown) => {
        const text = formatExpenseAmount(value);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{text}</span>;
      },
    },
    {
      dataIndex: "expenseDate",
      titleKey: "columns.expenses.expenseDate",
      sorter: true,
      width: 150,
      minWidth: 130,
      render: (value: unknown) => {
        if (!value) {
          return <span className="table-cell-empty">—</span>;
        }
        const text = formatDateOnly(value as string, { locale: "vi-VN" });
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
