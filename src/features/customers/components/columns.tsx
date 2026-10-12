/** Định nghĩa columns cho Customer resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import type { StatusTone } from "@components/StatusTag";
import type { Customer } from "@/types/customer.types";

/**
 * Ánh xạ trạng thái khách hàng sang tone ngữ nghĩa chuẩn Design Tokens:
 * - active: success (xanh lá, contrast 4.88:1 >= 4.5:1)
 * - inactive: neutral (default / xám, contrast 5.89:1 >= 4.5:1)
 */
export const customerStatusMap: Record<string, StatusTone> = {
  active: "success",
  inactive: "neutral",
};

export const customerColumns = createCrudColumns<Customer>(
  "customers",
  [
    {
      dataIndex: "name",
      titleKey: "columns.customers.name",
      sorter: true,
      width: 240,
      minWidth: 200,
      ellipsis: true,
      render: (value: unknown, record: Customer) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Tooltip title={text}>
            <Link
              to={routes.resources.customers.show.replace(":id", String(record.id))}
              className="table-number-link table-cell-ellipsis"
            >
              {text}
            </Link>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "email",
      titleKey: "columns.customers.email",
      sorter: true,
      width: 220,
      minWidth: 180,
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
      dataIndex: "phone",
      titleKey: "columns.customers.phone",
      width: 160,
      minWidth: 140,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{String(value)}</span>;
      },
    },
    {
      dataIndex: "status",
      titleKey: "columns.customers.status",
      status: customerStatusMap,
      sorter: true,
      width: 170,
      minWidth: 140,
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
