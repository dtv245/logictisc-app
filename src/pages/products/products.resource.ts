/**
 * Khai báo Product resource cho Refine.
 */

import { AppstoreOutlined } from "@ant-design/icons";

import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";

export const productsResource = createResourceConfig({
  icon: AppstoreOutlined,
  label: "Sản phẩm",
  name: "products",
  routes: routes.resources.products,
});
