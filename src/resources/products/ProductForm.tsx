import {
  Form,
  Input,
  InputNumber,
  Switch,
  type FormProps,
} from "antd";

import type { ProductFormValues } from "./types";

interface ProductFormProps {
  formProps: FormProps<ProductFormValues>;
}

export const ProductForm = ({ formProps }: ProductFormProps) => (
  <Form<ProductFormValues> {...formProps} layout="vertical">
    <Form.Item
      label="Tên sản phẩm"
      name="name"
      rules={[{ required: true, message: "Nhập tên sản phẩm." }]}
    >
      <Input />
    </Form.Item>

    <Form.Item
      label="SKU"
      name="sku"
      rules={[{ required: true, message: "Nhập SKU." }]}
    >
      <Input />
    </Form.Item>

    <Form.Item label="Mô tả" name="description">
      <Input.TextArea rows={4} />
    </Form.Item>

    <Form.Item
      label="Giá"
      name="price"
      rules={[{ required: true, message: "Nhập giá sản phẩm." }]}
    >
      <InputNumber min={0} precision={2} className="full-width" />
    </Form.Item>

    <Form.Item
      label="Tồn kho"
      name="stockQuantity"
      rules={[{ required: true, message: "Nhập số lượng tồn kho." }]}
    >
      <InputNumber min={0} precision={0} className="full-width" />
    </Form.Item>

    <Form.Item
      label="Đang hoạt động"
      name="active"
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
  </Form>
);
