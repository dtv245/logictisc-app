/** Định nghĩa columns cho DVIR resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { StopOutlined } from "@ant-design/icons";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatDateTime } from "@formatters/dateTime";
import {
  defaultStatusStyles,
  type StatusStyleConfig,
  type StatusTone,
} from "@components/StatusTag";
import type { DvirReport } from "@/types/dvir.types";

/**
 * Ánh xạ trạng thái kết quả kiểm tra xe sang StatusTone / StyleConfig:
 * - safe: Tone success (xanh lá, contrast >= 4.5:1)
 * - defect_found: Tone warning (cam, contrast >= 4.5:1)
 * - out_of_service: Tone error (đỏ) kèm icon StopOutlined & nhãn chữ đáp ứng WCAG 2.1 AA
 */
export const dvirResultMap: Record<string, StatusTone | StatusStyleConfig> = {
  safe: "success",
  defect_found: "warning",
  out_of_service: {
    ...defaultStatusStyles.error,
    icon: <StopOutlined style={{ fontSize: 12 }} aria-hidden="true" />,
  },
};

/**
 * Ánh xạ trạng thái vòng đời báo cáo DVIR:
 * - draft: neutral (xám)
 * - submitted: processing (xanh dương)
 * - reviewed: processing (xanh dương)
 * - certified: success (xanh lá)
 */
export const dvirStatusMap: Record<string, StatusTone> = {
  draft: "neutral",
  submitted: "processing",
  reviewed: "processing",
  certified: "success",
};

export const dvirColumns = createCrudColumns<DvirReport>(
  "dvir",
  [
    {
      dataIndex: "id",
      titleKey: "columns.dvir.id",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: DvirReport) => (
        <Link
          to={routes.resources.dvir.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "inspectionDate",
      titleKey: "columns.dvir.inspectionDate",
      sorter: true,
      width: 170,
      minWidth: 150,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <span className="tabular-nums">
            {formatDateTime(value as string)}
          </span>
        );
      },
    },
    {
      dataIndex: "type",
      titleKey: "columns.dvir.type",
      options: true,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "result",
      titleKey: "columns.dvir.result",
      status: dvirResultMap,
      sorter: true,
      width: 180,
      minWidth: 160,
    },
    {
      dataIndex: "status",
      titleKey: "columns.dvir.status",
      status: dvirStatusMap,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "truckId",
      titleKey: "columns.dvir.truckId",
      width: 150,
      minWidth: 130,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{String(value)}</span>;
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
