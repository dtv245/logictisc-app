import { DownOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex, Layout, Select, Space, Typography } from "antd";
import { Outlet } from "react-router-dom";

import { useCurrentUser } from "../hooks/auth/useCurrentUser";
import { useLogoutUser } from "../hooks/auth/useLogoutUser";
import { useApiError } from "../hooks/common/useApiError";
import { useCurrentTenant } from "../hooks/tenant/useCurrentTenant";
import { useSwitchTenant } from "../hooks/tenant/useSwitchTenant";
import { useTenantList } from "../hooks/tenant/useTenantList";
import { AppSidebar } from "./AppSidebar";

const { Content, Header } = Layout;

export const MainLayout = () => {
  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const { tenants } = useTenantList();
  const tenantSwitch = useSwitchTenant();
  const { logoutUser } = useLogoutUser();
  const { showApiError } = useApiError();

  const handleTenantChange = (tenantKey: string) => {
    if (tenantKey !== tenant?.tenantKey) {
      void tenantSwitch.switchTenant(tenantKey).catch(showApiError);
    }
  };

  return (
    <Layout className="app-shell">
      <AppSidebar />
      <Layout>
        <Header className="app-header">
          <Select
            aria-label="Công ty hiện tại"
            loading={tenantSwitch.isLoading}
            onChange={handleTenantChange}
            options={tenants.map((item) => ({
              label: item.tenantName,
              value: item.tenantKey,
            }))}
            value={tenant?.tenantKey}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: "logout",
                  label: "Đăng xuất",
                  onClick: () => void logoutUser(),
                },
              ],
            }}
          >
            <Flex align="center" gap={8} className="user-menu">
              <Avatar src={currentUser.data?.avatar}>
                {currentUser.data?.name?.charAt(0)}
              </Avatar>
              <Space size={4}>
                <Typography.Text>{currentUser.data?.name}</Typography.Text>
                <DownOutlined />
              </Space>
            </Flex>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
