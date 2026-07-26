/** Khai báo Payment resource cho Refine. */
import { CreditCardOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const paymentsResource = createResourceConfig({
  icon: CreditCardOutlined,
  label: "Thanh toán",
  name: "payments",
  routes: routes.resources.payments,
});
