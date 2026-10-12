/**
 * Định nghĩa columns cho Product resource với chuẩn UX/a11y và Design Tokens.
 */

import { Link } from "react-router-dom";
import {
  DeleteButton,
  EditButton,
  ShowButton,
} from "@refinedev/antd";
import { Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { routes } from "@constants/routes";
import { createCrudColumns } from "@components/crudColumns";
import { StatusTag } from "@components/StatusTag";
import { formatMoney } from "@formatters/money";
import type { Product } from "@/types/product.types";

export interface ProductColumnActions {
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
}

export const useProductColumns = (
  actions?: Partial<ProductColumnActions>,
): ColumnsType<Product> => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        dataIndex: "name",
        key: "name",
        sorter: true,
        title: t("products.columns.name"),
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
        dataIndex: "sku",
        key: "sku",
        sorter: true,
        title: t("products.columns.sku"),
        width: 160,
        minWidth: 130,
        render: (value: unknown, record: Product) => {
          if (!value || String(value).trim() === "") {
            return <span className="table-cell-empty">—</span>;
          }
          return (
            <Link
              to={routes.resources.products.show.replace(":id", String(record.id))}
              className="table-number-link table-mono-cell tabular-nums"
              onClick={(e) => {
                if (actions?.onShow) {
                  e.preventDefault();
                  actions.onShow(record.id);
                }
              }}
            >
              {String(value)}
            </Link>
          );
        },
      },
      {
        dataIndex: "price",
        key: "price",
        sorter: true,
        title: t("products.columns.price"),
        width: 150,
        minWidth: 130,
        align: "right",
        className: "tabular-nums",
        render: (value: unknown) => {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            !Number.isFinite(Number(value))
          ) {
            return <span className="table-cell-empty">—</span>;
          }
          try {
            return (
              <span className="tabular-nums">
                {formatMoney(Number(value), {
                  currency: "VND",
                  locale: "vi-VN",
                })}
              </span>
            );
          } catch {
            return (
              <span className="tabular-nums">
                {Number(value).toLocaleString("vi-VN")} ₫
              </span>
            );
          }
        },
      },
      {
        dataIndex: "stockQuantity",
        key: "stockQuantity",
        sorter: true,
        title: t("products.columns.stockQuantity"),
        width: 140,
        minWidth: 120,
        align: "right",
        className: "tabular-nums",
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
              {Number(value).toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        dataIndex: "active",
        key: "active",
        title: t("products.columns.active"),
        width: 160,
        minWidth: 140,
        render: (active: unknown) => {
          const isActive = Boolean(active);
          return (
            <StatusTag
              tone={isActive ? "success" : "neutral"}
              label={
                isActive
                  ? t("products.status.active", "Hoạt động")
                  : t("products.status.inactive", "Ngừng hoạt động")
              }
            />
          );
        },
      },
      {
        key: "actions",
        title: t("products.columns.actions"),
        width: 130,
        align: "center",
        fixed: "right",
        render: (_, record) => {
          const recordName = record.name
            ? String(record.name).trim()
            : record.sku
              ? `SKU ${record.sku}`
              : `ID ${record.id}`;
          const viewLabel = t("actions.view", "Xem");
          const editLabel = t("actions.edit", "Sửa");
          const deleteLabel = t("actions.delete", "Xóa");

          return (
            <Space size={4}>
              <Tooltip title={viewLabel}>
                <ShowButton
                  hideText
                  aria-label={recordName ? `${viewLabel} ${recordName}` : viewLabel}
                  className="refine-show-button table-action-btn table-action-btn--show"
                  onClick={(e) => {
                    if (actions?.onShow) {
                      e.preventDefault();
                      actions.onShow(record.id);
                    }
                  }}
                  recordItemId={record.id}
                  resource="products"
                />
              </Tooltip>
              <Tooltip title={editLabel}>
                <EditButton
                  hideText
                  aria-label={recordName ? `${editLabel} ${recordName}` : editLabel}
                  className="refine-edit-button table-action-btn table-action-btn--edit"
                  onClick={(e) => {
                    if (actions?.onEdit) {
                      e.preventDefault();
                      actions.onEdit(record.id);
                    }
                  }}
                  recordItemId={record.id}
                  resource="products"
                />
              </Tooltip>
              <Tooltip title={deleteLabel}>
                <DeleteButton
                  hideText
                  aria-label={recordName ? `${deleteLabel} ${recordName}` : deleteLabel}
                  className="refine-delete-button table-action-btn table-action-btn--delete"
                  recordItemId={record.id}
                  resource="products"
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [actions, t],
  );
};

export const productColumns = createCrudColumns<Product>(
  "products",
  [
    {
      dataIndex: "name",
      titleKey: "products.columns.name",
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
      dataIndex: "sku",
      titleKey: "products.columns.sku",
      sorter: true,
      width: 160,
      minWidth: 130,
      render: (value: unknown, record: Product) => {
        if (!value || String(value).trim() === "") {
          return <span className="table-cell-empty">—</span>;
        }
        return (
          <Link
            to={routes.resources.products.show.replace(":id", String(record.id))}
            className="table-number-link table-mono-cell tabular-nums"
          >
            {String(value)}
          </Link>
        );
      },
    },
    {
      dataIndex: "price",
      titleKey: "products.columns.price",
      sorter: true,
      numeric: true,
      align: "right",
      width: 150,
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
        try {
          return (
            <span className="tabular-nums">
              {formatMoney(Number(value), {
                currency: "VND",
                locale: "vi-VN",
              })}
            </span>
          );
        } catch {
          return (
            <span className="tabular-nums">
              {Number(value).toLocaleString("vi-VN")} ₫
            </span>
          );
        }
      },
    },
    {
      dataIndex: "stockQuantity",
      titleKey: "products.columns.stockQuantity",
      sorter: true,
      numeric: true,
      align: "right",
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
            {Number(value).toLocaleString("vi-VN")}
          </span>
        );
      },
    },
    {
      dataIndex: "active",
      titleKey: "products.columns.active",
      width: 160,
      minWidth: 140,
      render: (active: unknown) => {
        const isActive = Boolean(active);
        return (
          <StatusTag
            tone={isActive ? "success" : "neutral"}
            label={isActive ? "Hoạt động" : "Ngừng hoạt động"}
          />
        );
      },
    },
  ],
  {
    actionsWidth: 130,
    fixedActions: "right",
  },
);
