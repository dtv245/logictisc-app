import type { FormProps } from "antd";
import type { ColumnsType } from "antd/es/table";
/**
 * Hiển thị danh sách product bằng Refine useTable.
 */

import { CreateButton, List, useTable, useModalForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Form, Input, Table, Modal } from "antd";
import { EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Space } from "antd";

import type { ApiError } from "@/types/api.types";
import { productColumns } from "@features/products/components/columns";
import type { Product, ProductSearchValues, ProductFormValues } from "@/types/product.types";
import { ProductForm } from "@features/products/components/form";

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

  const createModal = useModalForm<Product, ApiError, ProductFormValues>({
    resource: "products",
    action: "create",
  });

  const editModal = useModalForm<Product, ApiError, ProductFormValues>({
    resource: "products",
    action: "edit",
  });

  const { queryResult: showQueryResult, showId, setShowId } = useShow<Product, ApiError>({
    resource: "products",
  });

  // Inject action buttons into columns
  const finalColumns = [
    ...productColumns,
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record: Product) => (
        <Space>
          <ShowButton hideText recordItemId={record.id} onClick={(e) => { e.preventDefault(); setShowId(record.id); }} />
          <EditButton hideText recordItemId={record.id} onClick={(e) => { e.preventDefault(); editModal.show(record.id); }} />
          <DeleteButton hideText recordItemId={record.id} />
        </Space>
      )
    }
  ];

  return (
    <>
      <List headerButtons={<CreateButton onClick={(e) => { e.preventDefault(); createModal.show(); }} />}>
        <Form<ProductSearchValues>
          {...searchFormProps}
          layout="inline"
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="name">
            <Input placeholder="Tìm theo tên..." allowClear />
          </Form.Item>
        </Form>
        <Table<Product> {...tableProps} columns={finalColumns as ColumnsType<Product>} rowKey="id" />
      </List>

      <Modal
        {...createModal.modalProps}
        title="Create Product"
        okText="Create"
        confirmLoading={createModal.formLoading}
      >
        <ProductForm
          formProps={{
            ...createModal.formProps,
            initialValues: { active: true, price: 0, stockQuantity: 0 },
          }}
        />
      </Modal>

      <Modal
        {...editModal.modalProps}
        title="Edit Product"
        okText="Save"
        confirmLoading={editModal.formLoading}
      >
        <ProductForm formProps={editModal.formProps} />
      </Modal>

      <Modal
        open={!!showId}
        onCancel={() => setShowId(undefined)}
        title="View Product"
        footer={null}
      >
        {showQueryResult?.isFetching ? (
          <p>Loading...</p>
        ) : (
          <ProductForm
            formProps={{
              initialValues: showQueryResult?.data?.data,
              disabled: true
            } as FormProps<ProductFormValues>}
          />
        )}
      </Modal>
    </>
  );
};
