/* eslint-disable react-refresh/only-export-components */
/**
 * AppSider — Thanh điều hướng bên trái ứng dụng (dạng Rail thu gọn).
 *
 * Nguyên tắc sắp xếp: theo CÔNG VIỆC của nhân viên logistics, không theo cách hệ thống được xây dựng.
 *   Đơn hàng -> chuyến xe -> container/bến bãi -> đội xe -> hóa đơn -> lương.
 *
 * Cấu trúc 3 tầng:
 *   Thẻ trắng (app-sider__group)  ->  Khu vực (icon trên rail)  ->  Mục nhỏ (tiêu đề trong menu nổi)  ->  Màn hình
 *
 * 1. Thẻ "Điều hành & Vận tải":
 *    - Điều hành: Trung tâm điều hành, Dashboard quản lý | AI điều phối, Tối ưu điều phối
 *    - Vận tải:   Bảng điều phối, Đơn hàng, Chuyến xe | Container, Bến bãi
 * 2. Thẻ "Đội xe & Khách hàng":
 *    - Đội xe & An toàn:      Xe tải, Bảo trì | HOS/ELD, DVIR, Tai nạn | Báo cáo đội xe
 *    - Khách hàng & Hàng hóa: Khách hàng, Hàng hóa
 * 3. Thẻ "Tài chính & Lương":
 *    - Hóa đơn & Thu chi: Hóa đơn, Thanh toán, Chi phí | Báo cáo lợi nhuận
 *    - Lương & Quyết toán: Quyết toán, Chính sách lương | Bảng lương, Đối soát | Phiếu lương của tôi
 * 4. Khối tiện ích: Thông báo, Quản trị (Nhân viên, Hồ sơ & tài liệu).
 *
 * Quy tắc hiển thị:
 * - Mỗi icon trên rail mở một menu nổi. Trong menu nổi, các màn hình cùng việc được gom dưới một tiêu đề nhỏ.
 * - Khu vực chỉ có 1 mục nhỏ thì hiển thị danh sách phẳng, không có tiêu đề.
 * - Mục nhỏ nào không còn màn hình nào được phép xem thì tự ẩn; khu vực rỗng cũng tự ẩn.
 * - Nhãn lấy từ i18n: navigation.zones.*, navigation.sections.*, navigation.items.*
 *   (xem file navigation.i18n.json).
 * - Mục đang chọn tự đồng bộ theo URL; quyền truy cập kiểm tra theo vai trò.
 */

import {
  AccountBookOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BarChartOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CodeSandboxOutlined,
  CompassOutlined,
  ContactsOutlined,
  ControlOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DesktopOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LineChartOutlined,
  LogoutOutlined,
  ReconciliationOutlined,
  RiseOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  TransactionOutlined,
  UserOutlined,
  WalletOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { RefineThemedLayoutV2SiderProps } from "@refinedev/antd";
import { useCanWithoutCache } from "@refinedev/core";
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip, type MenuProps } from "antd";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useCurrentUser } from "@hooks/useCurrentUser";
import { useLogoutUser } from "@hooks/useLogoutUser";
import { useSwitchTenant } from "@hooks/useSwitchTenant";
import { NotificationHeaderIcon } from "@features/notifications/components/NotificationHeaderIcon";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/executive.contract";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/payroll.api";
import type { AccessResource } from "@/types/roles.types";
import { routes } from "@constants/routes";
import { AppTitle } from "./AppTitle";
import "./AppSider.scss";

export interface NavZoneItem {
  icon: ReactNode;
  key: string;
  labelKey: string;
  route: string;
  permission?: { resource: AccessResource; action: string };
  resource?: string;
  /**
   * Mục nhỏ trong menu nổi, ví dụ "dispatch" -> navigation.sections.dispatch.
   * Các màn hình liền nhau có cùng sectionKey sẽ được gom dưới một tiêu đề.
   */
  sectionKey?: string;
}

export interface NavZone {
  icon: ReactNode;
  key: string;
  labelKey: string;
  items: readonly NavZoneItem[];
}

type MenuItems = NonNullable<MenuProps["items"]>;

/**
 * Thứ tự khu vực và màn hình đi theo luồng công việc thực tế.
 * Mỗi icon trong file này chỉ dùng cho đúng một màn hình để nhìn là nhận ra.
 */
export const NAV_ZONES: readonly NavZone[] = [
  {
    key: "zone:operations",
    labelKey: "navigation.zones.operations",
    icon: <DashboardOutlined />,
    items: [
      {
        icon: <DesktopOutlined />,
        key: "app:operations",
        labelKey: "navigation.items.operations",
        route: routes.operations,
        sectionKey: "monitor",
      },
      ...(EXECUTIVE_CONTRACT_CONFIRMED
        ? [
            {
              icon: <BarChartOutlined />,
              key: "app:dashboard",
              labelKey: "navigation.items.dashboard",
              route: routes.dashboard,
              sectionKey: "monitor",
            },
          ]
        : []),
      {
        icon: <RobotOutlined />,
        key: "res:ai-dispatch",
        labelKey: "navigation.items.ai-dispatch",
        route: routes.aiDispatch,
        permission: { resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" },
        sectionKey: "smart-tools",
      },
      {
        icon: <RocketOutlined />,
        key: "app:optimization",
        labelKey: "navigation.items.optimization",
        route: routes.optimization,
        permission: { resource: "optimization", action: "OPTIMIZATION_VIEW" },
        sectionKey: "smart-tools",
      },
    ],
  },
  {
    key: "zone:transport",
    labelKey: "navigation.zones.transport",
    icon: <SendOutlined />,
    items: [
      {
        icon: <AppstoreOutlined />,
        key: "res:load-board",
        labelKey: "navigation.items.load-board",
        route: routes.resources.loadBoard.list,
        resource: "load-board",
        sectionKey: "dispatch",
      },
      {
        icon: <InboxOutlined />,
        key: "res:loads",
        labelKey: "navigation.items.loads",
        route: routes.resources.loads.list,
        resource: "loads",
        sectionKey: "dispatch",
      },
      {
        icon: <CompassOutlined />,
        key: "res:trips",
        labelKey: "navigation.items.trips",
        route: routes.resources.trips.list,
        resource: "trips",
        sectionKey: "dispatch",
      },
      {
        icon: <CodeSandboxOutlined />,
        key: "res:containers",
        labelKey: "navigation.items.containers",
        route: routes.resources.containers.list,
        resource: "containers",
        sectionKey: "cargo",
      },
      {
        icon: <EnvironmentOutlined />,
        key: "res:terminals",
        labelKey: "navigation.items.terminals",
        route: routes.resources.terminals.list,
        resource: "terminals",
        sectionKey: "cargo",
      },
    ],
  },
  {
    key: "zone:fleet",
    labelKey: "navigation.zones.fleet",
    icon: <CarOutlined />,
    items: [
      {
        icon: <CarOutlined />,
        key: "res:trucks",
        labelKey: "navigation.items.trucks",
        route: routes.resources.trucks.list,
        resource: "trucks",
        sectionKey: "vehicles",
      },
      {
        icon: <ToolOutlined />,
        key: "res:maintenance",
        labelKey: "navigation.items.maintenance",
        route: routes.resources.maintenance.list,
        resource: "maintenance",
        sectionKey: "vehicles",
      },
      {
        icon: <ClockCircleOutlined />,
        key: "res:hos-eld",
        labelKey: "navigation.items.hos-eld",
        route: routes.resources.hosEld.list,
        resource: "hos-eld",
        sectionKey: "safety",
      },
      {
        icon: <SafetyCertificateOutlined />,
        key: "res:dvir",
        labelKey: "navigation.items.dvir",
        route: routes.resources.dvir.list,
        resource: "dvir",
        sectionKey: "safety",
      },
      {
        icon: <WarningOutlined />,
        key: "res:accidents",
        labelKey: "navigation.items.accidents",
        route: routes.resources.accidents.list,
        resource: "accidents",
        sectionKey: "safety",
      },
      {
        icon: <LineChartOutlined />,
        key: "app:fleet-report",
        labelKey: "navigation.items.fleet-report",
        route: routes.fleetReport,
        permission: { resource: "fleet-reports", action: "FLEET_REPORT_VIEW" },
        sectionKey: "reports",
      },
    ],
  },
  {
    key: "zone:partners",
    labelKey: "navigation.zones.partners",
    icon: <ShopOutlined />,
    items: [
      {
        icon: <ContactsOutlined />,
        key: "res:customers",
        labelKey: "navigation.items.customers",
        route: routes.resources.customers.list,
        resource: "customers",
      },
      {
        icon: <ShoppingOutlined />,
        key: "res:products",
        labelKey: "navigation.items.products",
        route: routes.resources.products.list,
        resource: "products",
      },
    ],
  },
  {
    key: "zone:finance",
    labelKey: "navigation.zones.finance",
    icon: <AccountBookOutlined />,
    items: [
      {
        icon: <FileTextOutlined />,
        key: "res:invoices",
        labelKey: "navigation.items.invoices",
        route: routes.resources.invoices.list,
        resource: "invoices",
        sectionKey: "cashflow",
      },
      {
        icon: <CreditCardOutlined />,
        key: "res:payments",
        labelKey: "navigation.items.payments",
        route: routes.resources.payments.list,
        resource: "payments",
        sectionKey: "cashflow",
      },
      {
        icon: <TransactionOutlined />,
        key: "res:expenses",
        labelKey: "navigation.items.expenses",
        route: routes.resources.expenses.list,
        resource: "expenses",
        sectionKey: "cashflow",
      },
      {
        icon: <RiseOutlined />,
        key: "app:profitability",
        labelKey: "navigation.items.profitability",
        route: routes.profitability,
        permission: { resource: "profitability", action: "PROFITABILITY_VIEW" },
        sectionKey: "reports",
      },
    ],
  },
  {
    key: "zone:payroll",
    labelKey: "navigation.zones.payroll",
    icon: <WalletOutlined />,
    items: [
      {
        icon: <AuditOutlined />,
        key: "app:settlements",
        labelKey: "navigation.items.settlements",
        route: routes.resources.settlements.list,
        permission: { resource: "settlements", action: "SETTLEMENT_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <ControlOutlined />,
        key: "app:pay-policies",
        labelKey: "navigation.items.pay-policies",
        route: routes.resources.settlements.policies,
        permission: { resource: "driver-pay-policies", action: "POLICY_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <DollarOutlined />,
        key: "app:payroll",
        labelKey: "navigation.items.payroll",
        route: routes.payroll,
        permission: { resource: "payroll", action: "PAYROLL_VIEW" },
        sectionKey: "payroll-run",
      },
      ...(PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED
        ? [
            {
              icon: <ReconciliationOutlined />,
              key: "app:payroll-reconciliation",
              labelKey: "navigation.items.payroll-reconciliation",
              route: routes.payrollReconciliation,
              permission: { resource: "payroll" as const, action: "PAYROLL_VIEW" },
              sectionKey: "payroll-run",
            },
          ]
        : []),
      {
        icon: <UserOutlined />,
        key: "app:my-payslips",
        labelKey: "navigation.items.my-payslips",
        route: routes.myPayslips,
        permission: { resource: "payslips", action: "PAYSLIP_VIEW" },
        sectionKey: "mine",
      },
    ],
  },
  {
    key: "zone:admin",
    labelKey: "navigation.zones.admin",
    icon: <SettingOutlined />,
    items: [
      {
        icon: <TeamOutlined />,
        key: "res:employees",
        labelKey: "navigation.items.employees",
        route: routes.resources.employees.list,
        resource: "employees",
      },
      {
        icon: <FolderOpenOutlined />,
        key: "res:documents",
        labelKey: "navigation.items.documents",
        route: routes.resources.documents.list,
        resource: "documents",
      },
    ],
  },
];

/**
 * Các thẻ trắng bo tròn trên rail (app-sider__group). Mỗi thẻ là một nhóm việc:
 * - Điều hành & Vận tải: theo dõi, điều phối đơn/chuyến, container, bến bãi.
 * - Đội xe & Khách hàng: xe, tuân thủ an toàn, khách hàng, hàng hóa.
 * - Tài chính & Lương: hóa đơn, thu chi, quyết toán, bảng lương.
 * Khối tiện ích (thông báo, quản trị) nằm riêng ở cuối, không thuộc danh sách này.
 */
export interface SiderNavGroup {
  key: string;
  name: string;
  zoneKeys: readonly string[];
}

export const SIDER_NAV_GROUPS: readonly SiderNavGroup[] = [
  {
    key: "group:operations-transport",
    name: "Điều hành & Vận tải",
    zoneKeys: ["zone:operations", "zone:transport"],
  },
  {
    key: "group:fleet-partners",
    name: "Đội xe & Khách hàng",
    zoneKeys: ["zone:fleet", "zone:partners"],
  },
  {
    key: "group:finance",
    name: "Tài chính & Lương",
    zoneKeys: ["zone:finance", "zone:payroll"],
  },
];

/**
 * Dựng danh sách màn hình trong menu nổi của một khu vực.
 * Màn hình cùng sectionKey được gom dưới một tiêu đề, giữa các mục có đường kẻ.
 * Khu vực chỉ có 0-1 mục nhỏ thì trả về danh sách phẳng.
 */
const buildZoneChildren = (
  zone: NavZone,
  t: TFunction,
  navigate: (route: string) => void,
): MenuItems => {
  const toLeaf = (item: NavZoneItem) => ({
    key: item.key,
    icon: item.icon,
    label: t(item.labelKey),
    onClick: () => navigate(item.route),
  });

  const sectionCount = new Set(
    zone.items
      .map((item) => item.sectionKey)
      .filter((key): key is string => Boolean(key)),
  ).size;

  if (sectionCount < 2) {
    return zone.items.map(toLeaf);
  }

  const children: MenuItems = [];
  const buckets = new Map<string, MenuItems>();

  for (const item of zone.items) {
    if (!item.sectionKey) {
      children.push(toLeaf(item));
      continue;
    }

    let bucket = buckets.get(item.sectionKey);
    if (!bucket) {
      bucket = [];
      buckets.set(item.sectionKey, bucket);
      if (children.length > 0) {
        children.push({
          type: "divider",
          key: `${zone.key}:divider:${item.sectionKey}`,
        });
      }
      children.push({
        type: "group",
        key: `${zone.key}:section:${item.sectionKey}`,
        label: t(`navigation.sections.${item.sectionKey}`),
        children: bucket,
      });
    }
    bucket.push(toLeaf(item));
  }

  return children;
};

export const AppSider: FC<RefineThemedLayoutV2SiderProps> = ({
  Title: TitleComponent,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { can } = useCanWithoutCache();
  const currentUser = useCurrentUser();
  // Giữ lifecycle xác thực và dọn cache tenant khi thao tác ở cuối sidebar.
  const { logoutUser, isLoading: isLoggingOut } = useLogoutUser();
  const tenantSwitch = useSwitchTenant();

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
  let activeMatch: { zoneKey: string; itemKey: string; routeLength: number } | undefined;
  for (const zone of visibleZones) {
    for (const item of zone.items) {
      if (pathname === item.route || pathname.startsWith(item.route + "/")) {
        if (!activeMatch || item.route.length > activeMatch.routeLength) {
          activeMatch = {
            zoneKey: zone.key,
            itemKey: item.key,
            routeLength: item.route.length,
          };
        }
      }
    }
  }

  const activeZoneKey = activeMatch?.zoneKey;

  // Tạo cây menu theo tầng: khu vực -> (mục nhỏ) -> màn hình
  const menuItems: MenuItems = useMemo(() => {
    return visibleZones.map((zone) => ({
      key: zone.key,
      className: activeZoneKey === zone.key ? "app-sider__zone--active" : undefined,
      popupClassName: "app-sider-popup",
      icon: zone.icon,
      label: t(zone.labelKey),
      children: buildZoneChildren(zone, t, navigate),
    }));
  }, [visibleZones, activeZoneKey, t, navigate]);

  const renderMenu = (items: MenuProps["items"]) => (
    <Menu
      className="app-sider__menu"
      inlineCollapsed
      items={items}
      mode="inline"
      selectedKeys={activeMatch ? [activeMatch.itemKey] : []}
      theme="light"
      triggerSubMenuAction="click"
    />
  );

  const renderContent = () => (
    <div className="app-sider__content app-sider__content--compact">
      <div className="app-sider__logo">
        <div className="app-sider__brand">
          {TitleComponent ? (
            <TitleComponent collapsed />
          ) : (
            <AppTitle collapsed />
          )}
        </div>
      </div>

      <nav className="app-sider__navigation" aria-label={t("navigation.drawerTitle")}>
        {/* Mỗi nhóm việc là một thẻ bo tròn app-sider__group độc lập */}
        {SIDER_NAV_GROUPS.map((group) => {
          const groupMenuItems = menuItems.filter(
            (item) => item?.key && group.zoneKeys.includes(String(item.key)),
          );
          if (groupMenuItems.length === 0) {
            return null;
          }
          return (
            <div
              key={group.key}
              aria-label={group.name}
              className="app-sider__group"
              role="group"
            >
              {renderMenu(groupMenuItems)}
            </div>
          );
        })}

        {/* Khối tiện ích & quản trị hệ thống */}
        <div className="app-sider__group app-sider__group--utilities">
          <NotificationHeaderIcon placement="rightTop" />
          {visibleZones.some((zone) => zone.key === "zone:admin") &&
            renderMenu(menuItems.filter((item) => item?.key === "zone:admin"))}
        </div>
      </nav>

      <div className="app-sider__footer">
        <Tooltip placement="right" title={t("common.logout")}>
          <Button aria-label={t("common.logout")} className="app-sider__action" icon={<LogoutOutlined />} loading={isLoggingOut} onClick={() => void logoutUser()} type="text" />
        </Tooltip>
        {/* Bọc nhãn để Ant Design không rút chữ thành ký tự đầu khi Sider thu gọn. */}
        <Dropdown
          placement="topRight"
          trigger={["click"]}
          menu={{ items: [
            { key: "change-tenant", label: <span>{t("common.changeTenant")}</span>, disabled: tenantSwitch.isLoading, onClick: () => void tenantSwitch.switchTenant() },
            { key: "logout", label: <span>{t("common.logout")}</span>, disabled: isLoggingOut, onClick: () => void logoutUser() },
          ] }}
        >
          <Button className="app-sider__account" type="text" aria-label={t("navigation.accountMenu")}>
            <Avatar size={36} src={currentUser.data?.avatar}>{currentUser.data?.name?.charAt(0)}</Avatar>
          </Button>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <Layout.Sider
      className="app-sider app-sider--floating"
      collapsed
      collapsedWidth={88}
      theme="light"
      trigger={null}
      width={88}
    >
      {renderContent()}
    </Layout.Sider>
  );
};
