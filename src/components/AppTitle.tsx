/**
 * Hiển thị tên ứng dụng trong sider của ThemedLayoutV2.
 */

import type { TitleProps } from "@refinedev/core";
import { TruckOutlined } from "@ant-design/icons";
import { Typography } from "antd";

import { env } from "@config/env";

export const AppTitle = ({ collapsed }: TitleProps) => (
  <Typography.Title className={`app-brand${collapsed ? " app-brand--compact" : ""}`} level={4}>
    <TruckOutlined aria-hidden className="app-brand__mark" />
    <span className="app-brand__name" title={env.appName}>{env.appName}</span>
  </Typography.Title>
);
