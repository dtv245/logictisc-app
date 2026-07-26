import {
  CreateButton,
  DeleteButton,
  EditButton,
  List,
  NumberField,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Button, Form, Input, Space, Table, Tag } from "antd";

import type { ApiError } from "../../types/api";
import type { Product, ProductSearchValues } from "./types";

export const ProductList = () => {
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

      <Table<Product> {...tableProps} rowKey="id">
        <Table.Column<Product>
          dataIndex="name"
          title="Tên sản phẩm"
          sorter
        />
        <Table.Column<Product> dataIndex="sku" title="SKU" sorter />
        <Table.Column<Product>
          dataIndex="price"
          title="Giá"
          sorter
          render={(value: number) => (
            <NumberField
              value={value}
              options={{ currency: "VND", style: "currency" }}
            />
          )}
        />
        <Table.Column<Product>
          dataIndex="stockQuantity"
          title="Tồn kho"
          sorter
        />
        <Table.Column<Product>
          dataIndex="active"
          title="Trạng thái"
          render={(active: boolean) => (
            <Tag color={active ? "green" : "default"}>
              {active ? "Hoạt động" : "Ngừng hoạt động"}
            </Tag>
          )}
        />
        <Table.Column<Product>
          title="Thao tác"
          render={(_, record) => (
            <Space>
              <ShowButton
                hideText
                recordItemId={record.id}
                resource="products"
              />
              <EditButton
                hideText
                recordItemId={record.id}
                resource="products"
              />
              <DeleteButton
                hideText
                recordItemId={record.id}
                resource="products"
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
