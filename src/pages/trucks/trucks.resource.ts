/** Khai báo Truck resource cho Refine. */
import { TruckOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const trucksResource = createResourceConfig({
  icon: TruckOutlined,
  label: "Xe tải",
  name: "trucks",
  routes: routes.resources.trucks,
});
