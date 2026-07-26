/**
 * Hiển thị tenant selector và identity trong header dùng chung.
 */

import { DownOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex, Layout, Select, Space, Typography } from "antd";

import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLogoutUser } from "../hooks/useLogoutUser";
import { useApiError } from "../hooks/useApiError";
import { useCurrentTenant } from "../hooks/useCurrentTenant";
import { useSwitchTenant } from "../hooks/useSwitchTenant";
import { useTenantList } from "../hooks/useTenantList";
import { commonUiText } from "../constants/ui";

export const AppHeader = () => {
  // Các hook Refine dùng chung một identity query; tách tenant derivation thành
  // custom hooks giúp header không tự gọi API hoặc giữ state tenant cục bộ.
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
    <Layout.Header className="app-header">
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
              label: commonUiText.logout,
              onClick: () => void logoutUser(),
            },
          ],
        }}
      >
        <Flex align="center" className="user-menu" gap="small">
          <Avatar src={currentUser.data?.avatar}>
            {currentUser.data?.name?.charAt(0)}
          </Avatar>
          <Space size="small">
            <Typography.Text>{currentUser.data?.name}</Typography.Text>
            <DownOutlined />
          </Space>
        </Flex>
      </Dropdown>
    </Layout.Header>
  );
};
