/**
 * Hiển thị chi tiết product bằng Refine useShow.
 */

import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";

import { toIntlLocale } from "@formatters/intlLocale";
import { formatMoney } from "@formatters/money";
import type { ApiError } from "@/types/api.types";
import type { Product } from "@/types/product.types";

export const ProductShow = () => {
  const { i18n, t } = useTranslation();
  // useShow quản lý query lifecycle và record ID lấy từ route hiện tại.
  const { queryResult } = useShow<Product, ApiError>({
    resource: "products",
  });
  const record = queryResult.data?.data;

  return (
    <Show isLoading={queryResult.isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label={t("crud.identifier")}>
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label={t("products.fields.name")}>
          <TextField value={record?.name} />
        </Descriptions.Item>
        <Descriptions.Item label={t("products.fields.sku")}>
          <TextField value={record?.sku} />
        </Descriptions.Item>
        <Descriptions.Item label={t("products.fields.description")}>
          <TextField value={record?.description ?? t("crud.emptyValue")} />
        </Descriptions.Item>
        <Descriptions.Item label={t("products.fields.price")}>
          {record?.price === undefined || record?.price === null
            ? t("crud.emptyValue")
            : formatMoney(record.price, {
                locale: toIntlLocale(i18n.language),
                currency: "VND",
              })}
        </Descriptions.Item>
        <Descriptions.Item label={t("products.fields.stockQuantity")}>
          <TextField value={record?.stockQuantity} />
        </Descriptions.Item>
        <Descriptions.Item label={t("products.columns.active")}>
          <Tag color={record?.active ? "green" : "default"}>
            {record?.active ? t("products.status.active") : t("products.status.inactive")}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
