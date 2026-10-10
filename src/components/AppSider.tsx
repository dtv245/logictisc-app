/**
 * AppSider — Thanh Taskbar điều hướng bên trái ứng dụng.
 *
 * Cấu trúc:
 * - Nằm cố định ở cạnh trái layout (Left Sider).
 * - Hiển thị phân tầng (Hierarchical / Multi-tier): Cấp 1 là các Khu vực chức năng (SubMenu),
 *   cấp 2 là các màn hình chức năng chi tiết.
 * - Phân loại theo từng khu vực nghiệp vụ Logistics (Điều hành, Vận tải, Đội xe, Tài chính, Đối tác, Quản trị).
 * - Sắp xếp theo lớp với khả năng thu gọn / mở rộng (Collapse/Expand) linh hoạt.
 * - Tự động đồng bộ mục được chọn với URL hiện tại và kiểm soát quyền truy cập theo vai trò.
 */

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import type { RefineThemedLayoutV2SiderProps } from "@refinedev/antd";
import { useThemedLayoutContext } from "@refinedev/antd";
import { useCanWithoutCache } from "@refinedev/core";
import { Button, Drawer, Layout, Menu, type MenuProps } from "antd";
import { useEffect, useMemo, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useCurrentUser } from "@hooks/useCurrentUser";
import { NAV_ZONES } from "./appNavigation";
import { AppTitle } from "./AppTitle";

export const AppSider: FC<RefineThemedLayoutV2SiderProps> = ({
  Title: TitleComponent,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { can } = useCanWithoutCache();
  const currentUser = useCurrentUser();
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  const [allowedKeys, setAllowedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const allNavItems = useMemo(
    () => NAV_ZONES.flatMap((zone) => zone.items),
    [],
  );

  // Kiểm tra quyền hạn bất đồng bộ cho từng chức năng trong các khu
  useEffect(() => {
    let active = true;

    void Promise.all(
      allNavItems.map(async (item) => {
        if (item.permission) {
          const res = can ? await can(item.permission) : { can: true };
          return { key: item.key, allowed: Boolean(res?.can) };
        }
        if (item.resource) {
          const res = can
            ? await can({ action: "list", resource: item.resource })
            : { can: true };
          return { key: item.key, allowed: Boolean(res?.can) };
        }
        return { key: item.key, allowed: true };
      }),
    ).then((results) => {
      if (active) {
        const nextAllowed = new Set(
          results.filter((r) => r.allowed).map((r) => r.key),
        );
        setAllowedKeys((prev) => {
          if (
            prev.size === nextAllowed.size &&
            [...prev].every((k) => nextAllowed.has(k))
          ) {
            return prev;
          }
          return nextAllowed;
        });
      }
    });

    return () => {
      active = false;
    };
  }, [can, allNavItems, currentUser.data]);

  // Lọc các Khu vực và Chức năng theo quyền truy cập
  const visibleZones = useMemo(() => {
    return NAV_ZONES.map((zone) => ({
      ...zone,
      items: zone.items.filter((item) => allowedKeys.has(item.key)),
    })).filter((zone) => zone.items.length > 0);
  }, [allowedKeys]);

  // Xác định mục đang active và khu vực chứa mục đó dựa trên pathname
  let activeMatch: { zoneKey: string; itemKey: string } | undefined;
  for (const zone of visibleZones) {
    for (const item of zone.items) {
      if (pathname === item.route || pathname.startsWith(item.route + "/")) {
        activeMatch = { zoneKey: zone.key, itemKey: item.key };
        break;
      }
    }
    if (activeMatch) {
      break;
    }
  }

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [prevZoneKey, setPrevZoneKey] = useState<string | undefined>();

  // Tự động mở khu vực chứa trang đang xem khi zone active thay đổi
  if (activeMatch?.zoneKey && activeMatch.zoneKey !== prevZoneKey) {
    setPrevZoneKey(activeMatch.zoneKey);
    if (!openKeys.includes(activeMatch.zoneKey)) {
      setOpenKeys((prev) => [...prev, activeMatch.zoneKey]);
    }
  }

  // Tạo cây menu theo tầng, phân theo khu và phân loại chức năng
  const menuItems: MenuProps["items"] = useMemo(() => {
    return visibleZones.map((zone) => ({
      key: zone.key,
      icon: zone.icon,
      label: t(zone.labelKey),
      children: zone.items.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
        onClick: () => {
          navigate(item.route);
          if (mobileSiderOpen) {
            setMobileSiderOpen(false);
          }
        },
      })),
    }));
  }, [visibleZones, t, navigate, mobileSiderOpen, setMobileSiderOpen]);

  const renderContent = (isCollapsed: boolean) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Header Logo & Brand Title */}
      <div
        className="app-sider__logo"
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: isCollapsed ? "0 24px" : "0 16px",
          borderBottom: "1px solid #f0f0f0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {TitleComponent ? (
          <TitleComponent collapsed={isCollapsed} />
        ) : (
          <AppTitle collapsed={isCollapsed} />
        )}
      </div>

      {/* Hierarchical Tiered Menu */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Menu
          className="app-sider__menu"
          items={menuItems}
          mode="inline"
          onOpenChange={(keys) => setOpenKeys(keys)}
          openKeys={isCollapsed ? [] : openKeys}
          selectedKeys={activeMatch ? [activeMatch.itemKey] : []}
          style={{ borderRight: "none" }}
          theme="light"
        />
      </div>

      {/* Sider Footer Collapse/Expand Trigger */}
      <div
        className="app-sider__trigger"
        onClick={() => setSiderCollapsed(!siderCollapsed)}
        style={{
          height: 48,
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-end",
          padding: "0 16px",
          cursor: "pointer",
        }}
      >
        <Button
          aria-label={t(
            isCollapsed ? "navigation.expand" : "navigation.collapse",
          )}
          icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          type="text"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Drawer cho màn hình Mobile */}
      <Drawer
        closable={false}
        onClose={() => setMobileSiderOpen(false)}
        open={mobileSiderOpen}
        placement="left"
        styles={{ body: { padding: 0 } }}
        width={250}
      >
        {renderContent(false)}
      </Drawer>

      {/* Sider Taskbar chính bên trái cho Desktop */}
      <Layout.Sider
        breakpoint="lg"
        className="app-sider"
        collapsed={siderCollapsed}
        collapsedWidth={80}
        collapsible
        onCollapse={(collapsed) => setSiderCollapsed(collapsed)}
        style={{
          borderRight: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          left: 0,
          overflow: "hidden",
          position: "sticky",
          top: 0,
          zIndex: 99,
        }}
        theme="light"
        trigger={null}
        width={250}
      >
        {renderContent(siderCollapsed)}
      </Layout.Sider>
    </>
  );
};
