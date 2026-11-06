/**
 * Hiển thị danh sách product bằng Refine useTable.
 */

import { CreateButton, List, useModalForm } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Descriptions, Input, Modal, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type { Product, ProductFormValues, ProductSearchValues } from "@/types/products/products.types";
import { ProductForm } from "@features/products/components/form";
import { useProductColumns } from "@features/products/components/columns";
import { FilterBar } from "@components";
import { BaseTable } from "@table";
import { formatMoney } from "@formatters/money";
import { toIntlLocale } from "@formatters/intlLocale";
import { usePaginatedTable } from "@/hooks/usePaginatedTable";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

interface ProductSearchInputProps {
  initialValue: string;
  onApply: (value: string) => void;
  placeholder: string;
}

const ProductSearchInput = ({ initialValue, onApply, placeholder }: ProductSearchInputProps) => {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebouncedSearch(value, 350);

  useEffect(() => {
    const normalizedValue = debouncedValue.trim();
    if (normalizedValue !== initialValue.trim()) onApply(normalizedValue);
  }, [debouncedValue, initialValue, onApply]);

  return (
    <Input
      allowClear
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      style={{ width: "100%" }}
      value={value}
    />
  );
};

export const ProductList = () => {
  const { i18n, t } = useTranslation();

  const { filters, setCurrent, setFilters, tableProps, tableQueryResult } = usePaginatedTable<
    Product,
    ApiError,
    ProductSearchValues
  >({
    resource: "products",
  });

  const appliedNameFilter = filters.find(
    (filter) => "field" in filter && filter.field === "name",
  );
  const appliedName =
    appliedNameFilter && "value" in appliedNameFilter && typeof appliedNameFilter.value === "string"
      ? appliedNameFilter.value
      : "";
  const applyNameSearch = useCallback((searchValue: string) => {
    setFilters(
      searchValue
        ? [{ field: "name", operator: "contains", value: searchValue }]
        : [],
      "replace",
    );
    setCurrent(1);
  }, [setCurrent, setFilters]);

  const createModal = useModalForm<Product, ApiError, ProductFormValues>({
    resource: "products",
    action: "create",
  });

  const editModal = useModalForm<Product, ApiError, ProductFormValues>({
    resource: "products",
    action: "edit",
  });
  const { show: showEditModal } = editModal;

  const { queryResult: showQueryResult, showId, setShowId } = useShow<Product, ApiError>({
    resource: "products",
  });

  const showProductEdit = useCallback((id: string | number) => showEditModal(id), [showEditModal]);
  const showProduct = useCallback((id: string | number) => setShowId(id), [setShowId]);
  const columns = useProductColumns({ onEdit: showProductEdit, onShow: showProduct });

  return (
    <>
      <List headerButtons={<CreateButton onClick={(e) => { e.preventDefault(); createModal.show(); }} />}>
        <FilterBar>
          <ProductSearchInput
            key={appliedName}
            initialValue={appliedName}
            onApply={applyNameSearch}
            placeholder={t("products.searchPlaceholder")}
          />
        </FilterBar>
        <BaseTable<Product>
          fitToShell
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
