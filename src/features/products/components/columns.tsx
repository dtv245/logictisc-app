/**
 * Định nghĩa columns dùng lại cho bảng product.
 *
 * Trả về hook thay vì hằng số vì tiêu đề phải dịch lúc render — ngôn ngữ có thể
 * đổi sau khi module được import.
 */

import {
  DeleteButton,
  EditButton,
  NumberField,
  ShowButton,
} from "@refinedev/antd";
import { Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Product } from "@/types/product.types";

export interface ProductColumnActions {
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
}

export const useProductColumns = (
  actions: ProductColumnActions,
): ColumnsType<Product> => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { dataIndex: "name", key: "name", sorter: true, title: t("products.columns.name") },
      { dataIndex: "sku", key: "sku", sorter: true, title: t("products.columns.sku") },
      {
        dataIndex: "price",
        key: "price",
        sorter: true,
        title: t("products.columns.price"),
        render: (value: number) => (
          <NumberField
            options={{ currency: "VND", style: "currency" }}
            value={value}
          />
        ),
      },
      {
        dataIndex: "stockQuantity",
        key: "stockQuantity",
        sorter: true,
        title: t("products.columns.stockQuantity"),
      },
      {
        dataIndex: "active",
        key: "active",
        title: t("products.columns.active"),
        render: (active: boolean) => (
          <Tag color={active ? "green" : "default"}>
            {active ? t("products.status.active") : t("products.status.inactive")}
          </Tag>
        ),
      },
      {
        key: "actions",
        title: t("products.columns.actions"),
        render: (_, record) => (
          <Space>
            <ShowButton
              hideText
              onClick={(e) => {
                e.preventDefault();
                actions.onShow(record.id);
              }}
              recordItemId={record.id}
            />
            <EditButton
              hideText
              onClick={(e) => {
                e.preventDefault();
                actions.onEdit(record.id);
              }}
              recordItemId={record.id}
            />
            <DeleteButton hideText recordItemId={record.id} />
          </Space>
        ),
      },
    ],
    [actions, t],
  );
};
