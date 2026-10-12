/** Định nghĩa columns cho Load Board resource với chuẩn UX/a11y và Design Tokens. */
import { Link } from "react-router-dom";
import { Tooltip } from "antd";
import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { displayValue } from "@formatters/display";
import { formatMoney } from "@formatters/money";
import { formatDateTime } from "@formatters/dateTime";
import type { LoadBoardListing } from "@/types/load-board.types";
import type { Address, Money } from "@/types/common.types";
import type { StatusTone } from "@components/StatusTag";

/** Bảng map trạng thái ngữ nghĩa cho Load Board */
const loadBoardStatusMap: Record<string, StatusTone> = {
  available: "success",
  booked: "processing",
  expired: "neutral",
  cancelled: "error",
};

/** Helper format địa chỉ an toàn từ object Address hoặc string */
const formatAddressString = (address?: Address | string | null): string => {
  if (!address) return "";
  if (typeof address === "string") return address.trim();
  const parts = [address.line1, address.city, address.state, address.country].filter(Boolean);
  return parts.join(", ");
};

/** Helper format giá cước tổng */
const formatTotalRate = (rate?: Money | null): string => {
  if (!rate || rate.amount === null || rate.amount === undefined) return "";
  try {
    return formatMoney(rate.amount, {
      currency: rate.currency || "VND",
      locale: "vi-VN",
    });
  } catch {
    return String(rate.amount);
  }
};

/** Helper format cước đề xuất trên dặm */
const formatRatePerMile = (rpm?: number | null): string => {
  if (rpm === null || rpm === undefined) return "";
  try {
    return formatMoney(rpm, {
      currency: "VND",
      locale: "vi-VN",
    });
  } catch {
    return String(rpm);
  }
};

export const loadBoardColumns = createCrudColumns<LoadBoardListing>(
  "load-board",
  [
    {
      dataIndex: "externalListingId",
      titleKey: "columns.load-board.externalListingId",
      sorter: true,
      width: 150,
      minWidth: 130,
      render: (value: unknown, record: LoadBoardListing) => (
        <Link
          to={routes.resources.loadBoard.show.replace(":id", String(record.id))}
          className="table-number-link"
        >
          {displayValue(value)}
        </Link>
      ),
    },
    {
      dataIndex: "providerType",
      titleKey: "columns.load-board.providerType",
      options: true,
      sorter: true,
      width: 140,
      minWidth: 120,
    },
    {
      dataIndex: "originAddress",
      titleKey: "columns.load-board.originAddress",
      minWidth: 180,
      ellipsis: true,
      render: (value: unknown, record: LoadBoardListing) => {
        const text = formatAddressString((value as Address) || record.originAddress);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "destinationAddress",
      titleKey: "columns.load-board.destinationAddress",
      minWidth: 180,
      ellipsis: true,
      render: (value: unknown, record: LoadBoardListing) => {
        const text = formatAddressString((value as Address) || record.destinationAddress);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Tooltip title={text}>
            <span className="table-cell-ellipsis">{text}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: "totalRate",
      titleKey: "columns.load-board.totalRate",
      width: 150,
      minWidth: 130,
      align: "right",
      numeric: true,
      sorter: true,
      render: (value: unknown, record: LoadBoardListing) => {
        const text = formatTotalRate((value as Money) || record.totalRate);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{text}</span>;
      },
    },
    {
      dataIndex: "ratePerMile",
      titleKey: "columns.load-board.ratePerMile",
      width: 140,
      minWidth: 120,
      align: "right",
      numeric: true,
      sorter: true,
      render: (value: unknown, record: LoadBoardListing) => {
        const text = formatRatePerMile((value as number) ?? record.ratePerMile);
        if (!text) {
          return <span className="table-cell-empty">—</span>;
        }
        return <span className="tabular-nums">{text}</span>;
      },
    },
    {
      dataIndex: "equipmentType",
      titleKey: "columns.load-board.equipmentType",
      options: true,
      sorter: true,
      width: 160,
      minWidth: 130,
    },
    {
      dataIndex: "status",
      titleKey: "columns.load-board.status",
      status: loadBoardStatusMap,
      sorter: true,
      width: 160,
      minWidth: 140,
    },
    {
      dataIndex: "expiresAt",
      titleKey: "columns.load-board.expiresAt",
      sorter: true,
      width: 170,
      minWidth: 150,
      render: (value: unknown) => {
        if (!value) {
          return <span className="table-cell-empty">—</span>;
        }
        const text = formatDateTime(value as string);
        return <span className="tabular-nums">{text}</span>;
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
