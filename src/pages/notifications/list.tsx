/**
 * Trung tâm thông báo & Cảnh báo vận hành (`/notifications`).
 * Hiển thị mức độ quan trọng (Khẩn cấp, Quan trọng, Cần xử lý, Thông tin)
 * và điều hướng trực tiếp đến màn hình + lô hàng / tác vụ đang gặp vấn đề khi ấn vào.
 */

import {
  AlertOutlined,
  ArrowRightOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Pagination, Spin, Tag } from "antd";
import {
  useMemo,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { StatusTag } from "@/components/StatusTag";
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  LIST_PAGE_SIZE_OPTIONS,
} from "@/constants/pagination";
import { routes } from "@/constants/routes";
import { NotificationMarkAllRead } from "@/features/notifications/components/NotificationMarkAllRead";
import type { Notification } from "@/types/notifications/notifications.types";
import { useTmsWorkspace } from "@/hooks/tms-flow/useTmsWorkspace";
import { usePaginatedTable } from "@/hooks/usePaginatedTable";
import {
  summarizeTriagedNotifications,
  triageNotification,
  type NotificationFilterMode,
  type NotificationRecord,
  type NotificationSeverity,
  type TriagedNotification,
} from "@/utils/notifications/notificationTriage";
import { formatTmsDateTime, riskMeta } from "@/utils/tms-flow/presentation";

import "./NotificationList.scss";

const SEVERITY_ICON_MAP: Record<NotificationSeverity, ReactNode> = {
  critical: <ExclamationCircleOutlined />,
  high: <WarningOutlined />,
  medium: <ThunderboltOutlined />,
  info: <InfoCircleOutlined />,
};

const FILTER_OPTIONS: ReadonlyArray<{
  key: NotificationFilterMode;
  label: string;
}> = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "critical", label: "Khẩn cấp" },
  { key: "high", label: "Quan trọng" },
  { key: "medium", label: "Cần xử lý" },
  { key: "info", label: "Thông tin" },
];

export const NotificationList = () => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<NotificationFilterMode>("all");
  const [searchText, setSearchText] = useState("");

  const {
    current,
    setCurrent,
    pageSize,
    setPageSize,
    tableQueryResult,
  } = usePaginatedTable<NotificationRecord>({
    resource: "notifications",
    pagination: {
      current: DEFAULT_LIST_PAGE,
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
  });

  const tms = useTmsWorkspace();
  const {
    riskShipments: tmsRiskShipments,
    unassignedShipments: tmsUnassignedShipments,
    shipments: tmsShipments,
  } = tms;

  const allShipments = useMemo(() => {
    const merged = new Map<string, (typeof tmsShipments)[number]>();
    for (const item of tmsRiskShipments ?? []) merged.set(item.id, item);
    for (const item of tmsUnassignedShipments ?? []) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    for (const item of tmsShipments ?? []) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    return [...merged.values()];
  }, [tmsRiskShipments, tmsShipments, tmsUnassignedShipments]);

  const atRiskCount =
    tms.riskCollection?.totalItems ??
    (tms.riskShipments?.length ||
      allShipments.filter((s) => s.risk !== "none").length);
  const unassignedCount =
    tms.unassignedCollection?.totalItems ??
    (tms.unassignedShipments?.length ||
      allShipments.filter((s) => !s.assignedTruckId).length);
  const aiSuggestedCount = tms.approvals?.length ?? 0;

  const rawNotifications = useMemo<readonly NotificationRecord[]>(
    () => (tableQueryResult.data?.data ?? []) as readonly NotificationRecord[],
    [tableQueryResult.data?.data],
  );
  const totalCount = tableQueryResult.data?.total ?? rawNotifications.length;

  const triagedItems = useMemo<readonly TriagedNotification[]>(() => {
    const context = {
      shipments: allShipments,
      approvals: tms.approvals ?? [],
    };
    return rawNotifications
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
  }, [allShipments, rawNotifications, tms.approvals]);

  const counts = useMemo(
    () => summarizeTriagedNotifications(triagedItems),
    [triagedItems],
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchText.trim().toLowerCase();
    return triagedItems.filter((item) => {
      if (filterMode === "unread" && item.notification.isRead) return false;
      if (
        (filterMode === "critical" ||
          filterMode === "high" ||
          filterMode === "medium" ||
          filterMode === "info") &&
        item.severity !== filterMode
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        item.notification.title,
        item.notification.message,
        item.severityLabel,
        item.categoryLabel,
        item.screenLabel,
        item.issueSummary,
        item.linkedShipment ? `#${item.linkedShipment.number}` : "",
        item.linkedShipment?.customerName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filterMode, searchText, triagedItems]);

  const urgentShipments = useMemo(
    () =>
      allShipments
        .filter(
          (shipment) =>
            shipment.status !== "delivered" &&
            shipment.status !== "cancelled" &&
            (shipment.risk !== "none" || !shipment.assignedTruckId),
        )
        .slice(0, 5),
    [allShipments],
  );

  const handleOpenTarget = (href: string) => {
    navigate(href);
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    href: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(href);
    }
  };

  const handleSecondaryClick = (
    event: MouseEvent<HTMLElement>,
    href: string,
  ) => {
    event.stopPropagation();
    navigate(href);
  };

  return (
    <section
      className="notification-center"
      aria-label="Trung tâm thông báo và cảnh báo vận hành"
    >
      <header className="notification-center__header">
        <div>
          <h1 className="notification-center__title">
            Trung tâm thông báo
          </h1>
        </div>

        <div className="notification-center__actions">
          <Button
            icon={<ReloadOutlined />}
            loading={tableQueryResult.isFetching}
            onClick={() => void tableQueryResult.refetch()}
          >
            Làm mới
          </Button>
          <Button
            icon={<AlertOutlined />}
            onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
          >
            Hàng đợi rủi ro ({atRiskCount})
          </Button>
          <NotificationMarkAllRead />
        </div>
      </header>

      <div className="notification-center__kpis" role="region" aria-label="Tổng quan mức độ quan trọng">
        <button
          type="button"
          className={`notification-center__kpi ${filterMode === "all" ? "is-active" : ""}`}
          onClick={() => setFilterMode("all")}
        >
          <span className="notification-center__kpi-top">
            <span>Tổng thông báo trang này</span>
            <BellOutlined />
          </span>
          <strong className="notification-center__kpi-value">{counts.all}</strong>
          <span className="notification-center__kpi-hint">
            Tổng toàn hệ thống: {totalCount} thông báo
          </span>
        </button>

        <button
          type="button"
          className={`notification-center__kpi notification-center__kpi--critical ${filterMode === "critical" ? "is-active" : ""}`}
          onClick={() =>
            setFilterMode((prev) => (prev === "critical" ? "all" : "critical"))
          }
        >
          <span className="notification-center__kpi-top">
            <span>Khẩn cấp (Cần xử lý ngay)</span>
            <StatusTag label="Khẩn cấp" tone="error" />
          </span>
          <strong className="notification-center__kpi-value">
            {counts.critical}
          </strong>
          <span className="notification-center__kpi-hint">
            Lô hàng quá hạn, sự cố hoặc cảnh báo nghiêm trọng
          </span>
        </button>

        <button
          type="button"
          className={`notification-center__kpi notification-center__kpi--high ${filterMode === "high" ? "is-active" : ""}`}
          onClick={() =>
            setFilterMode((prev) => (prev === "high" ? "all" : "high"))
          }
        >
          <span className="notification-center__kpi-top">
            <span>Quan trọng & Cảnh báo</span>
            <StatusTag label="Quan trọng" tone="warning" />
          </span>
          <strong className="notification-center__kpi-value">
            {counts.high + counts.medium}
          </strong>
          <span className="notification-center__kpi-hint">
            {counts.high} quan trọng · {counts.medium} cần xử lý
          </span>
        </button>

        <button
          type="button"
          className={`notification-center__kpi notification-center__kpi--unread ${filterMode === "unread" ? "is-active" : ""}`}
          onClick={() =>
            setFilterMode((prev) => (prev === "unread" ? "all" : "unread"))
          }
        >
          <span className="notification-center__kpi-top">
            <span>Chưa đọc</span>
            <ClockCircleOutlined />
          </span>
          <strong className="notification-center__kpi-value">
            {counts.unread}
          </strong>
          <span className="notification-center__kpi-hint">
            {counts.info} thông báo thông tin chung
          </span>
        </button>
      </div>

      <div className="notification-center__layout">
        <div className="notification-center__panel">
          <div className="notification-center__toolbar">
            <div
              className="notification-center__filters"
              role="group"
              aria-label="Lọc theo mức độ quan trọng"
            >
              {FILTER_OPTIONS.map((option) => {
                const count = counts[option.key];
                const active = filterMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    className={active ? "is-active" : ""}
                    onClick={() => setFilterMode(option.key)}
                  >
                    <span>{option.label}</span>
                    <span>({count})</span>
                  </button>
                );
              })}
            </div>

            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm theo tiêu đề, mã lô #1001, khách hàng..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="notification-center__search"
              aria-label="Tìm kiếm thông báo"
            />
          </div>

          {tableQueryResult.isLoading ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <Spin tip="Đang tải danh sách thông báo..." />
            </div>
          ) : visibleItems.length === 0 ? (
            <Empty
              description={
                rawNotifications.length === 0
                  ? "Hiện chưa có thông báo nào"
                  : "Không có thông báo khớp bộ lọc đang chọn"
              }
            >
              {filterMode !== "all" || searchText.trim() ? (
                <Button
                  onClick={() => {
                    setFilterMode("all");
                    setSearchText("");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div
              className="notification-center__list"
              role="list"
              aria-label="Danh sách thông báo"
            >
              {visibleItems.map((item) => {
                const { notification, linkedShipment } = item;
                return (
                  <article
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.severityLabel}: ${notification.title}. ${item.actionLabel}`}
                    className={`notification-card notification-card--${item.severity} ${!notification.isRead ? "is-unread" : ""}`}
                    onClick={() => handleOpenTarget(item.targetHref)}
                    onKeyDown={(event) =>
                      handleCardKeyDown(event, item.targetHref)
                    }
                  >
                    <div className="notification-card__top">
                      <div className="notification-card__badges">
                        <span
                          className={`notification-card__severity-icon notification-card__severity-icon--${item.severity}`}
                          aria-hidden="true"
                        >
                          {SEVERITY_ICON_MAP[item.severity]}
                        </span>
                        <StatusTag
                          label={item.severityLabel}
                          tone={item.severityTone}
                        />
                        <Tag>{item.categoryLabel}</Tag>
                        {linkedShipment ? (
                          <Tag color="purple">
                            Lô #{linkedShipment.number} · {linkedShipment.originCity} →{" "}
                            {linkedShipment.destinationCity}
                          </Tag>
                        ) : null}
                        {!notification.isRead ? (
                          <span className="notification-card__unread-dot">
                            Chưa đọc
                          </span>
                        ) : (
                          <span className="notification-card__read-label">
                            <CheckCircleOutlined /> Đã đọc
                          </span>
                        )}
                      </div>

                      <time
                        className="notification-card__time"
                        dateTime={notification.createdDate}
                      >
                        {formatTmsDateTime(notification.createdDate)}
                      </time>
                    </div>

                    <div className="notification-card__body">
                      <h2 className="notification-card__title">
                        {notification.title}
                      </h2>
                      <p className="notification-card__message">
                        {notification.message}
                      </p>
                    </div>

                    <div className="notification-card__context">
                      <div className="notification-card__context-info">
                        <span className="notification-card__context-screen">
                          Điểm xử lý: {item.screenLabel}
                        </span>
                        <span className="notification-card__context-issue">
                          {item.issueSummary}
                        </span>
                      </div>

                      <div className="notification-card__context-actions">
                        {item.secondaryHref && item.secondaryLabel ? (
                          <Button
                            size="small"
                            onClick={(event) =>
                              handleSecondaryClick(event, item.secondaryHref!)
                            }
                          >
                            {item.secondaryLabel}
                          </Button>
                        ) : null}
                        <Button
                          type={
                            item.severity === "critical" ||
                            item.severity === "high"
                              ? "primary"
                              : "default"
                          }
                          danger={item.severity === "critical"}
                          size="small"
                          icon={<ArrowRightOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenTarget(item.targetHref);
                          }}
                        >
                          {item.actionLabel}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="notification-center__pagination">
            <span className="notification-center__subtitle">
              Hiển thị {visibleItems.length} / {rawNotifications.length} thông báo trên trang {current}
            </span>
            <Pagination
              current={current}
              pageSize={pageSize}
              total={totalCount}
              showSizeChanger
              pageSizeOptions={[...LIST_PAGE_SIZE_OPTIONS]}
              onChange={(nextPage, nextPageSize) => {
                if (nextPageSize && nextPageSize !== pageSize) {
                  setPageSize(nextPageSize);
                }
                setCurrent(nextPage);
              }}
            />
          </div>
        </div>

        <aside
          className="notification-center__panel"
          aria-label="Lô hàng và tác vụ đang gặp vấn đề cần giải quyết"
        >
          <div>
            <h2 className="notification-card__title">
              Lô hàng & Vấn đề cần giải quyết ngay
            </h2>
          </div>

          <div className="notification-side-list">
            <button
              type="button"
              className="notification-side-list__item"
              onClick={() => navigate(`${routes.tmsFlow.dispatch}?filter=at-risk`)}
            >
              <div className="notification-side-list__head">
                <span>Lô hàng có rủi ro / quá hạn</span>
                <StatusTag
                  label={`${atRiskCount} lô`}
                  tone={atRiskCount > 0 ? "error" : "success"}
                />
              </div>
              <div className="notification-side-list__meta">
                <span>Màn Điều phối · Hàng đợi rủi ro</span>
                <ArrowRightOutlined />
              </div>
            </button>

            <button
              type="button"
              className="notification-side-list__item"
              onClick={() =>
                navigate(`${routes.tmsFlow.dispatch}?filter=unassigned`)
              }
            >
              <div className="notification-side-list__head">
                <span>Lô hàng chưa phân công xe</span>
                <StatusTag
                  label={`${unassignedCount} lô`}
                  tone={unassignedCount > 0 ? "warning" : "neutral"}
                />
              </div>
              <div className="notification-side-list__meta">
                <span>Màn Điều phối · Chưa phân công</span>
                <ArrowRightOutlined />
              </div>
            </button>

            <button
              type="button"
              className="notification-side-list__item"
              onClick={() => navigate(routes.tmsFlow.approvals)}
            >
              <div className="notification-side-list__head">
                <span>Đề xuất điều phối AI chờ duyệt</span>
                <StatusTag
                  label={`${aiSuggestedCount} đề xuất`}
                  tone={aiSuggestedCount > 0 ? "processing" : "neutral"}
                />
              </div>
              <div className="notification-side-list__meta">
                <span>Màn Duyệt điều phối AI</span>
                <ArrowRightOutlined />
              </div>
            </button>
          </div>

          {urgentShipments.length > 0 ? (
            <>
              <div style={{ marginTop: 4 }}>
                <p className="notification-center__eyebrow">
                  LÔ HÀNG ĐANG GẶP VẤN ĐỀ ({urgentShipments.length})
                </p>
              </div>
              <div className="notification-side-list">
                {urgentShipments.map((shipment) => {
                  const isRisk = shipment.risk !== "none";
                  const filterParam = isRisk
                    ? "filter=at-risk&"
                    : !shipment.assignedTruckId
                      ? "filter=unassigned&"
                      : "";
                  const targetUrl = `${routes.tmsFlow.dispatch}?${filterParam}shipment=${encodeURIComponent(shipment.id)}`;
                  return (
                    <button
                      key={shipment.id}
                      type="button"
                      className="notification-side-list__item"
                      onClick={() => navigate(targetUrl)}
                    >
                      <div className="notification-side-list__head">
                        <span>
                          Lô #{shipment.number} · {shipment.originCity} →{" "}
                          {shipment.destinationCity}
                        </span>
                        <StatusTag
                          label={
                            isRisk
                              ? riskMeta[shipment.risk].label
                              : "Chưa phân công"
                          }
                          tone={
                            isRisk ? riskMeta[shipment.risk].tone : "warning"
                          }
                        />
                      </div>
                      <div className="notification-side-list__meta">
                        <span>{shipment.customerName}</span>
                        <span>Giải quyết ngay →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
};

export type { Notification };
