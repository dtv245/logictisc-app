/** Khai báo Load Board resource cho Refine. */
import { FundProjectionScreenOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const loadBoardResource = createResourceConfig({
  icon: FundProjectionScreenOutlined,
  label: "Load Board",
  name: "load-board",
  routes: routes.resources.loadBoard,
});
