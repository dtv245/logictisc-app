import React from "react";
import { useCustom } from "@refinedev/core";
import { Spin } from "antd";
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  ThunderboltFilled,
  ClockCircleFilled,
} from "@ant-design/icons";
import { formatTimeOnly } from "@/formatters/dateTime";
import type { ApiError } from "@/types/api.types";
import type { LoadTimelineResponse } from "@/features/loads/types";

export interface ShipmentTimelineCardProps {
  loadId: string;
}

export const ShipmentTimelineCard: React.FC<ShipmentTimelineCardProps> = ({ loadId }) => {
  const { data, isLoading } = useCustom<LoadTimelineResponse, ApiError>({
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
        <h3 className="timeline-card__title">Dòng Thời Gian Chuyến Hàng</h3>
        <span className="timeline-card__timezone">Múi giờ {timeZoneShort}</span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Spin tip="Đang tải sự kiện..." />
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0", color: "#94A3B8", fontSize: 13 }}>
          Chưa có sự kiện nào được ghi nhận.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {events.map((event, index) => {
            const norm = (event.eventType || "").toUpperCase();
            let icon = <CheckCircleFilled style={{ color: "#16A34A", fontSize: 16 }} />;
            let badgeBg = "#F0FDF4";

            if (norm.includes("DELAY") || norm.includes("WARNING") || norm.includes("CANCEL")) {
              icon = <ExclamationCircleFilled style={{ color: "#DC2626", fontSize: 16 }} />;
              badgeBg = "#FEF2F2";
            } else if (norm.includes("AI") || norm.includes("AGENT")) {
              icon = <ThunderboltFilled style={{ color: "#7C3AED", fontSize: 16 }} />;
              badgeBg = "#F5F3FF";
            } else if (norm.includes("APPROV")) {
              icon = <CheckCircleFilled style={{ color: "#7C3AED", fontSize: 16 }} />;
              badgeBg = "#F5F3FF";
            } else if (norm.includes("PENDING") || norm.includes("FUTURE")) {
              icon = <ClockCircleFilled style={{ color: "#94A3B8", fontSize: 16 }} />;
              badgeBg = "#F8FAFC";
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
                  gap: 12,
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>
                      {event.occurredAt ? formatTimeOnly(event.occurredAt) : "—"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                      {title}
                    </span>
                  </div>

                  {description && (
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>
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
