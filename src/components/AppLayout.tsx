/**
 * Layout wrapper của ứng dụng, dựa trên Refine ThemedLayoutV2.
 */

import { ThemedLayoutV2 } from "@refinedev/antd";
import { Outlet } from "react-router-dom";

import { AppHeader } from "./AppHeader";
import { AppSider } from "./AppSider";
import { AppTitle } from "./AppTitle";
import "./AppLayout.scss";

export const AppLayout = () => {
  const initialCollapsed =
    typeof window !== "undefined" ? window.innerWidth < 992 : false;

  return (
    <ThemedLayoutV2
      Header={AppHeader}
      initialSiderCollapsed={initialCollapsed}
      Sider={AppSider}
      Title={AppTitle}
    >
      <main className="app-content" id="main-content" role="main">
        <Outlet />
      </main>
    </ThemedLayoutV2>
  );
};
