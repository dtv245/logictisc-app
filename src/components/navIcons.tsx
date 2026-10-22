/**
 * navIcons.tsx — Ánh xạ bộ icon chuẩn cho toàn bộ thanh điều hướng AppSider
 * Sử dụng thư viện lucide-react với nét mảnh (strokeWidth 1.5, size 20), màu currentColor.
 */

import React from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Bot,
  Box,
  Building2,
  ClipboardCheck,
  Clock,
  Compass,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  FolderArchive,
  Kanban,
  LayoutGrid,
  LineChart,
  LogOut,
  MapPin,
  Monitor,
  Package,
  Receipt,
  Rocket,
  Scale,
  Send,
  Settings,
  ShoppingBag,
  Sliders,
  Sparkles,
  TrendingUp,
  Truck,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  Workflow,
  Wrench,
  type LucideProps,
} from "lucide-react";

const createIcon = (IconComponent: React.ComponentType<LucideProps>) => {
  return function NavIcon(props: LucideProps) {
    return (
      <IconComponent
        aria-hidden="true"
        color="currentColor"
        size={20}
        strokeWidth={1.5}
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
export const FinanceZoneIcon = createIcon(Receipt);
export const PayrollZoneIcon = createIcon(Wallet);
export const AdminZoneIcon = createIcon(Settings);

// 2. Icon Tiện ích & Hồ sơ
export const NotificationNavIcon = createIcon(Bell);
export const AiAgentNavIcon = createIcon(Sparkles);
export const SettingsNavIcon = createIcon(Settings);
export const LogoutNavIcon = createIcon(LogOut);
export const SwitchTenantNavIcon = createIcon(Building2);

// 3. Icon từng màn hình con (Flyout menu)
// Khu vực Điều hành (Operations)
export const OperationsMonitorIcon = createIcon(Monitor);
export const OperationsDashboardIcon = createIcon(BarChart3);
export const TmsFlowNavIcon = createIcon(Workflow);
export const AiDispatchNavIcon = createIcon(Bot);
export const OptimizationNavIcon = createIcon(Rocket);

// Khu vực Vận tải (Transport)
export const LoadBoardNavIcon = createIcon(Kanban);
export const LoadsNavIcon = createIcon(Package);
export const TripsNavIcon = createIcon(Compass);
export const ContainersNavIcon = createIcon(Box);
export const TerminalsNavIcon = createIcon(MapPin);

// Khu vực Đội xe (Fleet)
export const TrucksNavIcon = createIcon(Truck);
export const MaintenanceNavIcon = createIcon(Wrench);
export const HosEldNavIcon = createIcon(Clock);
export const DvirNavIcon = createIcon(ClipboardCheck);
export const AccidentsNavIcon = createIcon(AlertTriangle);
export const FleetReportNavIcon = createIcon(LineChart);

// Khu vực Đối tác (Partners)
export const CustomersNavIcon = createIcon(Users);
export const ProductsNavIcon = createIcon(ShoppingBag);

// Khu vực Tài chính (Finance)
export const InvoicesNavIcon = createIcon(FileText);
export const PaymentsNavIcon = createIcon(CreditCard);
export const ExpensesNavIcon = createIcon(BadgeDollarSign);
export const ProfitabilityNavIcon = createIcon(TrendingUp);

// Khu vực Lương (Payroll)
export const SettlementsNavIcon = createIcon(FileCheck);
export const PayPoliciesNavIcon = createIcon(Sliders);
export const PayrollNavIcon = createIcon(DollarSign);
export const PayrollReconciliationNavIcon = createIcon(Scale);
export const MyPayslipsNavIcon = createIcon(UserCheck);

// Khu vực Quản trị (Admin)
export const EmployeesNavIcon = createIcon(UserCog);
export const DocumentsNavIcon = createIcon(FolderArchive);
