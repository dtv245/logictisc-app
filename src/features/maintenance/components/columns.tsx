/** Định nghĩa columns cho Maintenance resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Space, Tag, Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatDateOnly } from "@formatters/dateTime";
import { formatMoney } from "@formatters/money";
import type { MaintenanceRecord } from "@/types/truck.types";

/**
 * Kiểm tra xem ngày hẹn / ngày đến hạn có bị quá hạn so với ngày tham chiếu hay không.
 * So sánh theo mốc bắt đầu của ngày (start of day) để tránh lệch giờ UTC/local.
 */
export const isDateOverdue = (dateStr: unknown, now: Date = new Date()): boolean => {
  if (!dateStr || typeof dateStr !== "string") return false;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return targetDate.getTime() < today.getTime();
};

/** Định dạng chỉ số odometer kèm đơn vị km. */
export const formatOdometer = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) return "";
  return `${new Intl.NumberFormat("vi-VN").format(num)} km`;
};

/** Định dạng chi phí bảo dưỡng bằng formatter tiền tệ chuẩn. */
export const formatMaintenanceCost = (
  value: unknown,
  currency = "VND",
  locale = "vi-VN",
): string => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  try {
    return formatMoney(num, { currency, locale });
  } catch {
    return "";
  }
};

export const maintenanceColumns = createCrudColumns<MaintenanceRecord>(
  "maintenance",
  [
    {
      dataIndex: "serviceDate",
      titleKey: "columns.maintenance.serviceDate",
      sorter: true,
      width: 150,
      minWidth: 130,
      render: (value: unknown, record: MaintenanceRecord) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const formattedDate = formatDateOnly(value as string) || displayValue(value);
        return (
          <Link
            to={routes.resources.maintenance.show.replace(":id", String(record.id))}
            className="table-number-link"
          >
            {formattedDate}
          </Link>
        );
      },
    },
    {
      dataIndex: "maintenanceType",
      titleKey: "columns.maintenance.maintenanceType",
      options: true,
      sorter: true,
      width: 180,
      minWidth: 150,
      ellipsis: true,
    },
    {
      dataIndex: "truckId",
      titleKey: "columns.maintenance.truckId",
      width: 160,
      minWidth: 140,
      ellipsis: true,
      render: (value: unknown, record: MaintenanceRecord) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        return (
          <Link
            to={routes.resources.trucks.show.replace(":id", String(record.truckId))}
            className="table-number-link"
          >
            <Tooltip title={text}>
              <span className="table-cell-ellipsis">{text}</span>
            </Tooltip>
          </Link>
        );
      },
    },
    {
      dataIndex: "odometerReading",
      titleKey: "columns.maintenance.odometerReading",
      sorter: true,
      align: "right",
      numeric: true,
      width: 150,
      minWidth: 130,
      render: (value: unknown) => {
        const formatted = formatOdometer(value);
        if (!formatted) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{formatted}</span>;
      },
    },
    {
      dataIndex: "totalCost",
      titleKey: "columns.maintenance.totalCost",
      sorter: true,
      align: "right",
      numeric: true,
      width: 170,
      minWidth: 150,
      render: (value: unknown) => {
        const formatted = formatMaintenanceCost(value);
        if (!formatted) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums" style={{ fontWeight: 500 }}>{formatted}</span>;
      },
    },
    {
      dataIndex: "nextDueDate",
      titleKey: "columns.maintenance.nextDueDate",
      sorter: true,
      width: 190,
      minWidth: 170,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const formattedDate = formatDateOnly(value as string) || String(value);
        const overdue = isDateOverdue(value);

        if (overdue) {
          return (
            <Space size={6} align="center">
              <span className="tabular-nums" style={{ color: "#b91c1c", fontWeight: 600 }}>
                {formattedDate}
              </span>
              <Tag
                role="status"
                aria-label="Quá hạn"
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: "16px",
                  padding: "0 6px",
                  color: "#b91c1c",
                  backgroundColor: "#fef2f2",
                  borderColor: "#fecaca",
                  borderRadius: 4,
                  fontWeight: 500,
                }}
              >
                Quá hạn
              </Tag>
            </Space>
          );
        }

        return <span className="tabular-nums">{formattedDate}</span>;
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
