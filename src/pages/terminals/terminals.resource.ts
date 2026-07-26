/** Khai báo Terminal resource cho Refine. */
import { BankOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const terminalsResource = createResourceConfig({
  icon: BankOutlined,
  label: "Terminal",
  name: "terminals",
  routes: routes.resources.terminals,
});
