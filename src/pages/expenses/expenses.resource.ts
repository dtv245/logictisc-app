/** Khai báo Expense resource cho Refine. */
import { WalletOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const expensesResource = createResourceConfig({
  icon: WalletOutlined,
  label: "Chi phí",
  name: "expenses",
  routes: routes.resources.expenses,
});
