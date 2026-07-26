import { Create, useForm } from "@refinedev/antd";

import type { ApiError } from "../../types/api";
import { ProductForm } from "./ProductForm";
import type { Product, ProductFormValues } from "./types";

export const ProductCreate = () => {
  const { formProps, saveButtonProps } = useForm<
    Product,
    ApiError,
    ProductFormValues
  >({
    action: "create",
    resource: "products",
    redirect: "list",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <ProductForm
        formProps={{
          ...formProps,
          initialValues: {
            active: true,
            price: 0,
            stockQuantity: 0,
          },
        }}
      />
    </Create>
  );
};
