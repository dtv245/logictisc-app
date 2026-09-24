/**
 * Chứa các field dùng chung cho create và edit product.
 */

import {
  Form,
  Input,
  InputNumber,
  Switch,
  type FormProps,
} from "antd";
import { useTranslation } from "react-i18next";

import { FormGrid } from "@/forms/FormGrid";
import type { FormGridColumns, FormGridItem } from "@/forms/FormGrid";
import type { ProductFormValues } from "@/types/product.types";

interface ProductFormProps {
  /**
   * Số cột ở màn rộng. Mặc định `1` cho modal; trang create/edit truyền `2`.
   */
  columns?: FormGridColumns;
  formProps: FormProps<ProductFormValues>;
}

export const ProductForm = ({ columns = 1, formProps }: ProductFormProps) => {
  const { t } = useTranslation();

  // `description` là `TextArea` nên chiếm cả chiều ngang — cùng quy tắc với
  // `isFullWidthControl` của `resourceFormDefinitions`.
  const items: FormGridItem[] = [
    {
      key: "name",
      node: (
        <Form.Item
          label={t("products.fields.name")}
          name="name"
          rules={[{ required: true, message: t("products.fields.nameRequired") }]}
        >
          <Input />
        </Form.Item>
      ),
    },
    {
      key: "sku",
      node: (
        <Form.Item
          label={t("products.fields.sku")}
          name="sku"
          rules={[{ required: true, message: t("products.fields.skuRequired") }]}
        >
          <Input />
        </Form.Item>
      ),
    },
    {
      fullWidth: true,
      key: "description",
      node: (
        <Form.Item label={t("products.fields.description")} name="description">
          <Input.TextArea rows={4} />
        </Form.Item>
      ),
    },
    {
      key: "price",
      node: (
        <Form.Item
          label={t("products.fields.price")}
          name="price"
          rules={[{ required: true, message: t("products.fields.priceRequired") }]}
        >
          <InputNumber min={0} precision={2} className="full-width" />
        </Form.Item>
      ),
    },
    {
      key: "stockQuantity",
      node: (
        <Form.Item
          label={t("products.fields.stockQuantity")}
          name="stockQuantity"
          rules={[
            { required: true, message: t("products.fields.stockQuantityRequired") },
          ]}
        >
          <InputNumber min={0} precision={0} className="full-width" />
        </Form.Item>
      ),
    },
    {
      key: "active",
      node: (
        <Form.Item
          label={t("products.fields.active")}
          name="active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      ),
    },
  ];

  return (
    <Form<ProductFormValues> {...formProps} layout="vertical">
      <FormGrid columns={columns} items={items} />
    </Form>
  );
};
