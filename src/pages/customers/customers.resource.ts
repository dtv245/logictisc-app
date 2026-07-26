/** Khai báo Customer resource cho Refine. */
import { SolutionOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const customersResource = createResourceConfig({
  icon: SolutionOutlined,
  label: "Khách hàng",
  name: "customers",
  routes: routes.resources.customers,
});
