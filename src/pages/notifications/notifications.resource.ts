/** Khai báo Notification resource cho Refine. */
import { BellOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const notificationsResource = createResourceConfig({
  icon: BellOutlined,
  label: "Thông báo",
  name: "notifications",
  routes: routes.resources.notifications,
});
