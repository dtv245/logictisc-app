/**
 * Layout wrapper của ứng dụng, dựa trên Refine ThemedLayoutV2.
 */

import { ThemedLayoutV2, useThemedLayoutContext } from "@refinedev/antd";
import { Button } from "antd";
import { Menu as MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";

import { AppSider } from "./AppSider";
import { AppTitle } from "./AppTitle";
import { AiGapChatWidget } from "@/components/ai/AiGapChatWidget";
import "./AppLayout.scss";

export const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <ThemedLayoutV2
        Header={EmptyHeader}
        initialSiderCollapsed={true}
        Sider={AppSider}
        Title={AppTitle}
      >
        <main className="app-content" id="main-content" role="main">
          <MobileMenuTrigger />
          <div className="app-route-transition" key={pathname}>
            <Outlet />
          </div>
          <AiGapChatWidget />
        </main>
      </ThemedLayoutV2>
    </div>
  );
};

function MobileMenuTrigger() {
  const { t } = useTranslation();
  const { mobileSiderOpen, setMobileSiderOpen } = useThemedLayoutContext();

  return (
    <Button
      aria-controls="app-sider-mobile-drawer"
      aria-expanded={mobileSiderOpen}
      aria-label={t("navigation.drawerTitle")}
      className="app-mobile-menu-trigger"
      icon={<MenuIcon aria-hidden="true" size={20} />}
      onClick={() => setMobileSiderOpen(true)}
      type="text"
    />
  );
}

// Refine sẽ tự dựng header mặc định nếu không truyền component thay thế.
const EmptyHeader = () => null;
