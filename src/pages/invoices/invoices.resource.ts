/** Khai báo Invoice resource cho Refine. */
import { FileDoneOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const invoicesResource = createResourceConfig({
  icon: FileDoneOutlined,
  label: "Hóa đơn",
  name: "invoices",
  routes: routes.resources.invoices,
});
