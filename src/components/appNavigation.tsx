/**
 * Điểm đến cấp ứng dụng, không phải resource của Refine.
 *
 * `useMenu` chỉ dựng mục từ `<Refine resources>`, nên hai màn hình dashboard —
 * vốn không phải CRUD resource — sẽ không bao giờ tự xuất hiện trong Select
 * điều hướng. Khai báo tường minh ở đây thay vì nhồi chúng thành resource giả:
 * resource giả sẽ lọt vào `resourcePageRoutes`, vào access control và vào cả
 * menu.
 *
 * Tách khỏi `AppHeader.tsx` vì file đó chỉ được export component — trộn hằng
 * số vào sẽ phá Fast Refresh.
 */

import { CarOutlined, DashboardOutlined } from "@ant-design/icons";

import { routes } from "@constants/routes";

export interface AppNavItem {
  icon: React.ReactNode;
  key: string;
  /** Locale key của nhãn hiển thị. */
  labelKey: string;
  route: string;
}

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    icon: <DashboardOutlined />,
    key: "app:dashboard",
    labelKey: "dashboard.navExecutive",
    route: routes.dashboard,
  },
  {
    icon: <CarOutlined />,
    key: "app:operations",
    labelKey: "dashboard.navOperations",
    route: routes.operations,
  },
];
