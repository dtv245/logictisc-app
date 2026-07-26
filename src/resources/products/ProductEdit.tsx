import { Edit, useForm } from "@refinedev/antd";

import type { ApiError } from "../../types/api";
import { ProductForm } from "./ProductForm";
import type { Product, ProductFormValues } from "./types";

export const ProductEdit = () => {
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
