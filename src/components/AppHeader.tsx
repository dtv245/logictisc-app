/**
 * Hiển thị tenant selector và identity trong header dùng chung.
 */

import { DownOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex, Layout, Select, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { APP_I18N_NAMESPACE } from "@locales";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLogoutUser } from "../hooks/useLogoutUser";
import { useApiError } from "../hooks/useApiError";
import { useCurrentTenant } from "../hooks/useCurrentTenant";
import { useSwitchTenant } from "../hooks/useSwitchTenant";
import { useTenantList } from "../hooks/useTenantList";

export const AppHeader = () => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
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
      // tenantKey chỉ dùng để nhận biết lựa chọn đã thay đổi. Giá trị này không
      // được gửi thẳng lên API; tenant mới phải đến từ token sau re-authentication.
      void tenantSwitch.switchTenant().catch(showApiError);
    }
  };

  return (
    <Layout.Header className="app-header">
      <Select
        aria-label={t("tenant.currentLabel")}
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
              key: "change-tenant",
              label: t("common.changeTenant"),
              onClick: () => void tenantSwitch.switchTenant(),
            },
            {
              key: "logout",
              label: t("common.logout"),
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
