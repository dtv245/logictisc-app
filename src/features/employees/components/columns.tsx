/** Định nghĩa columns cho Employee resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { Employee } from "@/types/employee.types";

export const employeeColumns = createCrudColumns<Employee>(
  "employees",
  [
    {
      dataIndex: "firstName",
      titleKey: "columns.employees.firstName",
      sorter: true,
      width: 150,
      minWidth: 130,
      render: (value: unknown, record: Employee) => (
        <Link
          to={routes.resources.employees.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "lastName",
      titleKey: "columns.employees.lastName",
      sorter: true,
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
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "phoneNumber",
      titleKey: "columns.employees.phoneNumber",
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
    {
      dataIndex: "email",
      titleKey: "columns.employees.email",
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
            <span className="tabular-nums table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "status",
      titleKey: "columns.employees.status",
      status: true,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
