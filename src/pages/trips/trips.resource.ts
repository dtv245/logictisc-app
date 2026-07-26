/** Khai báo Trip resource cho Refine. */
import { EnvironmentOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const tripsResource = createResourceConfig({
  icon: EnvironmentOutlined,
  label: "Hành trình",
  name: "trips",
  routes: routes.resources.trips,
});
