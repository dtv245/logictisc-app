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
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  CarOutlined,
  ClockCircleOutlined,
  CodeSandboxOutlined,
  CompassOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  LineChartOutlined,
  RiseOutlined,
  RobotOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { AccessResource } from "@/types/roles.types";

import { routes } from "@constants/routes";
import { PROFILE_CONTRACT_CONFIRMED } from "@/features/profile/profile.contract";
import { EXECUTIVE_CONTRACT_CONFIRMED } from "@/features/executive/executive.contract";

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
    icon: <CarOutlined />,
    key: "app:fleet-report",
    labelKey: "fleet.title",
    route: routes.fleetReport,
    permission: { resource: "fleet-reports", action: "FLEET_REPORT_VIEW" },
  },
  {
    icon: <CarOutlined />,
    key: "app:optimization",
    labelKey: "optimization.title",
    route: routes.optimization,
    permission: { resource: "optimization", action: "OPTIMIZATION_VIEW" },
  },
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
  ...(PROFILE_CONTRACT_CONFIRMED
    ? [
        {
          icon: <UserOutlined />,
          key: "app:profile",
          labelKey: "profile.title",
          route: routes.profile,
        },
      ]
    : []),
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

export interface NavZoneItem {
  icon: React.ReactNode;
  key: string;
  labelKey: string;
  route: string;
  permission?: { resource: AccessResource; action: string };
  resource?: string;
}

export interface NavZone {
  icon: React.ReactNode;
  key: string;
  labelKey: string;
  items: readonly NavZoneItem[];
}

/**
 * Cấu trúc điều hướng thanh Taskbar bên trái:
 * - Hiển thị theo tầng (Zone -> Items)
 * - Phân theo từng khu vực nghiệp vụ Logistics
 * - Phân loại theo chức năng cụ thể
 * - Sắp xếp theo lớp mạch lạc
 */
export const NAV_ZONES: readonly NavZone[] = [
  {
    key: "zone:operations",
    labelKey: "navigation.zones.operations",
    icon: <DashboardOutlined />,
    items: [
      {
        icon: <CompassOutlined />,
        key: "app:operations",
        labelKey: "dashboard.navOperations",
        route: routes.operations,
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
        icon: <RocketOutlined />,
        key: "app:optimization",
        labelKey: "optimization.title",
        route: routes.optimization,
        permission: { resource: "optimization", action: "OPTIMIZATION_VIEW" },
      },
      {
        icon: <LineChartOutlined />,
        key: "app:fleet-report",
        labelKey: "fleet.title",
        route: routes.fleetReport,
        permission: { resource: "fleet-reports", action: "FLEET_REPORT_VIEW" },
      },
    ],
  },
  {
    key: "zone:transport",
    labelKey: "navigation.zones.transport",
    icon: <SendOutlined />,
    items: [
      {
        icon: <RobotOutlined />,
        key: "res:ai-dispatch",
        labelKey: "resources.ai-dispatch",
        route: routes.aiDispatch,
        permission: { resource: "ai-dispatch", action: "AI_DISPATCH_VIEW" },
      },
      {
        icon: <InboxOutlined />,
        key: "res:loads",
        labelKey: "resources.loads",
        route: routes.resources.loads.list,
        resource: "loads",
      },
      {
        icon: <CompassOutlined />,
        key: "res:trips",
        labelKey: "resources.trips",
        route: routes.resources.trips.list,
        resource: "trips",
      },
      {
        icon: <AppstoreOutlined />,
        key: "res:load-board",
        labelKey: "resources.load-board",
        route: routes.resources.loadBoard.list,
        resource: "load-board",
      },
      {
        icon: <EnvironmentOutlined />,
        key: "res:terminals",
        labelKey: "resources.terminals",
        route: routes.resources.terminals.list,
        resource: "terminals",
      },
      {
        icon: <CodeSandboxOutlined />,
        key: "res:containers",
        labelKey: "resources.containers",
        route: routes.resources.containers.list,
        resource: "containers",
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
        labelKey: "resources.trucks",
        route: routes.resources.trucks.list,
        resource: "trucks",
      },
      {
        icon: <ClockCircleOutlined />,
        key: "res:hos-eld",
        labelKey: "resources.hos-eld",
        route: routes.resources.hosEld.list,
        resource: "hos-eld",
      },
      {
        icon: <SafetyCertificateOutlined />,
        key: "res:dvir",
        labelKey: "resources.dvir",
        route: routes.resources.dvir.list,
        resource: "dvir",
      },
      {
        icon: <ToolOutlined />,
        key: "res:maintenance",
        labelKey: "resources.maintenance",
        route: routes.resources.maintenance.list,
        resource: "maintenance",
      },
      {
        icon: <WarningOutlined />,
        key: "res:accidents",
        labelKey: "resources.accidents",
        route: routes.resources.accidents.list,
        resource: "accidents",
      },
    ],
  },
  {
    key: "zone:finance",
    labelKey: "navigation.zones.finance",
    icon: <BankOutlined />,
    items: [
      {
        icon: <AuditOutlined />,
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
      {
        icon: <DollarOutlined />,
        key: "app:payroll",
        labelKey: "payroll.title",
        route: routes.payroll,
        permission: { resource: "payroll", action: "PAYROLL_VIEW" },
      },
      {
        icon: <UserOutlined />,
        key: "app:my-payslips",
        labelKey: "payslips.mine",
        route: routes.myPayslips,
        permission: { resource: "payslips", action: "PAYSLIP_VIEW" },
      },
      {
        icon: <RiseOutlined />,
        key: "app:profitability",
        labelKey: "finance.title",
        route: routes.profitability,
        permission: { resource: "profitability", action: "PROFITABILITY_VIEW" },
      },
      {
        icon: <FileTextOutlined />,
        key: "res:invoices",
        labelKey: "resources.invoices",
        route: routes.resources.invoices.list,
        resource: "invoices",
      },
      {
        icon: <CreditCardOutlined />,
        key: "res:payments",
        labelKey: "resources.payments",
        route: routes.resources.payments.list,
        resource: "payments",
      },
      {
        icon: <CreditCardOutlined />,
        key: "res:expenses",
        labelKey: "resources.expenses",
        route: routes.resources.expenses.list,
        resource: "expenses",
      },
    ],
  },
  {
    key: "zone:partners",
    labelKey: "navigation.zones.partners",
    icon: <ShopOutlined />,
    items: [
      {
        icon: <TeamOutlined />,
        key: "res:customers",
        labelKey: "resources.customers",
        route: routes.resources.customers.list,
        resource: "customers",
      },
      {
        icon: <ShopOutlined />,
        key: "res:products",
        labelKey: "resources.products",
        route: routes.resources.products.list,
        resource: "products",
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
        labelKey: "resources.employees",
        route: routes.resources.employees.list,
        resource: "employees",
      },
      {
        icon: <FolderOpenOutlined />,
        key: "res:documents",
        labelKey: "resources.documents",
        route: routes.resources.documents.list,
        resource: "documents",
      },
      ...(PROFILE_CONTRACT_CONFIRMED
        ? [
            {
              icon: <UserOutlined />,
              key: "app:profile",
              labelKey: "profile.title",
              route: routes.profile,
            },
          ]
        : []),
    ],
  },
];
