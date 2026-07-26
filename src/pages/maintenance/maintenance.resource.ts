/** Khai báo Maintenance resource cho Refine. */
import { ToolOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const maintenanceResource = createResourceConfig({
  icon: ToolOutlined,
  label: "Bảo trì",
  name: "maintenance",
  routes: routes.resources.maintenance,
});
