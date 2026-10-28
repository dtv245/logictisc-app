import { TeamOutlined } from "@ant-design/icons";

import { routes } from "@/constants/routes";
import { createResourceConfig } from "@/utils/resourceConfig";

export const driversResource = createResourceConfig({
  icon: TeamOutlined,
  label: "Tài xế",
  name: "drivers",
  routes: routes.resources.drivers,
});
