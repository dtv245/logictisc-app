/** Khai báo Document resource cho Refine. */
import { FileTextOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const documentsResource = createResourceConfig({
  icon: FileTextOutlined,
  label: "Tài liệu",
  name: "documents",
  routes: routes.resources.documents,
});
