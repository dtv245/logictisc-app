/** Khai báo Conversation resource cho Refine. */
import { MessageOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const conversationsResource = createResourceConfig({
  icon: MessageOutlined,
  label: "Hội thoại",
  name: "conversations",
  routes: routes.resources.conversations,
});
