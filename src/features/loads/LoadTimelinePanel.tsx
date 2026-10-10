import { useCustom } from "@refinedev/core";
import { Alert, Card, Empty, Space, Spin, Tag, Timeline, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import type { ApiError } from "@/types/api.types";
import type { LoadEventView, LoadTimelineResponse } from "@/types/loadTimeline.types";

export interface LoadTimelinePanelProps {
  loadId: string;
}

const getEventColor = (eventType?: string, status?: string): string => {
  const norm = (eventType || status || "").toUpperCase();
  if (norm.includes("DELIVER")) return "green";
  if (norm.includes("DISPATCH") || norm.includes("START")) return "blue";
  if (norm.includes("PICK") || norm.includes("EN_ROUTE")) return "cyan";
  if (norm.includes("CANCEL")) return "red";
  if (norm.includes("ARRIVE")) return "orange";
  return "blue";
};

export const LoadTimelinePanel = ({ loadId }: LoadTimelinePanelProps) => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useCustom<LoadTimelineResponse, ApiError>({
    url: `/api/loads/${loadId}/timeline`,
    method: "get",
    queryOptions: {
      enabled: Boolean(loadId),
    },
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <Spin tip={t("common.loading", "Loading timeline...")} />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message={t("loads.timeline.loadFailed", "Failed to load timeline")}
        description={error?.message}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  const timelineData = data?.data;
  const events = timelineData?.events || [];

  return (
    <Card
      title={
        <Space wrap>
          <span>{t("loads.timeline.title", "Execution Timeline")}</span>
          {timelineData?.currentStatus && (
            <Tag color={getEventColor(undefined, timelineData.currentStatus)}>
              {timelineData.currentStatus}
            </Tag>
          )}
        </Space>
      }
      data-testid="load-timeline-panel"
    >
      {events.length === 0 ? (
        <Empty
          description={t(
            "loads.timeline.empty",
            "No execution events recorded yet",
          )}
        />
      ) : (
        <Timeline
          items={events.map((event: LoadEventView) => {
            const color = getEventColor(event.eventType, event.newStatus || undefined);

            return {
              color,
              children: (
                <Card
                  size="small"
                  style={{ marginBottom: 12 }}
                  data-testid={`timeline-event-${event.id}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <Space align="center" wrap>
                      <Tag color={color}>{event.eventType}</Tag>
                      {event.previousStatus && event.newStatus ? (
                        <Typography.Text type="secondary">
                          {event.previousStatus} ➔{" "}
                          <Typography.Text strong>
                            {event.newStatus}
                          </Typography.Text>
                        </Typography.Text>
                      ) : (
                        event.newStatus && (
                          <Typography.Text strong>
                            {event.newStatus}
                          </Typography.Text>
                        )
                      )}
                      {event.source && (
                        <Tag color="default">
                          {event.source}
                        </Tag>
                      )}
                    </Space>

                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      🕒 {formatDateTime(event.occurredAt)}
                    </Typography.Text>
                  </div>

                  {event.note && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text>{event.note}</Typography.Text>
                    </div>
                  )}

                  {(event.latitude != null || event.longitude != null) && (
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        📍 Lat: {event.latitude}, Lng: {event.longitude}
                      </Typography.Text>
                    </div>
                  )}
                </Card>
              ),
            };
          })}
        />
      )}
    </Card>
  );
};
