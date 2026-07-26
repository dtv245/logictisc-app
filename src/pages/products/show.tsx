/**
 * Hiển thị chi tiết product bằng Refine useShow.
 */

import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Descriptions, Tag } from "antd";

import type { ApiError } from "../../types/api";
import type { Product } from "./types";

export const ProductShow = () => {
  // useShow quản lý query lifecycle và record ID lấy từ route hiện tại.
  const { queryResult } = useShow<Product, ApiError>({
    resource: "products",
  });
  const record = queryResult.data?.data;

  return (
    <Show isLoading={queryResult.isLoading}>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Tên sản phẩm">
          <TextField value={record?.name} />
        </Descriptions.Item>
        <Descriptions.Item label="SKU">
          <TextField value={record?.sku} />
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          <TextField value={record?.description ?? "—"} />
        </Descriptions.Item>
        <Descriptions.Item label="Giá">
          {record?.price.toLocaleString("vi-VN", {
            currency: "VND",
            style: "currency",
          })}
        </Descriptions.Item>
        <Descriptions.Item label="Tồn kho">
          <TextField value={record?.stockQuantity} />
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={record?.active ? "green" : "default"}>
            {record?.active ? "Hoạt động" : "Ngừng hoạt động"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
