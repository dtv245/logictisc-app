/* eslint-disable react-refresh/only-export-components */
/**
 * Điểm đến cấp ứng dụng và cấu trúc phân vùng điều hướng (Taskbar Sider Navigation).
 *
 * `useMenu` chỉ dựng mục từ `<Refine resources>`, nên hai màn hình dashboard —
 * vốn không phải CRUD resource — sẽ không bao giờ tự xuất hiện trong Select
 * điều hướng. Khai báo tường minh ở đây thay vì nhồi chúng thành resource giả.
 *
 * Cung cấp:
 * 1. `APP_NAV_ITEMS` & `visibleAppNavItems` cho Header dropdown.
 * 2. `NAV_ZONES` phân tầng, phân khu và phân loại chức năng cho thanh Taskbar bên trái (AppSider).
 */

import {
  BankOutlined,
  CarOutlined,
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { AccessResource } from "@/types/roles.types";

import { routes } from "@constants/routes";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/config/executive.contract";

export interface AppNavItem {
  icon: React.ReactNode;
  key: string;
  /** Locale key của nhãn hiển thị. */
  labelKey: string;
  route: string;
  permission?: { resource: AccessResource; action: string };
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    icon: <UserOutlined />,
    key: "app:my-payslips",
    labelKey: "payslips.mine",
    route: routes.myPayslips,
    permission: { resource: "payslips", action: "PAYSLIP_VIEW" },
  },
  {
    icon: <BankOutlined />,
    key: "app:payroll",
    labelKey: "payroll.title",
    route: routes.payroll,
    permission: { resource: "payroll", action: "PAYROLL_VIEW" },
  },
  ...(EXECUTIVE_CONTRACT_CONFIRMED
    ? [
        {
          icon: <DashboardOutlined />,
          key: "app:dashboard",
          labelKey: "dashboard.navExecutive",
          route: routes.dashboard,
        },
      ]
    : []),
  {
    icon: <CarOutlined />,
    key: "app:operations",
    labelKey: "dashboard.navOperations",
    route: routes.operations,
  },
  {
    icon: <BankOutlined />,
    key: "app:profitability",
    labelKey: "finance.title",
    route: routes.profitability,
    permission: { resource: "profitability", action: "PROFITABILITY_VIEW" },
  },
  {
    icon: <BankOutlined />,
    key: "app:settlements",
    labelKey: "settlements.title",
    route: routes.resources.settlements.list,
    permission: { resource: "settlements", action: "SETTLEMENT_VIEW" },
  },
  {
    icon: <SettingOutlined />,
    key: "app:pay-policies",
    labelKey: "settlements.driverPayPoliciesTitle",
    route: routes.resources.settlements.policies,
    permission: { resource: "driver-pay-policies", action: "POLICY_VIEW" },
  },
];

export const visibleAppNavItems = (
  allowedKeys: ReadonlySet<string>,
): readonly AppNavItem[] =>
  APP_NAV_ITEMS.filter((item) => !item.permission || allowedKeys.has(item.key));

export {
  NAV_ZONES,
  type NavZone,
  type NavZoneItem,
} from "./AppSider";
