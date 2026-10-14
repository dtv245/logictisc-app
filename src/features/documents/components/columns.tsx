/** Định nghĩa columns cho Document resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { formatDateTime } from "@formatters/dateTime";
import type { StatusTone } from "@components/StatusTag";
import type { Document } from "@/types/document.types";
import { formatFileSize } from "./documentUtils";

/**
 * Tách tên file và phần mở rộng để phục vụ hiển thị ellipsis thông minh:
 * giữ phần mở rộng (.pdf, .png...) luôn nhìn thấy được qua CSS flexbox.
 */
export const splitFileName = (fileName: string): { name: string; ext: string } => {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot <= 0) return { name: fileName, ext: "" };
  return {
    name: fileName.slice(0, lastDot),
    ext: fileName.slice(lastDot),
  };
};

/**
 * Ánh xạ trạng thái tài liệu sang tone ngữ nghĩa chuẩn:
 * - active: success (xanh lá, contrast 4.88:1 >= 4.5:1)
 * - archived: neutral (xám, contrast 5.89:1 >= 4.5:1)
 * - deleted: error (đỏ, contrast 5.86:1 >= 4.5:1)
 */
export const documentStatusMap: Record<string, StatusTone> = {
  active: "success",
  archived: "neutral",
  deleted: "error",
};

export const documentColumns = createCrudColumns<Document>(
  "documents",
  [
    {
      dataIndex: "fileName",
      titleKey: "columns.documents.fileName",
      sorter: true,
      width: 260,
      minWidth: 220,
      ellipsis: true,
      render: (value: unknown, record: Document) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        const text = String(value);
        const { name, ext } = splitFileName(text);
        return (
          <Tooltip title={text}>
            <Link
              to={routes.resources.documents.show.replace(":id", String(record.id))}
              className="table-number-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                maxWidth: "100%",
                verticalAlign: "middle",
              }}
            >
              <span
                className="table-cell-ellipsis"
                style={{ flexShrink: 1, minWidth: 0 }}
              >
                {name}
              </span>
              {ext ? (
                <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{ext}</span>
              ) : null}
            </Link>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "type",
      titleKey: "columns.documents.type",
      options: true,
      sorter: true,
      width: 170,
      minWidth: 140,
    },
    {
      dataIndex: "status",
      titleKey: "columns.documents.status",
      status: documentStatusMap,
      sorter: true,
      width: 160,
      minWidth: 130,
    },
    {
      dataIndex: "fileSizeBytes",
      titleKey: "columns.documents.fileSizeBytes",
      numeric: true,
      align: "right",
      sorter: true,
      width: 140,
      minWidth: 120,
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
            {formatFileSize(Number(value))}
          </span>
        );
      },
    },
    {
      dataIndex: "createdAt",
      titleKey: "columns.documents.createdAt",
      numeric: true,
      align: "right",
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
      dataIndex: "contentType",
      titleKey: "columns.documents.contentType",
      width: 160,
      minWidth: 130,
      ellipsis: true,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="table-mono-cell">{String(value)}</span>;
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
