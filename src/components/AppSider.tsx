/* eslint-disable react-refresh/only-export-components */
/**
 * AppSider — Thanh điều hướng bên trái dạng Icon Rail hiện đại, phẳng theo thiết kế hệ thống.
 *
 * Cấu trúc từ trên xuống:
 *   1. Logo thương hiệu: Ô vuông bo ~12px nền đen (~40px), dấu thương hiệu trắng.
 *   2. Cột icon: MỘT cột liên tục, khoảng cách đều, không thẻ bọc ngoài, không đường kẻ,
 *      dùng một Menu duy nhất để phím mũi tên đi liền qua toàn cột. Có hai loại mục:
 *        - Khu vực (Điều hành, Vận tải, Đội xe, Tài chính, Lương): bấm mở menu nổi
 *          chứa các màn hình con.
 *        - Mục lẻ (Khách hàng, Sản phẩm, Nhân viên, Tài liệu): bấm là sang trang luôn.
 *   3. Tiện ích thông báo: Chuông thông báo kèm badge đỏ góc trên phải.
 *   4. Cụm tiện ích & hồ sơ ghim ở đáy:
 *      - Nút Trợ lý AI: Vòng tròn nền tối viền tím, biểu tượng Sparkles trắng.
 *      - Avatar người dùng: Tròn 32px, nhấp mở menu tài khoản (Đổi công ty, Đăng xuất).
 *
 * Thứ tự theo đúng NAV_ZONES, sắp xếp theo luồng công việc thực tế:
 *   Điều hành -> Vận tải -> Đội xe -> Khách hàng -> Sản phẩm -> Tài chính -> Lương -> Nhân viên -> Tài liệu.
 */

import type { RefineThemedLayoutV2SiderProps } from "@refinedev/antd";
import { useCanWithoutCache } from "@refinedev/core";
import { Avatar, Button, Dropdown, Layout, Menu, Tooltip, type MenuProps } from "antd";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useCurrentUser } from "@hooks/useCurrentUser";
import { useLogoutUser } from "@hooks/useLogoutUser";
import { useSwitchTenant } from "@hooks/useSwitchTenant";
import { useAiFeatures } from "@/hooks/ai/useAiFeatures";
import { NotificationHeaderIcon } from "@features/notifications/components/NotificationHeaderIcon";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/config/executive.contract";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/api/payroll.api";
import type { AccessResource } from "@/types/roles.types";
import { routes } from "@constants/routes";
import { AppTitle } from "./AppTitle";
import {
  AiAgentNavIcon,
  AiDispatchNavIcon,
  CustomersNavIcon,
  DocumentsNavIcon,
  EmployeesNavIcon,
  FinanceZoneIcon,
  FleetReportNavIcon,
  InvoicesNavIcon,
  LoadsNavIcon,
  LogoutNavIcon,
  MyPayslipsNavIcon,
  OperationsDashboardIcon,
  OperationsMonitorIcon,
  OptimizationNavIcon,
  PaymentsNavIcon,
  PayPoliciesNavIcon,
  PayrollNavIcon,
  PayrollReconciliationNavIcon,
  PayrollZoneIcon,
  ProfitabilityNavIcon,
  SettlementsNavIcon,
  SwitchTenantNavIcon,
  TerminalsNavIcon,
  TmsFlowNavIcon,
  TripsNavIcon,
  TrucksNavIcon,
} from "./navIcons";
import "./AppSider.scss";

type MenuItems = NonNullable<MenuProps["items"]>;

type NavPermission = { resource: AccessResource; action: string };

export type NavZoneItem = {
  icon: ReactNode;
  key: string;
  labelKey: string;
  route: string;
  /** Resource của Refine — kiểm tra quyền "list". */
  resource?: string;
  /** Quyền chi tiết — được ưu tiên hơn `resource`. */
  permission?: NavPermission;
  /** Nhóm con trong menu nổi của khu vực (tiêu đề `navigation.sections.*`). */
  sectionKey?: string;
};

/** Khu vực có menu nổi chứa các màn hình con. */
type NavZoneGroup = {
  key: string;
  labelKey: string;
  icon: ReactNode;
  items: readonly NavZoneItem[];
};

/** Mỗi phần tử của NAV_ZONES là một khu vực (có `items`) hoặc một mục lẻ (có `route`). */
export type NavZone = NavZoneGroup | NavZoneItem;

export const NAV_ZONES: readonly NavZone[] = [
    
      {
        icon: <OperationsMonitorIcon />,
        key: "app:operations",
        labelKey: "navigation.items.operations",
        route: routes.operations,
        sectionKey: "monitor",
      },
      {
        icon: <TmsFlowNavIcon />,
        key: "app:tms-flow",
        labelKey: "navigation.items.tms-flow",
        route: routes.tmsFlow.root,
        sectionKey: "monitor",
      },
      ...(EXECUTIVE_CONTRACT_CONFIRMED
        ? ([
            {
              icon: <OperationsDashboardIcon />,
              key: "app:dashboard",
              labelKey: "navigation.items.dashboard",
              route: routes.dashboard,
              sectionKey: "monitor",
            },
          ] satisfies readonly NavZoneItem[])
        : []),
      {
        icon: <AiDispatchNavIcon />,
        key: "app:ai-dispatch",
        labelKey: "navigation.items.ai-dispatch",
        route: routes.aiDispatch,
        permission: { resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" },
        sectionKey: "smart-tools",
      },
      {
        icon: <OptimizationNavIcon />,
        key: "app:optimization",
        labelKey: "navigation.items.optimization",
        route: routes.optimization,
        permission: { resource: "optimization", action: "OPTIMIZATION_VIEW" },
        sectionKey: "smart-tools",
      },
    
      {
        icon: <LoadsNavIcon />,
        key: "res:loads",
        labelKey: "navigation.items.loads",
        route: routes.resources.loads.list,
        resource: "loads",
        sectionKey: "dispatch",
      },
      {
        icon: <TripsNavIcon />,
        key: "res:trips",
        labelKey: "navigation.items.trips",
        route: routes.resources.trips.list,
        resource: "trips",
        sectionKey: "dispatch",
      },
      {
        icon: <TerminalsNavIcon />,
        key: "res:terminals",
        labelKey: "navigation.items.terminals",
        route: routes.resources.terminals.list,
        resource: "terminals",
        sectionKey: "cargo",
      },
  {
        icon: <TrucksNavIcon />,
        key: "res:trucks",
        labelKey: "navigation.items.trucks",
        route: routes.resources.trucks.list,
        resource: "trucks",
        sectionKey: "vehicles",
      },
      {
        icon: <FleetReportNavIcon />,
        key: "app:fleet-report",
        labelKey: "navigation.items.fleet-report",
        route: routes.fleetReport,
        permission: { resource: "fleet-reports", action: "FLEET_REPORT_VIEW" },
        sectionKey: "reports",
      },
      {
        icon: <CustomersNavIcon />,
        key: "res:customers",
        labelKey: "navigation.items.customers",
        route: routes.resources.customers.list,
        resource: "customers",
      },
  {
    key: "zone:finance",
    labelKey: "navigation.zones.finance",
    icon: <FinanceZoneIcon />,
    items: [
      {
        icon: <InvoicesNavIcon />,
        key: "res:invoices",
        labelKey: "navigation.items.invoices",
        route: routes.resources.invoices.list,
        resource: "invoices",
        sectionKey: "cashflow",
      },
      {
        icon: <PaymentsNavIcon />,
        key: "res:payments",
        labelKey: "navigation.items.payments",
        route: routes.resources.payments.list,
        resource: "payments",
        sectionKey: "cashflow",
      },
      {
        icon: <ProfitabilityNavIcon />,
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
    icon: <PayrollZoneIcon />,
    items: [
      {
        icon: <SettlementsNavIcon />,
        key: "app:settlements",
        labelKey: "navigation.items.settlements",
        route: routes.resources.settlements.list,
        permission: { resource: "settlements", action: "SETTLEMENT_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <PayPoliciesNavIcon />,
        key: "app:pay-policies",
        labelKey: "navigation.items.pay-policies",
        route: routes.resources.settlements.policies,
        permission: { resource: "driver-pay-policies", action: "POLICY_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <PayrollNavIcon />,
        key: "app:payroll",
        labelKey: "navigation.items.payroll",
        route: routes.payroll,
        permission: { resource: "payroll", action: "PAYROLL_VIEW" },
        sectionKey: "payroll-run",
      },
      ...(PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED
        ? ([
            {
              icon: <PayrollReconciliationNavIcon />,
              key: "app:payroll-reconciliation",
              labelKey: "navigation.items.payroll-reconciliation",
              route: routes.payrollReconciliation,
              permission: { resource: "payroll", action: "PAYROLL_VIEW" },
              sectionKey: "payroll-run",
            },
          ] satisfies readonly NavZoneItem[])
        : []),
      {
        icon: <MyPayslipsNavIcon />,
        key: "app:my-payslips",
        labelKey: "navigation.items.my-payslips",
        route: routes.myPayslips,
        permission: { resource: "payslips", action: "PAYSLIP_VIEW" },
        sectionKey: "mine",
      },
    ],
  },
  {
    icon: <EmployeesNavIcon />,
    key: "res:employees",
    labelKey: "navigation.items.employees",
    route: routes.resources.employees.list,
    resource: "employees",
  },
  {
    icon: <DocumentsNavIcon />,
    key: "res:documents",
    labelKey: "navigation.items.documents",
    route: routes.resources.documents.list,
    resource: "documents",
  },
];

/** Phân biệt khu vực có menu con với mục lẻ (bấm là sang trang luôn). */
const isZoneGroup = (entry: NavZone): entry is NavZoneGroup =>
  "items" in entry;

/**
 * Dựng danh sách màn hình trong menu nổi của một khu vực.
 * Màn hình cùng sectionKey được gom dưới một tiêu đề, giữa các mục có đường kẻ.
 */
const buildZoneChildren = (
  zone: NavZoneGroup,
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

type ActiveMatch = { entryKey: string; item: NavZoneItem };

export const AppSider: FC<RefineThemedLayoutV2SiderProps> = ({
  Title: TitleComponent,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { can } = useCanWithoutCache();
  const currentUser = useCurrentUser();
  const { logoutUser, isLoading: isLoggingOut } = useLogoutUser();
  const tenantSwitch = useSwitchTenant();

  // Kiểm tra cờ tính năng AI GAP để hiển thị nút AI agent ở footer
  const aiFeatures = useAiFeatures();
  const isAiAvailable = useMemo(() => {
    const devForce =
      typeof window !== "undefined" &&
      window.localStorage?.getItem("logistics_force_ai_gap") === "true";
    return Boolean(aiFeatures.enabled || devForce || (import.meta.env.DEV && !aiFeatures.isError));
  }, [aiFeatures.enabled, aiFeatures.isError]);

  const [allowedKeys, setAllowedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );

  // Quản lý trạng thái mở submenu để tự động ẩn tooltip khi menu nổi đang hiển thị
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const submenuTriggerRef = useRef<HTMLElement | null>(null);

  // Gom mọi chức năng (trong khu vực và mục lẻ) để kiểm tra quyền một lượt
  const allNavItems = useMemo(
    () =>
      NAV_ZONES.flatMap((entry) => (isZoneGroup(entry) ? entry.items : [entry])),
    [],
  );

  // Kiểm tra quyền hạn bất đồng bộ cho từng chức năng
  useEffect(() => {
    let active = true;

    void Promise.allSettled(
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
          results.flatMap((result) => result.status === "fulfilled" && result.value.allowed ? [result.value.key] : []),
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

  // Lọc theo quyền: khu vực hết chức năng thì ẩn luôn, mục lẻ không có quyền thì ẩn
  const visibleEntries = useMemo(() => {
    const result: NavZone[] = [];
    for (const entry of NAV_ZONES) {
      if (isZoneGroup(entry)) {
        const items = entry.items.filter((item) => allowedKeys.has(item.key));
        if (items.length > 0) {
          result.push({ ...entry, items });
        }
      } else if (allowedKeys.has(entry.key)) {
        result.push(entry);
      }
    }
    return result;
  }, [allowedKeys]);

  // Xác định mục đang active (route dài nhất khớp pathname) và mục cha chứa nó
  const activeMatch = useMemo(() => {
    let best: ActiveMatch | undefined;
    for (const entry of visibleEntries) {
      const items = isZoneGroup(entry) ? entry.items : [entry];
      for (const item of items) {
        const matches =
          pathname === item.route || pathname.startsWith(item.route + "/");
        if (matches && (!best || item.route.length > best.item.route.length)) {
          best = { entryKey: entry.key, item };
        }
      }
    }
    return best;
  }, [visibleEntries, pathname]);

  const activeEntryKey = activeMatch?.entryKey;

  // Dựng menu items: khu vực có submenu nổi, mục lẻ là leaf bấm sang trang luôn.
  // Khu vực bọc icon bằng Tooltip (ẩn khi submenu đang mở); mục lẻ dùng tooltip mặc định
  // của antd khi Menu đang inlineCollapsed.
  const menuItems: MenuItems = useMemo(() => {
    return visibleEntries.map((entry) => {
      const isActive = activeEntryKey === entry.key;
      const title = t(entry.labelKey);
      const className = isActive ? "app-sider__zone--active" : undefined;

      if (!isZoneGroup(entry)) {
        return {
          key: entry.key,
          className,
          icon: (
            <span
              className="app-sider__icon-wrapper"
              aria-label={title}
              {...(isActive ? { "aria-current": "page" } : {})}
            >
              {entry.icon}
            </span>
          ),
          label: title,
          onClick: () => {
            setOpenKeys([]);
            navigate(entry.route);
          },
        };
      }

      const isSubmenuOpen = openKeys.includes(entry.key);

      return {
        key: entry.key,
        className,
        popupClassName: "app-sider-popup",
        icon: (
          <Tooltip
            placement="right"
            title={title}
            open={isSubmenuOpen ? false : undefined}
          >
            <span
              className="app-sider__icon-wrapper"
              aria-label={title}
              {...(isActive ? { "aria-current": "page" } : {})}
            >
              {entry.icon}
            </span>
          </Tooltip>
        ),
        label: title,
        children: buildZoneChildren(entry, t, navigate),
      };
    });
  }, [visibleEntries, activeEntryKey, openKeys, t, navigate]);

  const renderContent = () => (
    <div className="app-sider__content app-sider__content--compact">
      {/* 1. Logo thương hiệu trên cùng: Chỉ hiển thị nhận diện, không phải nút AI chat */}
      <div className="app-sider__logo">
        <div className="app-sider__brand">
          {TitleComponent ? (
            <TitleComponent collapsed />
          ) : (
            <AppTitle collapsed />
          )}
        </div>
      </div>

      {/* 2. Cột icon liên tục (khu vực + mục lẻ) và thông báo, cuộn độc lập ẩn scrollbar */}
      <nav className="app-sider__navigation" aria-label={t("navigation.drawerTitle")}>
        <Menu
          className="app-sider__menu"
          inlineCollapsed
          items={menuItems}
          mode="inline"
          openKeys={openKeys}
          onOpenChange={(nextKeys) => {
            const nextOpenKeys = nextKeys as string[];
            if (nextOpenKeys.length > openKeys.length && document.activeElement instanceof HTMLElement) {
              submenuTriggerRef.current = document.activeElement;
            } else if (nextOpenKeys.length < openKeys.length && submenuTriggerRef.current) {
              window.setTimeout(() => submenuTriggerRef.current?.focus(), 0);
            }
            setOpenKeys(nextOpenKeys);
          }}
          selectedKeys={activeMatch ? [activeMatch.item.key] : []}
          theme="light"
          triggerSubMenuAction="click"
        />
        <div className="app-sider__notifications">
          <NotificationHeaderIcon placement="rightTop" />
        </div>
      </nav>

      {/* 3. Cụm tiện ích ghim ở đáy: nút AI Agent, Avatar tài khoản */}
      <div className="app-sider__footer">
        {isAiAvailable && (
          <Tooltip placement="right" title={t("navigation.aiAssistant")}>
            <button
              type="button"
              className="app-sider__ai-agent-btn"
              data-testid="app-sider-ai-agent-button"
              aria-label={t("navigation.openAiAssistant")}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("toggle-ai-gap-chat"));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("toggle-ai-gap-chat"));
                }
              }}
            >
              <AiAgentNavIcon size={18} strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        <Dropdown
          placement="topLeft"
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "change-tenant",
                icon: <SwitchTenantNavIcon size={16} strokeWidth={1.5} />,
                label: <span>{t("common.changeTenant")}</span>,
                disabled: tenantSwitch.isLoading,
                onClick: () => void tenantSwitch.switchTenant(),
              },
              {
                key: "logout",
                icon: <LogoutNavIcon size={16} strokeWidth={1.5} />,
                label: <span>{t("common.logout")}</span>,
                disabled: isLoggingOut,
                onClick: () => void logoutUser(),
              },
            ],
          }}
        >
          <Button
            className="app-sider__account"
            type="text"
            aria-label={t("navigation.accountMenu")}
          >
            <Avatar size={32} src={currentUser.data?.avatar}>
              {currentUser.data?.name?.charAt(0)}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </div>
  );

  return (
    <Layout.Sider
      className="app-sider"
      collapsed
      collapsedWidth={64}
      theme="light"
      trigger={null}
      width={64}
    >
      {renderContent()}
    </Layout.Sider>
  );
};
