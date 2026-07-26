/** Khai báo AI Dispatch resource cho Refine. */
import { RobotOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const aiDispatchResource = createResourceConfig({
  icon: RobotOutlined,
  label: "AI Dispatch",
  name: "ai-dispatch",
  routes: routes.resources.aiDispatch,
});
