/** Định nghĩa columns cho Accident resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatDateTime } from "@formatters/dateTime";
import type { StatusStyleConfig, StatusTone } from "@components/StatusTag";
import type { AccidentReport } from "../types";

/**
 * Bảng ánh xạ mức độ nghiêm trọng (severity) sang semantic StatusTone / StatusStyleConfig:
 * - minor: Vàng nhạt (Amber tokens: #854d0e trên nền #fefce8, contrast 6.8:1 > 4.5:1 đạt chuẩn WCAG AA)
 * - moderate: warning (Cam #b45309 trên nền #fffbeb)
 * - severe / serious: error (Đỏ #b91c1c trên nền #fef2f2)
 * - fatal: error (Đỏ nguy hiểm)
 */
export const accidentSeverityMap: Record<string, StatusTone | StatusStyleConfig> = {
  minor: {
    color: "#854d0e",
    bg: "#fefce8",
    border: "#fef08a",
    dotColor: "#ca8a04",
  },
  moderate: "warning",
  severe: "error",
  serious: "error",
  fatal: "error",
};

/**
 * Bảng ánh xạ trạng thái xử lý tai nạn (status) sang StatusTone:
 * - draft: neutral (Nháp)
 * - submitted: processing (Đã gửi / Đã báo cáo)
 * - under_review: warning (Đang xem xét)
 * - closed: success (Đã đóng)
 */
export const accidentStatusMap: Record<string, StatusTone> = {
  draft: "neutral",
  submitted: "processing",
  under_review: "warning",
  closed: "success",
};

export const accidentColumns = createCrudColumns<AccidentReport>(
  "accidents",
  [
    {
      dataIndex: "accidentDateTime",
      titleKey: "columns.accidents.accidentDateTime",
      sorter: true,
      width: 190,
      minWidth: 170,
      render: (value: unknown, record: AccidentReport) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const formattedDate = formatDateTime(value as string) || displayValue(value);
        return (
          <Link
            to={routes.resources.accidents.show.replace(":id", String(record.id))}
            className="table-number-link"
          >
            <span className="tabular-nums">{formattedDate}</span>
          </Link>
        );
      },
    },
    {
      dataIndex: "accidentType",
      titleKey: "columns.accidents.accidentType",
      options: true,
      sorter: true,
      width: 180,
      minWidth: 150,
    },
    {
      dataIndex: "severity",
      titleKey: "columns.accidents.severity",
      status: accidentSeverityMap,
      sorter: true,
      width: 170,
      minWidth: 140,
    },
    {
      dataIndex: "status",
      titleKey: "columns.accidents.status",
      status: accidentStatusMap,
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
