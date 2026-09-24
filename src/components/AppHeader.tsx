/**
 * Hiển thị thanh chuyển trang (Select navigation), tenant selector và user identity trong header.
 */

import { DownOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { useCanWithoutCache, useMenu } from "@refinedev/core";
import { Avatar, Dropdown, Flex, Layout, Select, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { APP_NAV_ITEMS } from "./appNavigation";
import { useApiError } from "../hooks/useApiError";
import { useCurrentTenant } from "../hooks/useCurrentTenant";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLogoutUser } from "../hooks/useLogoutUser";
import { useSwitchTenant } from "../hooks/useSwitchTenant";
import { useTenantList } from "../hooks/useTenantList";
import { AppTitle } from "./AppTitle";
import { NotificationHeaderIcon } from "@features/notifications/components/NotificationHeaderIcon";

type RefineMenuItem = ReturnType<typeof useMenu>["menuItems"][number];

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

export const AppHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const currentUser = useCurrentUser();
  const { tenant } = useCurrentTenant();
  const { tenants } = useTenantList();
  const tenantSwitch = useSwitchTenant();
  const { logoutUser } = useLogoutUser();
  const { showApiError } = useApiError();

  const { can } = useCanWithoutCache();
  const { menuItems, selectedKey } = useMenu();
  const [allowedResources, setAllowedResources] = useState<ReadonlySet<string>>(
    new Set(),
  );

  // Memo hoá là bắt buộc, không chỉ để tối ưu: `menuItems` là cây lồng nhau nên
  // `collectMenuItems` luôn trả về mảng mới, mà effect bên dưới lại phụ thuộc chính
  // mảng đó — không memo thì effect chạy lại mỗi render và bắn lại toàn bộ request
  // `can()` theo vòng lặp.
  const flattenedItems = useMemo(
    () => collectMenuItems(menuItems),
    [menuItems],
  );

  // Effect hợp lệ theo rule 6.1: `can()` là request thủ công không do query library
  // quản lý (`useCanWithoutCache` cố ý bỏ cache để đổi tenant là kiểm tra lại), nên
  // không thể tính trong lúc render.
  //
  // Cờ `active` chặn setState sau khi unmount và chặn kết quả của lần chạy cũ ghi đè
  // kết quả mới khi `flattenedItems` đổi giữa hai lần await.
  useEffect(() => {
    let active = true;

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
  }, [can, flattenedItems]);

  // Memo hoá vì antd Select so sánh `options` theo reference: tạo mảng mới mỗi render
  // sẽ khiến dropdown dựng lại toàn bộ item dù dữ liệu không đổi.
  //
  // `item.label` ở đây đã là bản dịch, không phải chuỗi cứng trong `*.resource.ts`:
  // `createFoundationResources` (`pages/resourceRegistry.ts:103`) ghi đè `meta.label`
  // bằng `translate(\`resources.${name}\`)` trước khi đưa vào `<Refine resources>`.
  const navOptions = useMemo(() => {
    // Hai màn hình dashboard đứng trước danh sách resource: chúng là điểm vào
    // thường dùng nhất, và không phụ thuộc access control của resource nào.
    const appItems = APP_NAV_ITEMS.map((item) => ({
      value: item.key,
      label: (
        <Space size="small">
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </Space>
      ),
    }));

    const resourceItems = flattenedItems
      .filter(
        (item) => item.name !== "notifications" && allowedResources.has(item.name),
      )
      .map((item) => ({
        value: item.key,
        label: (
          <Space size="small">
            {item.icon ?? <UnorderedListOutlined />}
            <span>{typeof item.label === "string" ? item.label : item.name}</span>
          </Space>
        ),
      }));

    return [...appItems, ...resourceItems];
  }, [flattenedItems, allowedResources, t]);

  const handleNavigationChange = (value: string) => {
    const appItem = APP_NAV_ITEMS.find((item) => item.key === value);
    if (appItem) {
      navigate(appItem.route);
      return;
    }

    const targetItem = flattenedItems.find(
      (item) => item.key === value || item.route === value || item.name === value,
    );
    if (targetItem?.route) {
      navigate(targetItem.route);
    }
  };

  const handleTenantChange = (tenantKey: string) => {
    if (tenantKey !== tenant?.tenantKey) {
      void tenantSwitch.switchTenant().catch(showApiError);
    }
  };

  // `Select` cần `value` khớp một trong `options`; `selectedKey` của Refine có thể
  // trỏ tới resource đã bị lọc khỏi nav vì thiếu quyền, khi đó phải trả `undefined`
  // để Select hiện placeholder thay vì một giá trị không có trong danh sách.
  const activeNavValue = useMemo(() => {
    // `selectedKey` của Refine chỉ biết resource, nên hai màn hình dashboard
    // phải tự đối chiếu theo pathname, nếu không Select sẽ trống khi đang ở
    // chính chúng.
    const appItem = APP_NAV_ITEMS.find((item) => item.route === pathname);
    if (appItem) {
      return appItem.key;
    }
    if (selectedKey && navOptions.some((opt) => opt.value === selectedKey)) {
      return selectedKey;
    }
    return undefined;
  }, [navOptions, pathname, selectedKey]);

  return (
    <Layout.Header className="app-header">
      <Flex align="center" gap="middle">
        <AppTitle collapsed={false} />
        <Select
          aria-label={t("common.navigate")}
          onChange={handleNavigationChange}
          options={navOptions}
          placeholder={t("common.navigatePlaceholder")}
          style={{ minWidth: 220 }}
          value={activeNavValue}
        />
      </Flex>
      <Flex align="center" gap="middle">
        <Select
          aria-label={t("tenant.currentLabel")}
          loading={tenantSwitch.isLoading}
          onChange={handleTenantChange}
          options={tenants.map((item) => ({
            label: item.tenantName,
            value: item.tenantKey,
          }))}
          value={tenant?.tenantKey}
        />
        <NotificationHeaderIcon />
        <Dropdown
          menu={{
            items: [
              {
                key: "change-tenant",
                label: t("common.changeTenant"),
                onClick: () => void tenantSwitch.switchTenant(),
              },
              {
                key: "logout",
                label: t("common.logout"),
                onClick: () => void logoutUser(),
              },
            ],
          }}
        >
          <Flex align="center" className="user-menu" gap="small">
            <Avatar src={currentUser.data?.avatar}>
              {currentUser.data?.name?.charAt(0)}
            </Avatar>
            <Space size="small">
              <Typography.Text>{currentUser.data?.name}</Typography.Text>
              <DownOutlined />
            </Space>
          </Flex>
        </Dropdown>
      </Flex>
    </Layout.Header>
  );
};
