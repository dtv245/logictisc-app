import { Tooltip } from "antd";
import { Link } from "react-router-dom";

import { createCrudColumns } from "@/components/crudColumns";
import { displayValue } from "@/formatters/display";
import { routes } from "@/constants/routes";
import type { Employee } from "@/types/employee.types";

export const driverColumns = createCrudColumns<Employee>("drivers", [
  {
    dataIndex: "firstName",
    titleKey: "columns.drivers.firstName",
    sorter: true,
    width: 150,
    minWidth: 130,
    render: (value: unknown, record: Employee) => (
      <Link
        to={routes.resources.drivers.show.replace(":id", String(record.id))}
        className="table-number-link"
      >
        {displayValue(value)}
      </Link>
    ),
  },
  {
    dataIndex: "lastName",
    titleKey: "columns.drivers.lastName",
    sorter: true,
    width: 150,
    minWidth: 130,
    ellipsis: true,
    render: (value: unknown) => {
      if (!value || String(value).trim() === "") {
        return <span className="table-cell-empty">—</span>;
      }
      const text = String(value);
      return <Tooltip title={text}><span className="table-cell-ellipsis">{text}</span></Tooltip>;
    },
  },
  {
    dataIndex: "phoneNumber",
    titleKey: "columns.drivers.phoneNumber",
    width: 160,
    minWidth: 140,
    ellipsis: true,
    render: (value: unknown) => {
      if (!value || String(value).trim() === "") {
        return <span className="table-cell-empty">—</span>;
      }
      const text = String(value);
      return <Tooltip title={text}><span className="tabular-nums table-cell-ellipsis">{text}</span></Tooltip>;
    },
  },
  {
    dataIndex: "email",
    titleKey: "columns.drivers.email",
    sorter: true,
    width: 220,
    minWidth: 180,
    ellipsis: true,
    render: (value: unknown) => {
      if (!value || String(value).trim() === "") {
        return <span className="table-cell-empty">—</span>;
      }
      const text = String(value);
      return <Tooltip title={text}><span className="tabular-nums table-cell-ellipsis">{text}</span></Tooltip>;
    },
  },
  {
    dataIndex: "status",
    titleKey: "columns.drivers.status",
    status: true,
    sorter: true,
    width: 160,
    minWidth: 140,
  },
], { actionsWidth: 130, fixedActions: "right" });
