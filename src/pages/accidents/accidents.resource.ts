/** Khai báo Accident resource cho Refine. */
import { WarningOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const accidentsResource = createResourceConfig({
  icon: WarningOutlined,
  label: "Tai nạn",
  name: "accidents",
  routes: routes.resources.accidents,
});
