/* eslint-disable react-refresh/only-export-components */
/**
 * AppSider — Thanh điều hướng bên trái dạng Icon Rail (64px) hiện đại, phẳng theo thiết kế hệ thống.
 *
 * Cấu trúc từ trên xuống (tất cả căn chính giữa theo trục ngang 32px của rail 64px):
 *   1. Logo thương hiệu: Ô vuông 40×40px bo góc 12px nền đen, dấu thương hiệu trắng.
 *   2. Cột icon điều hướng: MỘT cột liên tục (vùng bấm 44×44px, bo góc 12px, cách nhau 4px,
 *      icon 20×20px stroke 1.75), dùng một Menu duy nhất để phím mũi tên đi liền qua toàn cột:
 *        - Khu vực (Tài chính, Lương): bấm mở menu nổi (.app-sider-popup) chứa các màn hình con.
 *        - Mục lẻ (năm màn TMS đầu gồm Tổng quan, Điều phối, Duyệt AI, Theo dõi xe, Tối ưu tuyến;
 *          tiếp theo là Đơn hàng, Chuyến, Bến bãi, Xe, Khách hàng, Tài xế, Tài xế sắp hết hạn,
 *          Hồ sơ tài xế của tôi, Tài liệu): bấm là chuyển trang trực tiếp.
 *   3. Tiện ích thông báo: Chuông thông báo (khung 44×44px, bo 12px, icon 20×20px) kèm badge đỏ
 *      ở góc trên phải (top: 4px, right: 4px), đặt ngoài vùng cuộn để không bị cắt.
 *   4. Cụm tiện ích & hồ sơ ghim ở đáy:
 *      - Nút Trợ lý AI: Vùng bấm 44×44px bo 12px, bên trong là vòng tròn nền tối viền tím, icon Sparkles.
 *      - Avatar người dùng: Tròn 32px nằm chính giữa vùng bấm 44×44px, mở menu tài khoản
 *        (Cài đặt, Đổi công ty, Đăng xuất).
 *
 * Thứ tự theo đúng NAV_ZONES, sắp xếp theo luồng công việc thực tế:
 *   Tổng quan -> Điều phối -> Duyệt AI -> Theo dõi xe -> Tối ưu tuyến -> Đơn hàng -> Chuyến ->
 *   Bến bãi -> Xe -> Khách hàng -> Tài chính -> Lương -> Tài xế -> Tài xế sắp hết hạn ->
 *   Hồ sơ tài xế của tôi -> Tài liệu.
 */

import {
  useThemedLayoutContext,
  type RefineThemedLayoutV2SiderProps,
} from "@refinedev/antd";
import { useCanWithoutCache } from "@refinedev/core";
import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Tooltip,
  type MenuProps,
} from "antd";
import type { TFunction } from "i18next";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogoutUser } from "@/hooks/useLogoutUser";
import { useSwitchTenant } from "@/hooks/useSwitchTenant";
import { NotificationHeaderIcon } from "@features/notifications/components/NotificationHeaderIcon";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/api/payroll.api";
import type { AccessResource } from "@/types/roles.types";
import { routes } from "@constants/routes";
import { driverProfileRoutes } from "@/constants/driverProfileRoutes";
import { AppTitle } from "./AppTitle";
import {
  CustomersNavIcon,
  DocumentsNavIcon,
  DriverExpiringNavIcon,
  DriversNavIcon,
  FinanceZoneIcon,
  InvoicesNavIcon,
  LoadsNavIcon,
  LogoutNavIcon,
  MoreNavIcon,
  MyDriverProfileNavIcon,
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
  SettingsNavIcon,
  SettlementsNavIcon,
  SwitchTenantNavIcon,
  TerminalsNavIcon,
  TmsApprovalsNavIcon,
  TmsDispatchNavIcon,
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
  /** Route pattern used to keep legacy resource pages associated with this item. */
  activeRoute?: string;
  /** Resource của Refine — kiểm tra quyền "list". */
  resource?: string;
  /** Quyền chi tiết — được ưu tiên hơn `resource`. */
  permission?: NavPermission;
  /** Một số route lồng nhau cần cả quyền của cha và quyền riêng của màn hình. */
  permissions?: readonly NavPermission[];
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

const TOOLTIP_ENTER_DELAY = 0.15;
const OVERFLOW_ZONE_KEY = "zone:overflow-more";
/** Số lượng chức năng chính ưu tiên hiển thị trực tiếp ở phía trên rail. */
const PRIMARY_RAIL_COUNT = 9;

export const NAV_ZONES: readonly NavZone[] = [
  // ── 1. Điều hướng TMS chính ────────────────────────────────────────
  {
    icon: <OperationsDashboardIcon />,
    key: "app:tms-dashboard",
    labelKey: "navigation.items.tms-flow",
    route: routes.tmsFlow.root,
    permission: { resource: "loads", action: "list" },
  },
  {
    icon: <TmsDispatchNavIcon />,
    key: "app:tms-dispatch",
    labelKey: "navigation.items.tms-dispatch",
    route: routes.tmsFlow.dispatch,
    permission: { resource: "loads", action: "list" },
  },
  {
    icon: <TmsApprovalsNavIcon />,
    key: "app:tms-approvals",
    labelKey: "navigation.items.tms-approvals",
    route: routes.tmsFlow.approvals,
    permission: { resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" },
    permissions: [{ resource: "loads", action: "list" }],
  },
  {
    icon: <OperationsMonitorIcon />,
    key: "app:tms-live-tracking",
    labelKey: "navigation.items.tms-live-tracking",
    route: routes.tmsFlow.liveTracking,
    permission: { resource: "loads", action: "list" },
  },
  {
    icon: <OptimizationNavIcon />,
    key: "app:optimization",
    labelKey: "navigation.items.optimization",
    route: routes.optimization,
    permission: { resource: "optimization", action: "OPTIMIZATION_VIEW" },
  },

  // ── 2. Chức năng chính khác ────────────────────────────────────────
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
    icon: <TrucksNavIcon />,
    key: "res:trucks",
    labelKey: "navigation.items.trucks",
    route: routes.resources.trucks.list,
    resource: "trucks",
    sectionKey: "vehicles",
  },
  {
    icon: <DriversNavIcon />,
    key: "res:drivers",
    labelKey: "navigation.items.drivers",
    route: routes.resources.drivers.list,
    resource: "drivers",
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
        icon: <InvoicesNavIcon size={18} />,
        key: "res:invoices",
        labelKey: "navigation.items.invoices",
        route: routes.resources.invoices.list,
        resource: "invoices",
        sectionKey: "cashflow",
      },
      {
        icon: <PaymentsNavIcon size={18} />,
        key: "res:payments",
        labelKey: "navigation.items.payments",
        route: routes.resources.payments.list,
        resource: "payments",
        sectionKey: "cashflow",
      },
      {
        icon: <ProfitabilityNavIcon size={18} />,
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
        icon: <SettlementsNavIcon size={18} />,
        key: "app:settlements",
        labelKey: "navigation.items.settlements",
        route: routes.resources.settlements.list,
        permission: { resource: "settlements", action: "SETTLEMENT_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <PayPoliciesNavIcon size={18} />,
        key: "app:pay-policies",
        labelKey: "navigation.items.pay-policies",
        route: routes.resources.settlements.policies,
        permission: { resource: "driver-pay-policies", action: "POLICY_VIEW" },
        sectionKey: "settlement",
      },
      {
        icon: <PayrollNavIcon size={18} />,
        key: "app:payroll",
        labelKey: "navigation.items.payroll",
        route: routes.payroll,
        permission: { resource: "payroll", action: "PAYROLL_VIEW" },
        sectionKey: "payroll-run",
      },
      ...(PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED
        ? ([
            {
              icon: <PayrollReconciliationNavIcon size={18} />,
              key: "app:payroll-reconciliation",
              labelKey: "navigation.items.payroll-reconciliation",
              route: routes.payrollReconciliation,
              permission: { resource: "payroll", action: "PAYROLL_VIEW" },
              sectionKey: "payroll-run",
            },
          ] satisfies readonly NavZoneItem[])
        : []),
      {
        icon: <MyPayslipsNavIcon size={18} />,
        key: "app:my-payslips",
        labelKey: "navigation.items.my-payslips",
        route: routes.myPayslips,
        permission: { resource: "payslips", action: "PAYSLIP_VIEW" },
        sectionKey: "mine",
      },
    ],
  },

  // ── 3. Chức năng phụ (tự gom vào menu mở rộng khi rail dài) ────────
  {
    icon: <TerminalsNavIcon />,
    key: "res:terminals",
    labelKey: "navigation.items.terminals",
    route: routes.resources.terminals.list,
    resource: "terminals",
    sectionKey: "cargo",
  },
  {
    icon: <DriverExpiringNavIcon />,
    key: "app:driver-expiring",
    labelKey: "navigation.items.driver-expiring",
    route: driverProfileRoutes.expiring,
    permission: { resource: "drivers", action: "list" },
  },
  {
    icon: <MyDriverProfileNavIcon />,
    key: "app:my-driver-profile",
    labelKey: "navigation.items.my-driver-profile",
    route: driverProfileRoutes.myProfile,
    permission: { resource: "drivers", action: "DRIVER_PROFILE_SELF_VIEW" },
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

/** Clone icon React element với kích thước mong muốn (20px trên rail hoặc 18px trong popup). */
const cloneNavIcon = (icon: ReactNode, size: number): ReactNode =>
  isValidElement<{ size?: number }>(icon)
    ? cloneElement(icon, { size })
    : icon;

/**
 * Dựng danh sách màn hình trong menu nổi của một khu vực.
 * Màn hình cùng sectionKey được gom dưới một tiêu đề, giữa các mục có đường kẻ.
 */
const buildZoneChildren = (
  zone: NavZoneGroup,
  t: TFunction,
  navigate: (route: string) => void,
  closeMenu: () => void,
): MenuItems => {
  const toLeaf = (item: NavZoneItem) => ({
    key: item.key,
    icon: item.icon,
    label: t(item.labelKey),
    onClick: () => {
      closeMenu();
      navigate(item.route);
    },
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

/**
 * Dựng danh sách các chức năng phụ bị ẩn trong menu nổi mở rộng (`zone:overflow-more`),
 * clone icon của từng mục về kích thước chuẩn 18px của menu nổi.
 */
const buildOverflowChildren = (
  entries: readonly NavZone[],
  t: TFunction,
  navigate: (route: string) => void,
  closeMenu: () => void,
): MenuItems => {
  const items = entries.flatMap((entry) =>
    isZoneGroup(entry) ? entry.items : [entry],
  );
  return items.map((item) => ({
    key: item.key,
    icon: cloneNavIcon(item.icon, 18),
    label: t(item.labelKey),
    onClick: () => {
      closeMenu();
      navigate(item.route);
    },
  }));
};

type ActiveMatch = { entryKey: string; item: NavZoneItem; matchLength: number };

type ScrollMaskState = "none" | "top" | "bottom" | "both";

export const AppSider: FC<RefineThemedLayoutV2SiderProps> = ({
  Title: TitleComponent,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile =
    screens.md === false &&
    typeof window !== "undefined" &&
    window.innerWidth < 768;
  const { mobileSiderOpen, setMobileSiderOpen } = useThemedLayoutContext();
  const closeMobileSider = useCallback(
    () => setMobileSiderOpen(false),
    [setMobileSiderOpen],
  );

  const { can } = useCanWithoutCache();
  const currentUser = useCurrentUser();
  const { logoutUser, isLoading: isLoggingOut } = useLogoutUser();
  const tenantSwitch = useSwitchTenant();

  const [allowedKeys, setAllowedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );

  // Quản lý trạng thái mở submenu để tự động ẩn tooltip khi menu nổi đang hiển thị
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const submenuTriggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const navScrollRef = useRef<HTMLElement | null>(null);
  const [scrollMask, setScrollMask] = useState<ScrollMaskState>("none");
  const [maxRailSlots, setMaxRailSlots] = useState<number>(Infinity);

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
        const requiredPermissions = [
          ...(item.permission ? [item.permission] : []),
          ...(item.permissions ?? []),
        ];
        if (requiredPermissions.length > 0) {
          const results = await Promise.all(
            requiredPermissions.map((permission) =>
              can ? can(permission) : Promise.resolve({ can: true }),
            ),
          );
          return {
            key: item.key,
            allowed: results.every((result) => Boolean(result?.can)),
          };
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
          results.flatMap((result) =>
            result.status === "fulfilled" && result.value.allowed
              ? [result.value.key]
              : [],
          ),
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
        const matchingRoute = [item.route, item.activeRoute]
          .filter((route): route is string => route !== undefined)
          .filter(
            (route) =>
              pathname === route || pathname.startsWith(route + "/"),
          )
          .sort((left, right) => right.length - left.length)[0];
        if (
          matchingRoute &&
          (!best || matchingRoute.length > best.matchLength)
        ) {
          best = { entryKey: entry.key, item, matchLength: matchingRoute.length };
        }
      }
    }
    return best;
  }, [visibleEntries, pathname]);

  const activeEntryKey = activeMatch?.entryKey;

  // Cập nhật số lượng ô hiển thị tối đa trên rail và mask gradient cuộn
  const updateScrollMask = useCallback(() => {
    const contentEl = contentRef.current;
    if (contentEl) {
      const contentHeight = contentEl.clientHeight;
      if (contentHeight <= 0) {
        // Trong môi trường test JSDOM không đo layout thực tế -> hiển thị đầy đủ trên rail
        setMaxRailSlots((prev) => (prev === Infinity ? prev : Infinity));
      } else {
        // Trừ chiều cao cố định của padding dọc (24px), logo (48px), chuông (48px), footer (60px)
        const fixedChromeHeight = 24 + 48 + 48 + 60;
        const availableHeight = Math.max(0, contentHeight - fixedChromeHeight);
        const fitSlots = Math.floor((availableHeight + 4) / 48);
        // Ưu tiên 9 chức năng chính + 1 nút gom chức năng phụ (+N) khi danh sách dài hơn
        const nextMaxSlots = Math.max(
          2,
          Math.min(fitSlots, PRIMARY_RAIL_COUNT + 1),
        );
        setMaxRailSlots((prev) => (prev === nextMaxSlots ? prev : nextMaxSlots));
      }
    }

    const navEl = navScrollRef.current;
    if (!navEl) return;
    const canScrollUp = navEl.scrollTop > 2;
    const canScrollDown =
      navEl.scrollHeight - navEl.clientHeight - navEl.scrollTop > 2;
    const nextMask: ScrollMaskState =
      canScrollUp && canScrollDown
        ? "both"
        : canScrollUp
          ? "top"
          : canScrollDown
            ? "bottom"
            : "none";
    setScrollMask((prev) => (prev === nextMask ? prev : nextMask));
  }, []);

  useEffect(() => {
    updateScrollMask();
    const navEl = navScrollRef.current;
    const contentEl = contentRef.current;
    if (!navEl) return;

    window.addEventListener("resize", updateScrollMask);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollMask())
        : null;
    resizeObserver?.observe(navEl);
    if (contentEl) {
      resizeObserver?.observe(contentEl);
    }

    return () => {
      window.removeEventListener("resize", updateScrollMask);
      resizeObserver?.disconnect();
    };
  }, [updateScrollMask, visibleEntries.length]);

  // Tách danh sách hiển thị trực tiếp trên rail (chức năng chính) và phần tràn (chức năng phụ)
  const { directEntries, overflowEntries } = useMemo(() => {
    if (isMobile || visibleEntries.length <= maxRailSlots) {
      return { directEntries: visibleEntries, overflowEntries: [] as NavZone[] };
    }
    const splitIndex = Math.max(1, maxRailSlots - 1);
    return {
      directEntries: visibleEntries.slice(0, splitIndex),
      overflowEntries: visibleEntries.slice(splitIndex),
    };
  }, [visibleEntries, maxRailSlots, isMobile]);

  // Số lượng chức năng bị ẩn bên trong nút mở rộng
  const hiddenItemCount = useMemo(
    () =>
      overflowEntries.reduce(
        (sum, entry) => sum + (isZoneGroup(entry) ? entry.items.length : 1),
        0,
      ),
    [overflowEntries],
  );

  // Khi đổi route hoặc danh sách mục hiển thị thay đổi, tự động cuộn mục active vào tầm nhìn
  useEffect(() => {
    const navEl = navScrollRef.current;
    if (!navEl || !activeEntryKey) return;
    const activeNode = navEl.querySelector<HTMLElement>(
      '[aria-current="page"], .ant-menu-item-selected, .ant-menu-submenu-selected > .ant-menu-submenu-title',
    );
    const targetItem =
      activeNode?.closest<HTMLElement>(".ant-menu-item, .ant-menu-submenu-title") ??
      activeNode;
    if (targetItem && typeof targetItem.scrollIntoView === "function") {
      targetItem.scrollIntoView({ block: "nearest" });
    }
    updateScrollMask();
  }, [pathname, activeEntryKey, visibleEntries.length, maxRailSlots, updateScrollMask]);

  // Dựng menu items: dùng MỘT nguồn sự thật duy nhất từ `selectedKeys` của Menu
  // (sinh ra `.ant-menu-item-selected` và `.ant-menu-submenu-selected`), kết hợp
  // `aria-current="page"` cho mục active. Khi các chức năng phụ vượt quá chiều cao rail,
  // tự động gom vào nút mở rộng (`zone:overflow-more`) kèm số lượng icon bị ẩn và clone icon.
  const menuItems: MenuItems = useMemo(() => {
    const items: MenuItems = directEntries.map((entry) => {
      const isActive = activeEntryKey === entry.key;
      const title = t(entry.labelKey);

      if (!isZoneGroup(entry)) {
        return {
          key: entry.key,
          title: "",
          icon: (
            <Tooltip
              placement="right"
              mouseEnterDelay={TOOLTIP_ENTER_DELAY}
              title={title}
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
          onClick: () => {
            setOpenKeys([]);
            closeMobileSider();
            navigate(entry.route);
          },
        };
      }

      const isSubmenuOpen = openKeys.includes(entry.key);

      return {
        key: entry.key,
        popupClassName: "app-sider-popup",
        icon: (
          <Tooltip
            placement="right"
            mouseEnterDelay={TOOLTIP_ENTER_DELAY}
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
        children: buildZoneChildren(entry, t, navigate, closeMobileSider),
      };
    });

    if (overflowEntries.length > 0) {
      const isOverflowActive = overflowEntries.some(
        (entry) => entry.key === activeEntryKey,
      );
      const isOverflowOpen = openKeys.includes(OVERFLOW_ZONE_KEY);
      const overflowTitle = t("navigation.moreItems", {
        count: hiddenItemCount,
      });
      // Nếu trang hiện tại nằm trong nhóm bị ẩn -> clone icon của chức năng đó lên nút đại diện
      const overflowTriggerIcon =
        isOverflowActive && activeMatch
          ? cloneNavIcon(activeMatch.item.icon, 20)
          : <MoreNavIcon />;

      items.push({
        key: OVERFLOW_ZONE_KEY,
        popupClassName: "app-sider-popup",
        icon: (
          <Tooltip
            placement="right"
            mouseEnterDelay={TOOLTIP_ENTER_DELAY}
            title={overflowTitle}
            open={isOverflowOpen ? false : undefined}
          >
            <span
              className="app-sider__icon-wrapper app-sider__icon-wrapper--overflow"
              aria-label={overflowTitle}
              {...(isOverflowActive ? { "aria-current": "page" } : {})}
            >
              {overflowTriggerIcon}
              <span
                className="app-sider__overflow-badge"
                data-testid="app-sider-overflow-count"
                aria-hidden="true"
              >
                +{hiddenItemCount}
              </span>
            </span>
          </Tooltip>
        ),
        label: overflowTitle,
        children: buildOverflowChildren(
          overflowEntries,
          t,
          navigate,
          () => {
            setOpenKeys([]);
            closeMobileSider();
          },
        ),
      });
    }

    return items;
  }, [
    directEntries,
    overflowEntries,
    hiddenItemCount,
    activeEntryKey,
    activeMatch,
    openKeys,
    t,
    navigate,
    closeMobileSider,
  ]);

  const navClassName = [
    "app-sider__navigation",
    scrollMask !== "none" ? `app-sider__navigation--mask-${scrollMask}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderContent = (mobile = false) => (
    <div
      ref={mobile ? undefined : contentRef}
      className={`app-sider__content ${mobile ? "app-sider__content--mobile" : "app-sider__content--compact"}`}
    >
      {/* 1. Logo thương hiệu trên cùng: Chỉ hiển thị nhận diện, không phải nút AI chat */}
      <div className="app-sider__logo">
        <div className="app-sider__brand">
          {TitleComponent ? (
            <TitleComponent collapsed={!mobile} />
          ) : (
            <AppTitle collapsed={!mobile} />
          )}
        </div>
      </div>

      {/* 2. Cột icon điều hướng liên tục (khu vực + mục lẻ), cuộn độc lập ẩn scrollbar */}
      <nav
        ref={mobile ? undefined : navScrollRef}
        className={mobile ? "app-sider__navigation app-sider__navigation--mobile" : navClassName}
        aria-label={t("navigation.drawerTitle")}
        onScroll={mobile ? undefined : updateScrollMask}
      >
        <Menu
          className="app-sider__menu"
          inlineCollapsed={!mobile}
          items={menuItems}
          mode="inline"
          openKeys={openKeys}
          onOpenChange={(nextKeys) => {
            const nextOpenKeys = nextKeys as string[];
            if (
              nextOpenKeys.length > openKeys.length &&
              document.activeElement instanceof HTMLElement
            ) {
              submenuTriggerRef.current = document.activeElement;
            } else if (
              nextOpenKeys.length < openKeys.length &&
              submenuTriggerRef.current
            ) {
              window.setTimeout(() => submenuTriggerRef.current?.focus(), 0);
            }
            setOpenKeys(nextOpenKeys);
          }}
          selectedKeys={activeMatch ? [activeMatch.item.key] : []}
          theme="light"
          triggerSubMenuAction="click"
        />
      </nav>

      {/* 3. Chuông thông báo: đặt ngoài vùng cuộn để badge không bao giờ bị cắt */}
      <div className="app-sider__notifications">
        <NotificationHeaderIcon placement="rightTop" />
      </div>

      {/* 4. Avatar tài khoản và tiện ích tài khoản ghim ở đáy */}
      <div className="app-sider__footer">
        <Dropdown
          overlayClassName="app-sider-account-dropdown"
          placement="topLeft"
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "settings",
                icon: <SettingsNavIcon size={18} />,
                label: <span>{t("settings.title")}</span>,
                onClick: () => navigate(routes.settings),
              },
              {
                key: "change-tenant",
                icon: <SwitchTenantNavIcon size={18} />,
                label: <span>{t("common.changeTenant")}</span>,
                disabled: tenantSwitch.isLoading,
                onClick: () => void tenantSwitch.switchTenant(),
              },
              {
                key: "logout",
                icon: <LogoutNavIcon size={18} />,
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
    <>
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
      {isMobile && (
        <Drawer
          className="app-sider-mobile-drawer"
          id="app-sider-mobile-drawer"
          open={mobileSiderOpen}
          onClose={closeMobileSider}
          placement="left"
          width={280}
          closable={false}
          maskClosable
          keyboard
          styles={{ body: { padding: 0, height: "100%" } }}
        >
          {renderContent(true)}
        </Drawer>
      )}
    </>
  );
};
