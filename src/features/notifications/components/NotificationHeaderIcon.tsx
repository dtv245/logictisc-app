/**
 * Icon thông báo hiển thị trên AppHeader với đếm số thông báo, âm thanh và popover xem nhanh.
 */

import { BellOutlined } from "@ant-design/icons";
import { useCan, useList } from "@refinedev/core";
import {
  Alert,
  Spin,
  Badge,
  Button,
  Divider,
  Empty,
  Flex,
  List,
  Popover,
  Space,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { NotificationMarkAllRead } from "./NotificationMarkAllRead";
import { routes } from "@/constants/routes";
import type { Notification } from "@/types/notification.types";
import { playNotificationSound } from "../notificationSound";

export const NotificationHeaderIcon = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "notifications", action: "list" });

  const { data, isLoading, isError, error, refetch, isFetching } = useList<Notification>({
    resource: "notifications",
    pagination: { current: 1, pageSize: 5 },
    queryOptions: {
      refetchInterval: 10000,
      enabled: Boolean(tenant?.tenantKey && access.data?.can),
      queryKey: ["notification-header", tenant?.tenantKey],
    },
  });

  const notifications = useMemo(() => data?.data ?? [], [data?.data]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications],
  );

  const unreadCount = unreadNotifications.length;

  // Giữ số lượng chưa đọc cũ để so sánh và phát âm thanh khi có thông báo mới / có thông báo
  const prevUnreadCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (notifications.length === 0) {
      prevUnreadCountRef.current = 0;
      return;
    }

    if (prevUnreadCountRef.current === null) {
      if (unreadCount > 0) {
        playNotificationSound();
      }
      prevUnreadCountRef.current = unreadCount;
    } else if (unreadCount > prevUnreadCountRef.current) {
      playNotificationSound();
      prevUnreadCountRef.current = unreadCount;
    } else {
      prevUnreadCountRef.current = unreadCount;
    }
  }, [unreadCount, notifications.length]);

  const handleNotificationClick = () => {
    // Runtime has no per-notification mark-read endpoint. Navigation never fakes a persisted read.
    setOpen(false);
    navigate(routes.resources.notifications.list);
  };
  if (access.data?.can !== true) return null;

  const popoverContent = (
    <div style={{ width: 320, maxWidth: "calc(100vw - 32px)" }}>
      <Flex align="center" justify="space-between" style={{ paddingBottom: 8 }}>
        <Typography.Text strong>
          {t("notifications.recent")}
        </Typography.Text>
        {unreadCount > 0 && <NotificationMarkAllRead />}
      </Flex>
      <Divider style={{ margin: "4px 0 8px 0" }} />
      {isLoading ? <Spin /> : isError ? <Alert type="error" message={error?.message ?? t("queryError.description")} action={<Button disabled={isFetching} onClick={() => void refetch()}>{t("actions.retry")}</Button>} /> : notifications.length === 0 ? (
        <Empty
          description={t("notifications.empty")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notifications}
          itemLayout="horizontal"
          renderItem={(item) => (
            <List.Item
              style={{
                padding: "8px 4px",
                background: item.isRead ? "transparent" : "rgba(24, 144, 255, 0.05)",
                borderRadius: 4,
                marginBottom: 4,
              }}
            >
              <List.Item.Meta
                description={
                  <Typography.Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ margin: 0, fontSize: 12, color: "#8c8c8c" }}
                  >
                    {item.message}
                  </Typography.Paragraph>
                }
                title={
                  <Flex align="center" justify="space-between">
                    <Space size="small">
                      {!item.isRead && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: "#1890ff",
                            display: "inline-block",
                          }}
                        />
                      )}
                      <Button type="link" onClick={handleNotificationClick} aria-label={`${item.title} (${t(item.isRead ? "notifications.read" : "notifications.unread")})`} style={{ whiteSpace: "normal", height: "auto", textAlign: "left" }}>
                        <Typography.Text strong={!item.isRead}>{item.title}</Typography.Text>
                      </Button>
                    </Space>
                  </Flex>
                }
              />
            </List.Item>
          )}
        />
      )}
      <Divider style={{ margin: "8px 0 4px 0" }} />
      <Button
        block
        onClick={() => {
          setOpen(false);
          navigate(routes.resources.notifications.list);
        }}
        type="link"
      >
        {t("notifications.viewAll")}
      </Button>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      onOpenChange={setOpen}
      open={open}
      placement="bottomRight"
      trigger="click"
    >
      <Badge dot={unreadCount > 0 && !isError} title={t("notifications.recentUnread")} size="small">
        <Button
          aria-label={t("resources.notifications")}
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          shape="circle"
          type="text"
        />
      </Badge>
    </Popover>
  );
};
