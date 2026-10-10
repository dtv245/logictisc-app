import { Alert, Card, Empty, Space, Spin, Tag, Timeline, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import type { TripStopExecution } from "@/types/tripExecution.types";
import { TripStopActions } from "./TripStopActions";
import { useTripStopActions } from "./useTripStopActions";

export interface TripStopsTimelineProps {
  tripId: string;
}

const getStopStatusColor = (status?: string): string => {
  switch ((status || "").toUpperCase()) {
    case "DEPARTED":
      return "green";
    case "SERVICE_COMPLETED":
    case "SERVICE_STARTED":
      return "blue";
    case "ARRIVED":
      return "orange";
    case "EN_ROUTE":
      return "cyan";
    default:
      return "gray";
  }
};

const getStopTypeTag = (type?: string) => {
  const norm = (type || "").toUpperCase();
  let color = "default";
  if (norm.includes("PICKUP")) color = "blue";
  if (norm.includes("DELIVERY")) color = "purple";
  if (norm.includes("TERMINAL")) color = "geekblue";
  if (norm.includes("BREAK")) color = "orange";

  return <Tag color={color}>{type || "STOP"}</Tag>;
};

export const TripStopsTimeline = ({ tripId }: TripStopsTimelineProps) => {
  const { t } = useTranslation();
  const {
    stops,
    isLoading,
    isError,
    error,
    isSubmitting,
    executeTransition,
  } = useTripStopActions(tripId);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <Spin tip={t("common.loading", "Loading stops...")} />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message={t("trips.stops.loadFailed", "Failed to load trip stops")}
        description={error?.message}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (!stops || stops.length === 0) {
    return (
      <Card>
        <Empty
          description={t(
            "trips.stops.empty",
            "No stops recorded for this trip",
          )}
        />
      </Card>
    );
  }

  const timelineItems = stops.map((stop: TripStopExecution) => {
    const statusColor = getStopStatusColor(stop.status);
    const locationStr = [stop.addressCity, stop.addressState]
      .filter(Boolean)
      .join(", ");

    return {
      color: statusColor,
      children: (
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          data-testid={`stop-card-${stop.id}`}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Space align="center" wrap>
              <Typography.Text strong style={{ fontSize: 15 }}>
                #{stop.order}
              </Typography.Text>
              {getStopTypeTag(stop.type)}
              <Tag color={statusColor}>
                {stop.status || "PENDING"}
              </Tag>
              {locationStr && (
                <Typography.Text type="secondary">
                  📍 {locationStr}
                </Typography.Text>
              )}
            </Space>

            <TripStopActions
              stop={stop}
              onTransition={executeTransition}
              isSubmitting={isSubmitting}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 8,
              fontSize: 13,
              color: "#595959",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            {stop.appointmentStart && (
              <div>
                <Typography.Text type="secondary">
                  {t("trips.stops.appointment", "Appointment")}:
                </Typography.Text>{" "}
                {formatDateTime(stop.appointmentStart)}
                {stop.appointmentEnd && ` - ${formatDateTime(stop.appointmentEnd)}`}
              </div>
            )}
            {stop.arrivedAt && (
              <div>
                <Typography.Text type="secondary">
                  {t("trips.stops.arrivedAt", "Arrived")}:
                </Typography.Text>{" "}
                {formatDateTime(stop.arrivedAt)}
              </div>
            )}
            {stop.serviceStartedAt && (
              <div>
                <Typography.Text type="secondary">
                  {t("trips.stops.serviceStartedAt", "Service Started")}:
                </Typography.Text>{" "}
                {formatDateTime(stop.serviceStartedAt)}
              </div>
            )}
            {stop.serviceCompletedAt && (
              <div>
                <Typography.Text type="secondary">
                  {t("trips.stops.serviceCompletedAt", "Service Completed")}:
                </Typography.Text>{" "}
                {formatDateTime(stop.serviceCompletedAt)}
              </div>
            )}
            {stop.departedAt && (
              <div>
                <Typography.Text type="secondary">
                  {t("trips.stops.departedAt", "Departed")}:
                </Typography.Text>{" "}
                {formatDateTime(stop.departedAt)}
              </div>
            )}
            {stop.dwellMinutes !== null &&
              stop.dwellMinutes !== undefined &&
              stop.dwellMinutes >= 0 && (
                <div>
                  <Typography.Text type="secondary">
                    {t("trips.stops.dwellTime", "Dwell Time")}:
                  </Typography.Text>{" "}
                  <Tag color="default">{stop.dwellMinutes} min</Tag>
                </div>
              )}
          </div>
        </Card>
      ),
    };
  });

  return (
    <div data-testid="trip-stops-timeline">
      <Timeline items={timelineItems} />
    </div>
  );
};
