export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  stockQuantity: number;
  active: boolean;
}

export type ProductFormValues = Omit<Product, "id">;

export interface ProductSearchValues {
  name?: string;
}
