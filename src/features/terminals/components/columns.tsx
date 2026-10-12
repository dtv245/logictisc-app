/** Định nghĩa columns cho Terminal resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import type { Terminal } from "@/types/terminal.types";

/**
 * Định dạng địa chỉ đầy đủ từ đối tượng Address hoặc các trường phẳng dự phòng.
 */
export const formatTerminalAddress = (record: Terminal): string => {
  if (record.address && typeof record.address === "object") {
    const parts = [
      record.address.line1,
      record.address.line2,
      record.address.city,
      record.address.state,
      record.address.country,
      record.address.zipCode,
    ].filter((part): part is string => Boolean(part && String(part).trim() !== ""));

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  // Fallback nếu record chứa flat fields từ API response thô
  const flat = record as unknown as Record<string, unknown>;
  const flatParts = [
    flat.addressLine1,
    flat.addressLine2,
    flat.addressCity,
    flat.addressState,
    flat.addressCountry,
    flat.addressZipCode,
  ].filter((part): part is string => Boolean(part && String(part).trim() !== ""));

  if (flatParts.length > 0) {
    return flatParts.join(", ");
  }

  return "";
};

export const terminalColumns = createCrudColumns<Terminal>(
  "terminals",
  [
    {
      dataIndex: "code",
      titleKey: "columns.terminals.code",
      sorter: true,
      width: 140,
      minWidth: 120,
      render: (value: unknown, record: Terminal) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Link
            to={routes.resources.terminals.show.replace(":id", String(record.id))}
            className="table-number-link table-mono-cell"
          >
            {String(value)}
          </Link>
        );
      },
    },
    {
      dataIndex: "name",
      titleKey: "columns.terminals.name",
      sorter: true,
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
      dataIndex: "type",
      titleKey: "columns.terminals.type",
      options: true,
      sorter: true,
      width: 170,
      minWidth: 150,
    },
    {
      dataIndex: "countryCode",
      titleKey: "columns.terminals.countryCode",
      sorter: true,
      width: 110,
      minWidth: 90,
      render: (value: unknown) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="table-mono-cell tabular-nums">{String(value).toUpperCase()}</span>;
      },
    },
    {
      dataIndex: "address",
      titleKey: "columns.terminals.address",
      minWidth: 240,
      ellipsis: true,
      render: (_value: unknown, record: Terminal) => {
        const fullAddress = formatTerminalAddress(record);
        if (!fullAddress) {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={fullAddress}>
            <span className="table-cell-ellipsis">{fullAddress}</span>
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
