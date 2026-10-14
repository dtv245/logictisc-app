/** Định nghĩa columns cho HOS/ELD resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import type { StatusTone } from "@components/StatusTag";
import { displayValue } from "@formatters/display";
import { formatDateOnly } from "@formatters/dateTime";
import type { HosLog } from "../types";

/**
 * Bảng màu trạng thái HOS/ELD chuẩn hóa theo nghiệp vụ:
 * - on_duty / on_duty_not_driving: success (xanh lá)
 * - driving: processing (xanh dương)
 * - sleeper_berth: warning (cam)
 * - off_duty: neutral (xám)
 */
export const HOS_DUTY_STATUS_MAP: Record<string, StatusTone> = {
  on_duty: "success",
  on_duty_not_driving: "success",
  driving: "processing",
  sleeper_berth: "warning",
  off_duty: "neutral",
};

/**
 * Định dạng thời lượng tích lũy (phút) thành chuỗi giờ và phút dễ nhìn.
 * Ví dụ: 150 phút -> "2h 30m" (kèm tooltip "150 phút").
 */
export const formatDurationMinutes = (
  value: unknown,
): { formatted: string; tooltip: string } => {
  if (value === null || value === undefined || value === "") {
    return { formatted: "—", tooltip: "—" };
  }
  const totalMinutes = Number(value);
  if (Number.isNaN(totalMinutes) || totalMinutes < 0) {
    return { formatted: "—", tooltip: "—" };
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const formatted =
    hours > 0 && mins > 0
      ? `${hours}h ${mins}m`
      : hours > 0
        ? `${hours}h`
        : `${mins}m`;

  const tooltip = `${totalMinutes} phút`;
  return { formatted, tooltip };
};

export const hosEldColumns = createCrudColumns<HosLog>(
  "hos-eld",
  [
    {
      dataIndex: "logDate",
      titleKey: "columns.hos-eld.logDate",
      sorter: true,
      width: 160,
      minWidth: 140,
      render: (value: unknown, record: HosLog) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const formattedDate = formatDateOnly(value as string) || displayValue(value);
        const targetUrl = routes.resources.hosEld.show.replace(":id", String(record.id));
        return (
          <Link to={targetUrl} className="table-number-link">
            {formattedDate}
          </Link>
        );
      },
    },
    {
      dataIndex: "employeeId",
      titleKey: "columns.hos-eld.employeeId",
      width: 180,
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
      dataIndex: "dutyStatus",
      titleKey: "columns.hos-eld.dutyStatus",
      status: HOS_DUTY_STATUS_MAP,
      sorter: true,
      width: 190,
      minWidth: 160,
    },
    {
      dataIndex: "durationMinutes",
      titleKey: "columns.hos-eld.durationMinutes",
      sorter: true,
      align: "right",
      numeric: true,
      width: 170,
      minWidth: 150,
      render: (value: unknown) => {
        const { formatted, tooltip } = formatDurationMinutes(value);
        if (formatted === "—") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={tooltip}>
            <span className="tabular-nums" style={{ fontWeight: 500 }}>
              {formatted}
            </span>
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
