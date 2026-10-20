import React from "react";
import { useCustom } from "@refinedev/core";
import { Alert, Button, Spin } from "antd";
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  ThunderboltFilled,
  ClockCircleFilled,
} from "@ant-design/icons";
import { formatTimeOnly } from "@/formatters/dateTime";
import type { ApiError } from "@/types/api.types";
import type { LoadTimelineResponse } from "@/features/loads/types";
import { useTranslation } from "react-i18next";

export interface ShipmentTimelineCardProps {
  loadId: string;
}

export const ShipmentTimelineCard: React.FC<ShipmentTimelineCardProps> = ({ loadId }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch, isFetching } = useCustom<LoadTimelineResponse, ApiError>({
    url: `/api/loads/${loadId}/timeline`,
    method: "get",
    queryOptions: {
      enabled: Boolean(loadId),
    },
  });

  const timelineData = data?.data;
  const events = timelineData?.events || [];

  // Determine user timezone string
  const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneShort = timeZoneName.split("/").pop()?.replace(/_/g, " ") || "LOCAL";

  return (
    <div className="shipment-card" data-testid="shipment-timeline-card">
      <div className="timeline-card__header">
        <h3 className="timeline-card__title">{t("loads.timeline.title")}</h3>
        <span className="timeline-card__timezone">{t("loads.timeline.timezone", { zone: timeZoneShort })}</span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin tip={t("loads.timeline.loading")} />
        </div>
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message={t("loads.timeline.loadFailed")}
          description={error?.message}
          action={
            <Button size="small" disabled={isFetching} onClick={() => void refetch()}>
              {t("actions.retry")}
            </Button>
          }
        />
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
          {t("loads.timeline.empty")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {events.map((event, index) => {
            const norm = (event.eventType || "").toUpperCase();
            let icon = <CheckCircleFilled style={{ color: "var(--color-success-text)", fontSize: "var(--font-size-md)" }} />;
            let badgeBg = "var(--color-success-bg)";

            if (norm.includes("DELAY") || norm.includes("WARNING") || norm.includes("CANCEL")) {
              icon = <ExclamationCircleFilled style={{ color: "var(--color-error-text)", fontSize: "var(--font-size-md)" }} />;
              badgeBg = "var(--color-error-bg)";
            } else if (norm.includes("AI") || norm.includes("AGENT")) {
              icon = <ThunderboltFilled style={{ color: "#7C3AED", fontSize: "var(--font-size-md)" }} />;
              badgeBg = "#F5F3FF";
            } else if (norm.includes("APPROV")) {
              icon = <CheckCircleFilled style={{ color: "#7C3AED", fontSize: "var(--font-size-md)" }} />;
              badgeBg = "#F5F3FF";
            } else if (norm.includes("PENDING") || norm.includes("FUTURE")) {
              icon = <ClockCircleFilled style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-md)" }} />;
              badgeBg = "var(--color-bg-subtle)";
            }

            const title =
              event.previousStatus && event.newStatus
                ? `${event.eventType}: ${event.previousStatus} → ${event.newStatus}`
                : event.eventType;

            const description = event.note || (event.source ? `Nguồn: ${event.source}` : undefined);

            return (
              <div
                key={event.id || index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--spacing-sm)",
                  position: "relative",
                }}
              >
                {/* Event Icon */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: badgeBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)" }}>
                      {event.occurredAt ? formatTimeOnly(event.occurredAt) : "—"}
                    </span>
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--color-text)" }}>
                      {title}
                    </span>
                  </div>

                  {description && (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: 2, lineHeight: 1.4 }}>
                      {description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
