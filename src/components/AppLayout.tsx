/**
 * Layout wrapper của ứng dụng, dựa trên Refine ThemedLayoutV2.
 */

import { ThemedLayoutV2 } from "@refinedev/antd";
import { Outlet } from "react-router-dom";

import { AppSider } from "./AppSider";
import { AppTitle } from "./AppTitle";
import { AiGapChatWidget } from "@/components/ai/AiGapChatWidget";
import "./AppLayout.scss";

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <ThemedLayoutV2
        Header={EmptyHeader}
        initialSiderCollapsed={true}
        Sider={AppSider}
        Title={AppTitle}
      >
        <main className="app-content" id="main-content" role="main">
          <Outlet />
          <AiGapChatWidget />
        </main>
      </ThemedLayoutV2>
    </div>
  );
};

// Refine sẽ tự dựng header mặc định nếu không truyền component thay thế.
const EmptyHeader = () => null;
