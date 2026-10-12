/** Định nghĩa columns cho Truck resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Truck } from "@/types/truck.types";

export const truckColumns = createCrudColumns<Truck>(
  "trucks",
  [
    {
      dataIndex: "number",
      titleKey: "columns.trucks.number",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Truck) => (
        <Link
          to={routes.resources.trucks.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "type",
      titleKey: "columns.trucks.type",
      options: true,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "status",
      titleKey: "columns.trucks.status",
      status: true,
      sorter: true,
      width: 170,
      minWidth: 150,
    },
    {
      dataIndex: "licensePlate",
      titleKey: "columns.trucks.licensePlate",
      width: 150,
      minWidth: 130,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{String(value)}</span>;
      },
    },
    {
      dataIndex: "mainDriverName",
      titleKey: "columns.trucks.mainDriverName",
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
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
