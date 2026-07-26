/**
 * Định nghĩa columns dùng lại cho bảng product.
 */

import {
  DeleteButton,
  EditButton,
  NumberField,
  ShowButton,
} from "@refinedev/antd";
import { Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { Product } from "./types";

export const productColumns: ColumnsType<Product> = [
  { dataIndex: "name", key: "name", sorter: true, title: "Tên sản phẩm" },
  { dataIndex: "sku", key: "sku", sorter: true, title: "SKU" },
  {
    dataIndex: "price",
    key: "price",
    sorter: true,
    title: "Giá",
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
    title: "Tồn kho",
  },
  {
    dataIndex: "active",
    key: "active",
    title: "Trạng thái",
    render: (active: boolean) => (
      <Tag color={active ? "green" : "default"}>
        {active ? "Hoạt động" : "Ngừng hoạt động"}
      </Tag>
    ),
  },
  {
    key: "actions",
    title: "Thao tác",
    render: (_, record) => (
      <Space>
        <ShowButton hideText recordItemId={record.id} resource="products" />
        <EditButton hideText recordItemId={record.id} resource="products" />
        <DeleteButton hideText recordItemId={record.id} resource="products" />
      </Space>
    ),
  },
];
