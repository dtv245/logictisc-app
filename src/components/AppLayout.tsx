/**
 * Layout wrapper của ứng dụng, dựa trên Refine ThemedLayoutV2.
 */

import { ThemedLayoutV2 } from "@refinedev/antd";
import { Outlet } from "react-router-dom";

import { AppHeader } from "./AppHeader";
import { AppSider } from "./AppSider";
import { AppTitle } from "./AppTitle";

export const AppLayout = () => (
  <ThemedLayoutV2 Header={AppHeader} Sider={AppSider} Title={AppTitle}>
    <main className="app-content">
      <Outlet />
    </main>
  </ThemedLayoutV2>
);
