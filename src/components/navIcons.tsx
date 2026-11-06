/**
 * navIcons.tsx — Ánh xạ bộ icon chuẩn cho toàn bộ thanh điều hướng AppSider.
 * Sử dụng một họ icon duy nhất (lucide-react) với kích thước mặc định 20×20px,
 * nét strokeWidth 1.75, màu currentColor, căn chỉnh block không co giãn.
 */

import React from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeDollarSign,
  Banknote,
  Bell,
  Bot,
  Box,
  Building2,
  Calculator,
  CalendarClock,
  CircleUser,
  ClipboardCheck,
  Clock,
  CreditCard,
  Ellipsis,
  FolderOpen,
  HandCoins,
  IdCard,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  LogOut,
  MapPinned,
  Monitor,
  Package,
  Receipt,
  ReceiptText,
  Repeat2,
  Rocket,
  Route,
  ScrollText,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  UserCog,
  Wallet,
  Warehouse,
  Workflow,
  Wrench,
  type LucideProps,
} from "lucide-react";

const createIcon = (IconComponent: React.ComponentType<LucideProps>) => {
  return function NavIcon({ style, ...props }: LucideProps) {
    return (
      <IconComponent
        aria-hidden="true"
        color="currentColor"
        size={20}
        strokeWidth={1.75}
        style={{ display: "block", flexShrink: 0, ...style }}
        {...props}
      />
    );
  };
};

// 1. Icon Khu vực (Rail zones)
export const OperationsZoneIcon = createIcon(LayoutGrid);
export const TransportZoneIcon = createIcon(Send);
export const FleetZoneIcon = createIcon(Truck);
export const PartnersZoneIcon = createIcon(Building2);
export const FinanceZoneIcon = createIcon(Wallet);
export const PayrollZoneIcon = createIcon(Banknote);
export const AdminZoneIcon = createIcon(Settings);
export const MoreNavIcon = createIcon(Ellipsis);

// 2. Icon Tiện ích & Hồ sơ
export const NotificationNavIcon = createIcon(Bell);
export const AiAgentNavIcon = createIcon(Sparkles);
export const SettingsNavIcon = createIcon(Settings);
export const LogoutNavIcon = createIcon(LogOut);
export const SwitchTenantNavIcon = createIcon(Repeat2);

// 3. Icon từng chức năng trên Rail & Menu nổi (Flyout menu)
// Nhóm Điều hành & AI TMS
export const OperationsMonitorIcon = createIcon(Monitor);
export const OperationsDashboardIcon = createIcon(LayoutDashboard);
export const TmsFlowNavIcon = createIcon(Workflow);
export const TmsDispatchNavIcon = createIcon(Route);
export const TmsApprovalsNavIcon = createIcon(ClipboardCheck);
export const AiDispatchNavIcon = createIcon(Bot);
export const OptimizationNavIcon = createIcon(Rocket);

// Nhóm Vận tải (Transport)
export const LoadBoardNavIcon = createIcon(Kanban);
export const LoadsNavIcon = createIcon(Package);
export const TripsNavIcon = createIcon(MapPinned);
export const ContainersNavIcon = createIcon(Box);
export const TerminalsNavIcon = createIcon(Warehouse);

// Nhóm Đội xe & Tài xế (Fleet & Drivers)
export const TrucksNavIcon = createIcon(Truck);
export const DriversNavIcon = createIcon(IdCard);
export const DriverExpiringNavIcon = createIcon(CalendarClock);
export const MyDriverProfileNavIcon = createIcon(CircleUser);
export const MaintenanceNavIcon = createIcon(Wrench);
export const HosEldNavIcon = createIcon(Clock);
export const DvirNavIcon = createIcon(ClipboardCheck);
export const AccidentsNavIcon = createIcon(AlertTriangle);
export const FleetReportNavIcon = createIcon(LineChart);

// Nhóm Đối tác (Partners)
export const CustomersNavIcon = createIcon(Building2);
export const ProductsNavIcon = createIcon(ShoppingBag);

// Khu vực Tài chính (Finance)
export const InvoicesNavIcon = createIcon(Receipt);
export const PaymentsNavIcon = createIcon(CreditCard);
export const ExpensesNavIcon = createIcon(BadgeDollarSign);
export const ProfitabilityNavIcon = createIcon(TrendingUp);

// Khu vực Lương (Payroll)
export const SettlementsNavIcon = createIcon(HandCoins);
export const PayPoliciesNavIcon = createIcon(ScrollText);
export const PayrollNavIcon = createIcon(Calculator);
export const PayrollReconciliationNavIcon = createIcon(ArrowLeftRight);
export const MyPayslipsNavIcon = createIcon(ReceiptText);

// Nhóm Quản trị & Tài liệu (Admin & Documents)
export const EmployeesNavIcon = createIcon(UserCog);
export const DocumentsNavIcon = createIcon(FolderOpen);
