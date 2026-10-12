/** Định nghĩa columns cho Container resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import type { StatusTone } from "@components/StatusTag";
import type { Container } from "@/types/container.types";

export const containerStatusMap: Record<string, StatusTone> = {
  empty: "neutral",
  loaded: "success",
  in_transit: "processing",
  maintenance: "warning",
};

export const containerColumns = createCrudColumns<Container>(
  "containers",
  [
    {
      dataIndex: "number",
      titleKey: "columns.containers.number",
      sorter: true,
      width: 170,
      minWidth: 150,
      render: (value: unknown, record: Container) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Link
            to={routes.resources.containers.show.replace(":id", String(record.id))}
            className="table-number-link table-mono-cell tabular-nums"
          >
            {String(value)}
          </Link>
        );
      },
    },
    {
      dataIndex: "isoType",
      titleKey: "columns.containers.isoType",
      options: true,
      sorter: true,
      width: 140,
      minWidth: 120,
    },
    {
      dataIndex: "status",
      titleKey: "columns.containers.status",
      status: containerStatusMap,
      sorter: true,
      width: 170,
      minWidth: 150,
    },
    {
      dataIndex: "grossWeight",
      titleKey: "columns.containers.grossWeight",
      sorter: true,
      numeric: true,
      align: "right",
      width: 160,
      minWidth: 130,
      render: (value: unknown) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          !Number.isFinite(Number(value))
        ) {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <span className="tabular-nums">
            {Number(value).toLocaleString("vi-VN")} kg
          </span>
        );
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
