import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, Button, Card, Descriptions, Space, Tabs, Tag, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import { TripDriverAssignments } from "@/features/trips/TripDriverAssignments";
import { TripMileageSummary } from "@/features/trips/TripMileageSummary";
import { TripStopsTimeline } from "@/features/trips/TripStopsTimeline";
import type { ApiError } from "@/types/api.types";
import type { Trip } from "@/types/trip.types";

const getStatusColor = (status?: string): string => {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "green";
    case "dispatched":
      return "blue";
    case "cancelled":
      return "red";
    default:
      return "default";
  }
};

export const TripShow = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow<Trip, ApiError>({ resource: "trips" });
  const [activeTab, setActiveTab] = useState<string>("stops");

  const trip = queryResult.data?.data;
  const tripId = trip?.id ? String(trip.id) : "";

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
              <Tag color={getStatusColor(trip.status)}>{trip.status}</Tag>
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
              <TextField
                value={
                  trip.completedAt
                    ? formatDateTime(trip.completedAt)
                    : "—"
                }
              />
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
          <Tag color={getStatusColor(trip.status)} style={{ fontSize: 13 }}>
            {trip.status}
          </Tag>
          {trip.truckNumber && (
            <Tag color="cyan">
              🚛 {trip.truckNumber}
            </Tag>
          )}
        </Space>
      }
      data-testid="trip-show-page"
    >
      <TripMileageSummary
        legacyTotalDistance={trip.totalDistance}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        data-testid="trip-execution-tabs"
      />
    </Show>
  );
};
