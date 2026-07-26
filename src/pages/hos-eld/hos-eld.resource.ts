/** Khai báo HOS/ELD resource cho Refine. */
import { FieldTimeOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const hosEldResource = createResourceConfig({
  icon: FieldTimeOutlined,
  label: "HOS / ELD",
  name: "hos-eld",
  routes: routes.resources.hosEld,
});
