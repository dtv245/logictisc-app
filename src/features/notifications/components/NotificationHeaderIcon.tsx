/**
 * Nút thông báo dùng chung với dấu chưa đọc, âm thanh và popover xem nhanh.
 * Hỗ trợ tải 10 thông báo ban đầu + cuộn vô hạn (infinite scroll),
 * phân cấp màu sắc theo độ quan trọng và bấm vào chuyển thẳng đến màn hình / lô hàng cần xử lý.
 */

import { ArrowRightOutlined } from "@ant-design/icons";
import {
  useCan,
  useDataProvider,
  useList,
} from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Empty,
  Flex,
  Popover,
  type PopoverProps,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type UIEvent,
  type WheelEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { tmsKeys } from "@/api/tms-flow/tmsFlow.api";
import { NotificationNavIcon } from "@/components/navIcons";
import { StatusTag } from "@/components/StatusTag";
import { routes } from "@/constants/routes";
import type { TmsLoadsPageSnapshot } from "@/hooks/tms-flow/useTmsQueries";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import type { TmsShipmentView } from "@/types/tms-flow/tmsFlow.types";
import {
  summarizeTriagedNotifications,
  triageNotification,
  type NotificationRecord,
  type NotificationSeverity,
} from "@/utils/notifications/notificationTriage";
import { formatTmsDateTime } from "@/utils/tms-flow/presentation";
import type { Notification } from "@/types/notifications/notifications.types";
import { playNotificationSound } from "../utils/notificationSound";
import { NotificationMarkAllRead } from "./NotificationMarkAllRead";

const NOTIFICATION_POPUP_PAGE_SIZE = 10;
const POPUP_SCROLL_THRESHOLD_PX = 80;

const POPUP_SEVERITY_STYLES: Record<
  NotificationSeverity,
  {
    borderColor: string;
    unreadBg: string;
    readBg: string;
    dotColor: string;
    actionColor: string;
  }
> = {
  critical: {
    borderColor: "#e5484d",
    unreadBg: "rgba(229, 72, 77, 0.08)",
    readBg: "rgba(229, 72, 77, 0.02)",
    dotColor: "#e5484d",
    actionColor: "#b91c1c",
  },
  high: {
    borderColor: "#d97706",
    unreadBg: "rgba(217, 119, 6, 0.08)",
    readBg: "rgba(217, 119, 6, 0.02)",
    dotColor: "#d97706",
    actionColor: "#b45309",
  },
  medium: {
    borderColor: "#6a3afe",
    unreadBg: "rgba(106, 58, 254, 0.06)",
    readBg: "transparent",
    dotColor: "#6a3afe",
    actionColor: "#5b21b6",
  },
  info: {
    borderColor: "#0284c7",
    unreadBg: "rgba(2, 132, 199, 0.05)",
    readBg: "transparent",
    dotColor: "#0284c7",
    actionColor: "#0369a1",
  },
};

export const NotificationHeaderIcon = ({
  placement = "bottomRight",
}: Pick<PopoverProps, "placement">) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const getDataProvider = useDataProvider();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [extraPages, setExtraPages] = useState<NotificationRecord[]>([]);
  const [loadedPage, setLoadedPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "notifications", action: "list" });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useList<NotificationRecord>({
      resource: "notifications",
      pagination: { current: 1, pageSize: NOTIFICATION_POPUP_PAGE_SIZE },
      queryOptions: {
        refetchInterval: (_data, query) =>
          query?.state?.status === "error" ? false : 10000,
        enabled: Boolean(tenant?.tenantKey && access.data?.can),
        queryKey: ["notification-header", tenant?.tenantKey],
      },
    });

  const firstPageItems = useMemo(
    () => (data?.data ?? []) as NotificationRecord[],
    [data?.data],
  );
  const totalItems = data?.total ?? firstPageItems.length;

  const notifications = useMemo(() => {
    const allFirstPageRead =
      firstPageItems.length > 0 && firstPageItems.every((item) => item.isRead);
    const byId = new Map<string, NotificationRecord>();
    for (const item of firstPageItems) {
      byId.set(item.id, item);
    }
    for (const item of extraPages) {
      if (!byId.has(item.id)) {
        byId.set(
          item.id,
          allFirstPageRead && !item.isRead ? { ...item, isRead: true } : item,
        );
      }
    }
    return [...byId.values()];
  }, [extraPages, firstPageItems]);

  const cachedShipments = useMemo<readonly TmsShipmentView[]>(() => {
    const queries = queryClient.getQueriesData<{
      pages?: readonly TmsLoadsPageSnapshot[];
    }>({ queryKey: tmsKeys.all });
    const byId = new Map<string, TmsShipmentView>();
    for (const [, queryData] of queries) {
      for (const pageSnapshot of queryData?.pages ?? []) {
        for (const shipment of pageSnapshot.shipments ?? []) {
          if (!byId.has(shipment.id)) {
            byId.set(shipment.id, shipment);
          }
        }
      }
    }
    return [...byId.values()];
  }, [queryClient]);

  const triagedNotifications = useMemo(() => {
    const context = {
      shipments: cachedShipments,
      approvals: [],
    };
    return notifications
      .map((item, index) => triageNotification(item, index, context))
      .sort((a, b) => {
        if (a.severityRank !== b.severityRank) {
          return a.severityRank - b.severityRank;
        }
        if (a.notification.isRead !== b.notification.isRead) {
          return a.notification.isRead ? 1 : -1;
        }
        return (
          new Date(b.notification.createdDate).getTime() -
          new Date(a.notification.createdDate).getTime()
        );
      });
  }, [cachedShipments, notifications]);

  const severityCounts = useMemo(
    () => summarizeTriagedNotifications(triagedNotifications),
    [triagedNotifications],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications],
  );

  const unreadCount = unreadNotifications.length;
  const hasNextPage =
    notifications.length > 0 &&
    notifications.length < totalItems &&
    firstPageItems.length >= NOTIFICATION_POPUP_PAGE_SIZE;

  const loadMoreNotifications = useCallback(async () => {
    if (
      !hasNextPage ||
      isLoading ||
      isError ||
      isLoadingMoreRef.current ||
      !tenant?.tenantKey ||
      access.data?.can !== true
    ) {
      return;
    }

    const nextPage = loadedPage + 1;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const response = await getDataProvider().getList<NotificationRecord>({
        resource: "notifications",
        pagination: {
          current: nextPage,
          pageSize: NOTIFICATION_POPUP_PAGE_SIZE,
        },
      });
      const nextItems = (response.data ?? []) as NotificationRecord[];
      if (nextItems.length > 0) {
        setExtraPages((prev) => [...prev, ...nextItems]);
        setLoadedPage(nextPage);
      }
    } catch {
      // Giữ nguyên danh sách hiện tại nếu tải trang tiếp theo thất bại tạm thời
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [
    access.data?.can,
    getDataProvider,
    hasNextPage,
    isError,
    isLoading,
    loadedPage,
    tenant?.tenantKey,
  ]);

  const handlePopupScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remaining <= POPUP_SCROLL_THRESHOLD_PX) {
        void loadMoreNotifications();
      }
    },
    [loadMoreNotifications],
  );

  const handlePopupWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (event.deltaY <= 0) return;
      const target = event.currentTarget;
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remaining <= POPUP_SCROLL_THRESHOLD_PX) {
        void loadMoreNotifications();
      }
    },
    [loadMoreNotifications],
  );

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

  const handleNotificationClick = (targetHref?: string) => {
    // Runtime has no per-notification mark-read endpoint. Navigation never fakes a persisted read.
    setOpen(false);
    navigate(targetHref || routes.resources.notifications.list);
  };

  const handlePopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      popoverContentRef.current
        ?.querySelector<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        )
        ?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (access.data?.can !== true) return null;

  const popoverContent = (
    <div
      ref={popoverContentRef}
      role="dialog"
      aria-label={t("notifications.recent")}
      onKeyDownCapture={handlePopoverKeyDown}
      style={{ width: 380, maxWidth: "calc(100vw - 32px)" }}
    >
      <Flex align="center" justify="space-between" style={{ paddingBottom: 6 }}>
        <Space size={6} wrap>
          <Typography.Text strong>{t("notifications.recent")}</Typography.Text>
          {severityCounts.critical > 0 ? (
            <StatusTag
              label={`${severityCounts.critical} Khẩn cấp`}
              tone="error"
            />
          ) : null}
          {severityCounts.high > 0 ? (
            <StatusTag
              label={`${severityCounts.high} Quan trọng`}
              tone="warning"
            />
          ) : null}
        </Space>
        {unreadCount > 0 && <NotificationMarkAllRead />}
      </Flex>
      <Typography.Text
        type="secondary"
        style={{ display: "block", fontSize: 12, marginBottom: 8 }}
      >
        {t("notifications.recentUnreadScope")}
      </Typography.Text>
      <Divider style={{ margin: "4px 0 8px 0" }} />
      {isLoading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <Spin />
        </div>
      ) : isError ? (
        <Alert
          type="error"
          message={error?.message ?? t("queryError.description")}
          action={
            <Button disabled={isFetching} onClick={() => void refetch()}>
              {t("actions.retry")}
            </Button>
          }
        />
      ) : triagedNotifications.length === 0 ? (
        <Empty
          description={t("notifications.empty")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div
          data-testid="notification-popup-list"
          onScroll={handlePopupScroll}
          onWheel={handlePopupWheel}
          style={{
            maxHeight: 420,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingRight: 2,
          }}
        >
          {triagedNotifications.map((triaged) => {
            const { notification: item } = triaged;
            const palette = POPUP_SEVERITY_STYLES[triaged.severity];
            return (
              <article
                key={item.id}
                data-testid={`notification-popup-item-${item.id}`}
                data-severity={triaged.severity}
                style={{
                  padding: "10px 12px",
                  background: item.isRead ? palette.readBg : palette.unreadBg,
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${palette.borderColor}`,
                  borderRadius: 8,
                  transition: "border-color 0.15s ease",
                }}
              >
                <Flex
                  align="center"
                  justify="space-between"
                  gap={6}
                  wrap="wrap"
                  style={{ marginBottom: 4 }}
                >
                  <Space size={4} wrap>
                    <StatusTag
                      label={triaged.severityLabel}
                      tone={triaged.severityTone}
                    />
                    <Tag style={{ marginInlineEnd: 0, fontSize: 11 }}>
                      {triaged.categoryLabel}
                    </Tag>
                    {triaged.linkedShipment ? (
                      <Tag
                        color="purple"
                        style={{ marginInlineEnd: 0, fontSize: 11 }}
                      >
                        Lô #{triaged.linkedShipment.number}
                      </Tag>
                    ) : null}
                  </Space>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatTmsDateTime(item.createdDate)}
                  </Typography.Text>
                </Flex>

                <Flex align="flex-start" justify="space-between" gap={6}>
                  <Space size={6} align="start">
                    {!item.isRead && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          marginTop: 6,
                          borderRadius: "50%",
                          backgroundColor: palette.dotColor,
                          display: "inline-block",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Button
                      type="link"
                      onClick={() => handleNotificationClick(triaged.targetHref)}
                      aria-label={`${item.title} (${t(item.isRead ? "notifications.read" : "notifications.unread")})`}
                      style={{
                        whiteSpace: "normal",
                        height: "auto",
                        padding: 0,
                        textAlign: "left",
                      }}
                    >
                      <Typography.Text strong={!item.isRead}>
                        {item.title}
                      </Typography.Text>
                    </Button>
                  </Space>
                </Flex>

                <Typography.Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{
                    margin: "4px 0 6px 0",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  {item.message}
                </Typography.Paragraph>

                <Flex
                  align="center"
                  justify="space-between"
                  gap={6}
                  style={{
                    paddingTop: 4,
                    borderTop: "1px dashed rgba(148, 163, 184, 0.35)",
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {triaged.screenLabel}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    aria-label={`${triaged.actionLabel}: ${item.title}`}
                    onClick={() => handleNotificationClick(triaged.targetHref)}
                    style={{
                      color: palette.actionColor,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                      paddingInline: 0,
                    }}
                  >
                    {triaged.actionLabel} <ArrowRightOutlined />
                  </Button>
                </Flex>
              </article>
            );
          })}

          {isLoadingMore ? (
            <div
              data-testid="notification-popup-loading-more"
              style={{
                padding: "8px 0",
                textAlign: "center",
                fontSize: 12,
                color: "#64748b",
              }}
            >
              <Spin size="small" />{" "}
              <span style={{ marginLeft: 6 }}>Đang tải thêm thông báo…</span>
            </div>
          ) : hasNextPage ? (
            <Button
              type="text"
              size="small"
              data-testid="notification-popup-load-more"
              onClick={() => void loadMoreNotifications()}
              style={{ fontSize: 12, color: "#64748b" }}
            >
              Kéo xuống để tải thêm thông báo
            </Button>
          ) : null}
        </div>
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
      placement={placement}
      trigger="click"
    >
      <Badge
        color="#e5484d"
        count={unreadCount > 0 && !isError ? unreadCount : 0}
        overflowCount={99}
        size="small"
        title={t("notifications.recentUnread")}
      >
        <Button
          ref={triggerRef}
          aria-label={t("resources.notifications")}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`app-sider__notification-btn${open ? " app-sider__notification-btn--open" : ""}`}
          icon={<NotificationNavIcon />}
          type="text"
        />
      </Badge>
    </Popover>
  );
};

export type { Notification };
