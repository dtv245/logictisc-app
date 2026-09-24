/**
 * Icon thông báo hiển thị trên AppHeader với đếm số thông báo, âm thanh và popover xem nhanh.
 */

import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import {
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { routes } from "@/constants/routes";
import type { Notification } from "@/types/notification.types";
import { playNotificationSound } from "../notificationSound";

export const NotificationHeaderIcon = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());

  const { data } = useList<Notification>({
    resource: "notifications",
    queryOptions: {
      refetchInterval: 10000,
    },
  });

  const rawNotifications = useMemo(() => data?.data ?? [], [data?.data]);

  // Quản lý danh sách thông báo và trạng thái đã đọc
  const notifications = useMemo(() => {
    return rawNotifications.map((item) => ({
      ...item,
      isRead: item.isRead || readIds.has(item.id),
    }));
  }, [rawNotifications, readIds]);

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

  const handleMarkAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(new Set(allIds));
  }, [notifications]);

  const handleNotificationClick = useCallback(
    (item: Notification) => {
      setReadIds((prev) => new Set([...prev, item.id]));
      setOpen(false);
      navigate(routes.resources.notifications.list);
    },
    [navigate],
  );

  const popoverContent = (
    <div style={{ width: 320 }}>
      <Flex align="center" justify="space-between" style={{ paddingBottom: 8 }}>
        <Typography.Text strong>
          {t("resources.notifications")} {unreadCount > 0 ? `(${unreadCount})` : ""}
        </Typography.Text>
        {unreadCount > 0 && (
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
            size="small"
            type="link"
          >
            {t("notifications.markAllAsRead")}
          </Button>
        )}
      </Flex>
      <Divider style={{ margin: "4px 0 8px 0" }} />
      {notifications.length === 0 ? (
        <Empty
          description={t("notifications.empty")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notifications.slice(0, 5)}
          itemLayout="horizontal"
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                cursor: "pointer",
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
                      <Typography.Text
                        strong={!item.isRead}
                        style={{ fontSize: 13 }}
                      >
                        {item.title}
                      </Typography.Text>
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
      <Badge count={unreadCount} overflowCount={99} size="small">
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
