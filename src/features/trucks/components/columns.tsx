/** Định nghĩa columns cho Truck resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@/components/crudColumns";
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
      ellipsis: true,
      render: (value: unknown, record: Truck) => {
        const text = displayValue(value);
        if (text === "—") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={text}>
            <Link
              to={routes.resources.trucks.show.replace(":id", String(record.id))}
              className="table-number-link table-cell-ellipsis"
            >
              {text}
            </Link>
          </Tooltip>
        );
      },
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
