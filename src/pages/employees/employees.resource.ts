/** Khai báo Employee resource cho Refine. */
import { TeamOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const employeesResource = createResourceConfig({
  icon: TeamOutlined,
  label: "Nhân viên",
  name: "employees",
  routes: routes.resources.employees,
});
