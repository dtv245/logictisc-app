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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { env } from "@config/env";
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

  const [, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  // Trạng thái mở/đóng điều hướng: trên mobile phụ thuộc Drawer, trên tablet/desktop phụ thuộc Sider
  const isNavOpen = isMobile ? mobileSiderOpen : !siderCollapsed;

  const handleToggleNavigation = () => {
    if (isMobile) {
      setMobileSiderOpen(!mobileSiderOpen);
    } else {
      setSiderCollapsed(!siderCollapsed);
    }
  };

  const navToggleLabel = t(
    isNavOpen ? "navigation.collapse" : "navigation.expand",
  );

  return (
    <Layout.Header className="app-header">
      <Flex align="center" className="app-header__left" gap="middle">
        <Button
          aria-expanded={isMobile ? mobileSiderOpen : !siderCollapsed}
          aria-label={navToggleLabel}
          className="app-header__toggle-btn"
          icon={isNavOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={handleToggleNavigation}
          type="text"
        />
        {/* Brand logo/tên ứng dụng rút gọn trên Mobile khi Sider bị ẩn */}
        <Typography.Title
          className="app-header__brand"
          level={5}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", margin: 0 }}
        >
          {env.appName}
        </Typography.Title>
        <div className="app-header__breadcrumb">
          <Breadcrumb />
        </div>
      </Flex>

      <Flex align="center" className="app-header__right" gap="middle">
        <NotificationHeaderIcon />
        <Dropdown
          placement="bottomRight"
          trigger={["click", "hover"]}
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
          <Flex
            align="center"
            aria-haspopup="true"
            aria-label={
              currentUser.data?.name
                ? `${currentUser.data.name}`
                : "Menu người dùng"
            }
            className="user-menu"
            gap="small"
            role="button"
            tabIndex={0}
          >
            <Avatar src={currentUser.data?.avatar}>
              {currentUser.data?.name?.charAt(0)}
            </Avatar>
            <Space className="user-menu__info" size="small">
              <Typography.Text className="user-menu__name">
                {currentUser.data?.name}
              </Typography.Text>
              <DownOutlined className="user-menu__arrow" />
            </Space>
          </Flex>
        </Dropdown>
      </Flex>
    </Layout.Header>
  );
};
