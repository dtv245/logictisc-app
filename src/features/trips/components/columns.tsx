/** Định nghĩa columns cho Trip resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import type { StatusTone } from "@components/StatusTag";
import type { Trip } from "@/types/trip.types";

export const tripStatusMap: Record<string, StatusTone> = {
  planned: "neutral",
  active: "processing",
  completed: "success",
  cancelled: "error",
};

export const tripColumns = createCrudColumns<Trip>(
  "trips",
  [
    {
      dataIndex: "number",
      titleKey: "columns.trips.number",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Trip) => (
        <Link
          to={routes.resources.trips.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "name",
      titleKey: "columns.trips.name",
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
      dataIndex: "status",
      titleKey: "columns.trips.status",
      status: tripStatusMap,
      sorter: true,
      width: 170,
      minWidth: 140,
    },
    {
      dataIndex: "truckNumber",
      titleKey: "columns.trips.truckNumber",
      width: 160,
      minWidth: 130,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{String(value)}</span>;
      },
    },
    {
      dataIndex: "totalDistance",
      titleKey: "columns.trips.totalDistance",
      sorter: true,
      numeric: true,
      align: "right",
      width: 160,
      minWidth: 140,
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
            {Number(value).toLocaleString("vi-VN")} km
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
