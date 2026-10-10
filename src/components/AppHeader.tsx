/**
 * AppHeader — Thanh tiêu đề phía trên ứng dụng.
 * Hiển thị nút đóng/mở thanh điều hướng bên trái, breadcrumb vị trí hiện tại
 * và menu người dùng.
 */

import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Breadcrumb, useThemedLayoutContext } from "@refinedev/antd";
import { Avatar, Button, Dropdown, Flex, Layout, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { routes } from "@constants/routes";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLogoutUser } from "../hooks/useLogoutUser";
import { useSwitchTenant } from "../hooks/useSwitchTenant";
import { NotificationHeaderIcon } from "@features/notifications/components/NotificationHeaderIcon";
import { PROFILE_CONTRACT_CONFIRMED } from "@/features/profile/profile.contract";

export const AppHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentUser = useCurrentUser();
  const tenantSwitch = useSwitchTenant();
  const { logoutUser } = useLogoutUser();

  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  return (
    <Layout.Header className="app-header">
      <Flex align="center" gap="middle">
        <Button
          aria-label={t(
            siderCollapsed ? "navigation.expand" : "navigation.collapse",
          )}
          icon={siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth < 992) {
              setMobileSiderOpen(!mobileSiderOpen);
            } else {
              setSiderCollapsed(!siderCollapsed);
            }
          }}
          type="text"
        />
        <Breadcrumb />
      </Flex>
      <Flex align="center" gap="middle">
        <NotificationHeaderIcon />
        <Dropdown
          menu={{
            items: [
              ...(PROFILE_CONTRACT_CONFIRMED
                ? [
                    {
                      key: "profile",
                      label: t("profile.title"),
                      onClick: () => navigate(routes.profile),
                    },
                  ]
                : []),
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
      </Flex>
    </Layout.Header>
  );
};
