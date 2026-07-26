/** Khai báo Container resource cho Refine. */
import { InboxOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const containersResource = createResourceConfig({
  icon: InboxOutlined,
  label: "Container",
  name: "containers",
  routes: routes.resources.containers,
});
