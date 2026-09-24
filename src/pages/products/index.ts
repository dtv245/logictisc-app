/**
 * Barrel export của Product resource.
 */

export { useProductColumns } from "@features/products/components/columns";
export { ProductCreate } from "./create";
export { ProductEdit } from "./edit";
export { ProductList } from "./list";
export { productsResource } from "@features/products/products.resource";
export { ProductShow } from "./show";
export type {
  Product,
  ProductFormValues,
  ProductSearchValues,
} from "@/types/product.types";
