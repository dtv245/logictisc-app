/**
 * AppSider component.
 *
 * Menu navigation has been moved into the Select dropdown in AppHeader.
 * This component returns null so no side navigation bar is rendered.
 *
 * Kiểu được khai báo tường minh để giữ đúng hợp đồng của slot `Sider` trong
 * `ThemedLayoutV2`, dù component không dùng tham số nào.
 */

import type { RefineThemedLayoutV2SiderProps } from "@refinedev/antd";
import type { FC } from "react";

export const AppSider: FC<RefineThemedLayoutV2SiderProps> = () => null;
