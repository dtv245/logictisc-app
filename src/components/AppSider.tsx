/**
 * Application sider using Ant Design's current `items` API.
 *
 * Refine's bundled sider still renders deprecated `Menu.Item` children. This
 * local implementation keeps Refine menu/access-control behavior while
 * avoiding that compatibility path under React StrictMode.
 */

import {
  BarsOutlined,
  LeftOutlined,
  LogoutOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  useCanWithoutCache,
  useLink,
  useMenu,
} from "@refinedev/core";
import {
  useThemedLayoutContext,
  type RefineThemedLayoutV2SiderProps,
} from "@refinedev/antd";
import {
  Button,
  ConfigProvider,
  Drawer,
  Grid,
  Layout,
  Menu,
  theme,
  type MenuProps,
} from "antd";
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";

import { APP_I18N_NAMESPACE } from "@locales";
import { useLogoutUser } from "../hooks/useLogoutUser";
import { AppTitle } from "./AppTitle";

type RefineMenuItem = ReturnType<typeof useMenu>["menuItems"][number];
type AntMenuItem = NonNullable<MenuProps["items"]>[number];

const collectMenuItems = (
  items: readonly RefineMenuItem[],
): RefineMenuItem[] =>
  items.flatMap((item) => [item, ...collectMenuItems(item.children)]);

const haveSameValues = (
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): boolean =>
  left.size === right.size &&
  [...left].every((value) => right.has(value));

export const AppSider = ({
  Title = AppTitle,
  activeItemDisabled = false,
  fixed = false,
  meta,
}: RefineThemedLayoutV2SiderProps) => {
  const { token } = theme.useToken();
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const direction = useContext(ConfigProvider.ConfigContext).direction;
  const breakpoint = Grid.useBreakpoint();
  const Link = useLink();
  const { can } = useCanWithoutCache();
  const { logoutUser } = useLogoutUser();
  const { defaultOpenKeys, menuItems, selectedKey } = useMenu({ meta });
  const {
    mobileSiderOpen,
    setMobileSiderOpen,
    setSiderCollapsed,
    siderCollapsed,
  } = useThemedLayoutContext();
  const [allowedResources, setAllowedResources] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    let active = true;
    const flattenedItems = collectMenuItems(menuItems);

    void Promise.all(
      flattenedItems.map(async (item) => ({
        allowed:
          !can ||
          (
            await can({
              action: "list",
              params: { resource: item },
              resource: item.name,
            })
          ).can,
        name: item.name,
      })),
    ).then((results) => {
      if (active) {
        const nextAllowedResources = new Set(
          results
            .filter((result) => result.allowed)
            .map((result) => result.name),
        );

        // useMenu có thể trả một array identity mới sau HMR/breakpoint update.
        // Giữ nguyên state reference khi quyền không đổi để không tạo render loop.
        setAllowedResources((currentAllowedResources) =>
          haveSameValues(currentAllowedResources, nextAllowedResources)
            ? currentAllowedResources
            : nextAllowedResources,
        );
      }
    });

    return () => {
      active = false;
    };
  }, [can, menuItems]);

  const items = useMemo(() => {
    const toAntItems = (
      source: readonly RefineMenuItem[],
    ): AntMenuItem[] =>
      source.flatMap((item): AntMenuItem[] => {
        const children = toAntItems(item.children);
        const canAccess = allowedResources.has(item.name);
        const disabled =
          !canAccess || (activeItemDisabled && item.key === selectedKey);
        const label = canAccess && item.route ? (
          <Link to={item.route}>{item.label}</Link>
        ) : (
          item.label
        );

        return [
          {
            children: children.length > 0 ? children : undefined,
            disabled,
            icon: item.icon ?? <UnorderedListOutlined />,
            key: item.key,
            label,
          },
        ];
      });

    return [
      ...toAntItems(menuItems),
      {
        icon: <LogoutOutlined />,
        key: "logout",
        label: t("common.logout"),
      },
    ] satisfies MenuProps["items"];
  }, [
    Link,
    activeItemDisabled,
    allowedResources,
    menuItems,
    selectedKey,
    t,
  ]);

  const menu = (
    <Menu
      defaultOpenKeys={defaultOpenKeys}
      items={items}
      mode="inline"
      onClick={({ key }) => {
        setMobileSiderOpen(false);
        if (key === "logout") {
          void logoutUser();
        }
      }}
      selectedKeys={selectedKey ? [selectedKey] : []}
      style={{
        border: "none",
        height: "calc(100% - 64px)",
        overflow: "auto",
        paddingTop: 8,
      }}
    />
  );
  const title = (collapsed: boolean) => (
    <div
      style={{
        alignItems: "center",
        backgroundColor: token.colorBgElevated,
        display: "flex",
        height: 64,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? 0 : "0 16px",
        width: collapsed ? 80 : 200,
      }}
    >
      <Title collapsed={collapsed} />
    </div>
  );
  const siderStyle: CSSProperties = {
    backgroundColor: token.colorBgContainer,
    borderRight: `1px solid ${token.colorBgElevated}`,
    ...(fixed
      ? { height: "100vh", position: "fixed", top: 0, zIndex: 999 }
      : {}),
  };
  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  if (isMobile) {
    return (
      <>
        <Drawer
          closable={false}
          onClose={() => setMobileSiderOpen(false)}
          open={mobileSiderOpen}
          placement={direction === "rtl" ? "right" : "left"}
          styles={{ body: { padding: 0 } }}
          width={200}
        >
          <Layout.Sider style={{ ...siderStyle, height: "100vh" }}>
            {title(false)}
            {menu}
          </Layout.Sider>
        </Drawer>
        <Button
          icon={<BarsOutlined />}
          onClick={() => setMobileSiderOpen(true)}
          size="large"
          style={{ bottom: 16, position: "fixed", right: 16, zIndex: 1000 }}
        />
      </>
    );
  }

  const CollapseIcon = siderCollapsed
    ? direction === "rtl"
      ? LeftOutlined
      : RightOutlined
    : direction === "rtl"
      ? RightOutlined
      : LeftOutlined;

  return (
    <>
      {fixed ? (
        <div
          style={{
            transition: "all 0.2s",
            width: siderCollapsed ? 80 : 200,
          }}
        />
      ) : null}
      <Layout.Sider
        breakpoint="lg"
        collapsed={siderCollapsed}
        collapsedWidth={80}
        collapsible
        onCollapse={(collapsed, type) => {
          if (type === "clickTrigger") {
            setSiderCollapsed(collapsed);
          }
        }}
        style={siderStyle}
        trigger={
          <Button
            icon={<CollapseIcon />}
            style={{ borderRadius: 0, height: "100%", width: "100%" }}
            type="text"
          />
        }
      >
        {title(siderCollapsed)}
        {menu}
      </Layout.Sider>
    </>
  );
};
