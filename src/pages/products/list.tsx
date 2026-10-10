/**
 * Hiển thị danh sách product bằng Refine useTable.
 */

import { CreateButton, List, useModalForm, useTable } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Descriptions, Form, Input, Modal, Tag } from "antd";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type { Product, ProductFormValues, ProductSearchValues } from "@/types/product.types";
import { ProductForm } from "@features/products/components/form";
import { useProductColumns } from "@features/products/components/columns";
import { FilterBar } from "@components";
import { BaseTable } from "@table";
import { formatMoney } from "@formatters/money";
import { toIntlLocale } from "@formatters/intlLocale";

export const ProductList = () => {
  const { i18n, t } = useTranslation();

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
          style={{ marginBottom: 16 }}
        >
          <FilterBar>
            <Form.Item name="name" noStyle>
              <Input
                allowClear
                placeholder={t("products.searchPlaceholder")}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </FilterBar>
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
        destroyOnClose
        width={860}
        title={t("products.createTitle")}
        okText={t("products.createOk")}
        confirmLoading={createModal.formLoading}
      >
        <ProductForm
          columns={2}
          formProps={{
            ...createModal.formProps,
            initialValues: { active: true, price: 0, stockQuantity: 0 },
          }}
        />
      </Modal>

      <Modal
        {...editModal.modalProps}
        destroyOnClose
        width={860}
        title={t("products.editTitle")}
        okText={t("actions.save")}
        confirmLoading={editModal.formLoading}
      >
        <ProductForm columns={2} formProps={editModal.formProps} />
      </Modal>

      <Modal
        destroyOnClose
        footer={null}
        onCancel={() => setShowId(undefined)}
        open={!!showId}
        title={t("products.viewTitle")}
        width={860}
      >
        {showQueryResult?.isFetching ? (
          <p>{t("common.loading")}</p>
        ) : (
          <Descriptions
            bordered
            column={{ xs: 1, sm: 2, md: 2, lg: 2 }}
            size="middle"
            style={{ marginTop: 8 }}
          >
            <Descriptions.Item label={t("crud.identifier")}>
              #{showQueryResult?.data?.data?.id}
            </Descriptions.Item>
            <Descriptions.Item label={t("products.fields.name")}>
              {showQueryResult?.data?.data?.name ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("products.fields.sku")}>
              {showQueryResult?.data?.data?.sku ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("products.fields.price")}>
              {showQueryResult?.data?.data?.price === undefined ||
              showQueryResult?.data?.data?.price === null
                ? "—"
                : formatMoney(showQueryResult.data.data.price, {
                    currency: "VND",
                    locale: toIntlLocale(i18n.language),
                  })}
            </Descriptions.Item>
            <Descriptions.Item label={t("products.fields.stockQuantity")}>
              {showQueryResult?.data?.data?.stockQuantity ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label={t("products.columns.active")}>
              <Tag color={showQueryResult?.data?.data?.active ? "green" : "default"}>
                {showQueryResult?.data?.data?.active
                  ? t("products.status.active")
                  : t("products.status.inactive")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t("products.fields.description")} span={2}>
              {showQueryResult?.data?.data?.description ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};
