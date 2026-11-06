import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, Button, Card, Descriptions, Space, Tabs, Tag, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { TripDriverAssignments } from "@/features/trips/components/TripDriverAssignments";
import { TripMileageSummary } from "@/features/trips/components/TripMileageSummary";
import { TripStopsTimeline } from "@/features/trips/components/TripStopsTimeline";
import type { ApiError } from "@/types/api.types";
import type { Trip } from "@/types/trips/trip.types";

export const TripShow = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow<Trip, ApiError>({ resource: "trips" });
  const [activeTab, setActiveTab] = useState<string>("stops");

  const trip = queryResult.data?.data;
  const tripId = trip?.id ? String(trip.id) : "";
  // Trạng thái chỉ hỗ trợ completedAt khi đã completed. Giữ nguyên dữ liệu
  // backend nhưng cảnh báo rõ thay vì ẩn timestamp hoặc coi là bình thường.
  const completedAtInconsistent = Boolean(
    trip?.completedAt && trip.status?.toLowerCase() !== "completed",
  );

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry")}
          </Button>
        }
        description={queryResult.error?.message}
        message={t("crud.loadError")}
        showIcon
        type="error"
      />
    );
  }

  if (queryResult.isLoading || !trip) {
    return (
      <Show isLoading={true}>
        <div style={{ minHeight: 200 }} />
      </Show>
    );
  }

  const tabItems = [
    {
      key: "stops",
      label: t("trips.execution.stopsTimeline", "Stops & Timeline"),
      children: activeTab === "stops" ? <TripStopsTimeline tripId={tripId} /> : null,
    },
    {
      key: "drivers",
      label: t("trips.execution.driverAssignments", "Driver Assignments"),
      children:
        activeTab === "drivers" ? <TripDriverAssignments tripId={tripId} /> : null,
    },
    {
      key: "details",
      label: t("trips.execution.fullDetails", "Full Details"),
      children: (
        <Card>
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={t("trips.fields.number", "Number")}>
              <TextField value={trip.number} />
            </Descriptions.Item>
            <Descriptions.Item label={t("trips.fields.name", "Name")}>
              <TextField value={trip.name} />
            </Descriptions.Item>
            <Descriptions.Item label={t("trips.fields.status", "Status")}>
              <StatusTag label={trip.status} tone={statusTone(trip.status)} />
            </Descriptions.Item>
            <Descriptions.Item label={t("trips.fields.truckNumber", "Truck")}>
              <TextField value={trip.truckNumber || trip.truckId || "—"} />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("trips.fields.dispatchedAt", "Dispatched At")}
            >
              <TextField
                value={
                  trip.dispatchedAt
                    ? formatDateTime(trip.dispatchedAt)
                    : "—"
                }
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("trips.fields.completedAt", "Completed At")}
            >
              <Space size={4}>
                <TextField
                  value={
                    trip.completedAt
                      ? formatDateTime(trip.completedAt)
                      : "—"
                  }
                />
                {completedAtInconsistent ? (
                  <Tag color="warning">
                    {t("trips.fields.inconsistent", "Không nhất quán")}
                  </Tag>
                ) : null}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={t("trips.fields.cancelledAt", "Cancelled At")}
            >
              <TextField
                value={
                  trip.cancelledAt
                    ? formatDateTime(trip.cancelledAt)
                    : "—"
                }
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("trips.fields.createdAt", "Created At")}
            >
              <TextField
                value={
                  "—"
                }
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
  ];

  return (
    <Show
      isLoading={queryResult.isLoading}
      title={
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {trip.name || t("resources.trips", "Trip")} #{trip.number}
          </Typography.Title>
          <StatusTag label={trip.status} tone={statusTone(trip.status)} />
          {trip.truckNumber && (
            <Tag color="cyan" aria-label={`Xe: ${trip.truckNumber}`}>
              <span aria-hidden="true">🚛</span> {trip.truckNumber}
            </Tag>
          )}
        </Space>
      }
      data-testid="trip-show-page"
    >
      <TripMileageSummary
        legacyTotalDistance={trip.totalDistance}
      />

      {completedAtInconsistent ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="Dữ liệu không nhất quán: chuyến chưa hoàn tất nhưng đã có thời điểm hoàn tất. Vui lòng liên hệ quản trị viên."
        />
      ) : null}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        data-testid="trip-execution-tabs"
      />
    </Show>
  );
};
