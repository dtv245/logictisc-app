/** Khai báo Load resource cho Refine. */
import { CarOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";

export const loadsResource = createResourceConfig({
  icon: CarOutlined,
  label: "Chuyến hàng",
  name: "loads",
  routes: routes.resources.loads,
});
