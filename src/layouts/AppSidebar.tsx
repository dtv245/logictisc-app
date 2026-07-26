import {
  AppstoreOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigation, useParsed } from "@refinedev/core";
import { Button, Layout, Menu, Typography } from "antd";

import { useLogoutUser } from "../hooks/auth/useLogoutUser";

const { Sider } = Layout;

export const AppSidebar = () => {
  const { list } = useNavigation();
  const parsed = useParsed();
  const { logoutUser, isPending } = useLogoutUser();

  return (
    <Sider breakpoint="lg" collapsedWidth="0" className="app-sidebar">
      <Typography.Title level={4} className="app-brand">
        Logictics
      </Typography.Title>
      <Menu
        mode="inline"
        selectedKeys={[parsed.pathname ?? "/dashboard"]}
        items={[
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Tổng quan",
            onClick: () => list("dashboard"),
          },
          {
            key: "/products",
            icon: <AppstoreOutlined />,
            label: "Sản phẩm",
            onClick: () => list("products"),
          },
        ]}
      />
      <Button
        className="sidebar-logout"
        icon={<LogoutOutlined />}
        loading={isPending}
        onClick={() => void logoutUser()}
      >
        Đăng xuất
      </Button>
    </Sider>
  );
};
