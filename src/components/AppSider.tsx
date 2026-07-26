/**
 * Bọc ThemedSiderV2 để giữ cleanup query khi đăng xuất.
 */

import { LogoutOutlined } from "@ant-design/icons";
import {
  ThemedSiderV2,
  type RefineThemedLayoutV2SiderProps,
} from "@refinedev/antd";
import { Menu } from "antd";

import { useLogoutUser } from "../hooks/useLogoutUser";
import { commonUiText } from "../constants/ui";

export const AppSider = (props: RefineThemedLayoutV2SiderProps) => {
  // Custom logout hook dọn tenant-scoped queries trước khi phiên kết thúc.
  const { logoutUser } = useLogoutUser();

  return (
    <ThemedSiderV2
      {...props}
      render={({ items }) => (
        <>
          {items}
          <Menu.Item
            icon={<LogoutOutlined />}
            key="logout"
            onClick={() => void logoutUser()}
          >
            {commonUiText.logout}
          </Menu.Item>
        </>
      )}
    />
  );
};
