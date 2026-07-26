/**
 * Hiển thị tên ứng dụng trong sider của ThemedLayoutV2.
 */

import type { TitleProps } from "@refinedev/core";
import { Typography } from "antd";

import { env } from "../config/env";

export const AppTitle = ({ collapsed }: TitleProps) => (
  <Typography.Title className="app-brand" level={4}>
    {collapsed ? "C" : env.appName}
  </Typography.Title>
);
