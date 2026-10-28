/** Định nghĩa columns cho Terminal resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import type { Terminal } from "@/types/terminal.types";
import { formatTerminalAddress } from "@/utils/terminals/formatTerminalAddress";
export { formatTerminalAddress } from "@/utils/terminals/formatTerminalAddress";

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
