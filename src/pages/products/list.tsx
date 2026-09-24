/**
 * Hiển thị danh sách product bằng Refine useTable.
 */

import { CreateButton, List, useModalForm, useTable } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Form, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type { Product, ProductFormValues, ProductSearchValues } from "@/types/product.types";
import { ProductForm } from "@features/products/components/form";
import { useProductColumns } from "@features/products/components/columns";
import { BaseTable } from "@table";

export const ProductList = () => {
  const { t } = useTranslation();

  const { searchFormProps, tableProps, tableQueryResult } = useTable<
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

  const columns = useProductColumns({
    onEdit: (id) => editModal.show(id),
    onShow: (id) => setShowId(id),
  });

  return (
    <>
      <List headerButtons={<CreateButton onClick={(e) => { e.preventDefault(); createModal.show(); }} />}>
        <Form<ProductSearchValues>
          {...searchFormProps}
          layout="inline"
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="name">
            <Input placeholder={t("products.searchPlaceholder")} allowClear />
          </Form.Item>
        </Form>
        <BaseTable<Product>
          columns={columns}
          queryResult={{
            error: tableQueryResult.error,
            isFetching: tableQueryResult.isFetching,
            refetch: tableQueryResult.refetch,
          }}
          tableProps={tableProps}
        />
      </List>

      <Modal
        {...createModal.modalProps}
        title={t("products.createTitle")}
        okText={t("products.createOk")}
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
        title={t("products.editTitle")}
        okText={t("actions.save")}
        confirmLoading={editModal.formLoading}
      >
        <ProductForm formProps={editModal.formProps} />
      </Modal>

      <Modal
        open={!!showId}
        onCancel={() => setShowId(undefined)}
        title={t("products.viewTitle")}
        footer={null}
      >
        {showQueryResult?.isFetching ? (
          <p>{t("common.loading")}</p>
        ) : (
          <ProductForm
            formProps={{
              initialValues: showQueryResult?.data?.data,
              disabled: true,
            }}
          />
        )}
      </Modal>
    </>
  );
};
