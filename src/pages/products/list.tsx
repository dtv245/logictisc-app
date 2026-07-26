/**
 * Hiển thị danh sách product bằng Refine useTable.
 */

import { CreateButton, List, useTable } from "@refinedev/antd";
import { Button, Form, Input, Table } from "antd";

import type { ApiError } from "../../types/api";
import { productColumns } from "./columns";
import type { Product, ProductSearchValues } from "./types";

export const ProductList = () => {
  // useTable đồng bộ search, pagination và sorting với URL/DataProvider.
  const { searchFormProps, tableProps } = useTable<
    Product,
    ApiError,
    ProductSearchValues
  >({
    resource: "products",
    pagination: { mode: "server" },
    syncWithLocation: true,
    onSearch: ({ name }) =>
      name
        ? [{ field: "name", operator: "contains", value: name }]
        : [],
  });

  return (
    <List headerButtons={<CreateButton resource="products" />}>
      <Form<ProductSearchValues>
        {...searchFormProps}
        layout="inline"
        className="resource-search"
      >
        <Form.Item name="name">
          <Input allowClear placeholder="Tìm theo tên sản phẩm" />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary">
            Tìm kiếm
          </Button>
        </Form.Item>
      </Form>

      <Table<Product>
        {...tableProps}
        columns={productColumns}
        rowKey="id"
      />
    </List>
  );
};
