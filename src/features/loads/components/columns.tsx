/** Định nghĩa columns cho Load resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Load } from "@/types/load.types";

export const loadColumns = createCrudColumns<Load>(
  "loads",
  [
    {
      dataIndex: "number",
      titleKey: "columns.loads.number",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Load) => (
        <Link
          to={routes.resources.loads.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "name",
      titleKey: "columns.loads.name",
      sorter: true,
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
      dataIndex: "status",
      titleKey: "columns.loads.status",
      status: true,
      sorter: true,
      width: 170,
      minWidth: 150,
    },
    {
      dataIndex: "customerName",
      titleKey: "columns.loads.customerName",
      minWidth: 180,
      ellipsis: true,
      render: (value: unknown, record: Load) => {
        const text = value ? String(value) : (record.customerId ? String(record.customerId) : "");
        if (!text.trim()) {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "assignedTruckNumber",
      titleKey: "columns.loads.assignedTruckNumber",
      width: 160,
      minWidth: 140,
      ellipsis: true,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Tooltip title={text}>
            <span className="tabular-nums table-cell-ellipsis">{text}</span>
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


