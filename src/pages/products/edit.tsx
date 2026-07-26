/**
 * Hiển thị form chỉnh sửa product bằng Refine useForm.
 */

import { Edit, useForm } from "@refinedev/antd";

import type { ApiError } from "../../types/api";
import { ProductForm } from "./form";
import type { Product, ProductFormValues } from "./types";

export const ProductEdit = () => {
  // useForm tải record và gửi mutation pessimistic qua DataProvider.
  const { formProps, saveButtonProps, queryResult } = useForm<
    Product,
    ApiError,
    ProductFormValues
  >({
    action: "edit",
    mutationMode: "pessimistic",
    resource: "products",
    redirect: "list",
  });

  return (
    <Edit
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
    >
      <ProductForm formProps={formProps} />
    </Edit>
  );
};
