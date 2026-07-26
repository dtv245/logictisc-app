/** Khai báo DVIR resource cho Refine. */
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { routes } from "../../constants/routes";
import { createResourceConfig } from "../resourceConfig";
export const dvirResource = createResourceConfig({
  icon: SafetyCertificateOutlined,
  label: "DVIR",
  name: "dvir",
  routes: routes.resources.dvir,
});
