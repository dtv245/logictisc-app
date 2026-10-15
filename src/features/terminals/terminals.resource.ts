/** Khai báo Terminal resource cho Refine. */
import { EnvironmentOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "@utils/resourceConfig";
export const terminalsResource = createResourceConfig({
  icon: EnvironmentOutlined,
  label: "Terminal",
  name: "terminals",
  routes: routes.resources.terminals,
});
