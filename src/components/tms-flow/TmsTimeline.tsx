import { Button, Tag, Timeline } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TmsTimelineEvent } from "@/types/tms-flow/tmsFlow.types";
import { formatTmsDateTime } from "@/utils/tms-flow/presentation";
import { translateTimelineEventType, translateTimelineStatus } from "@/utils/tms-flow/timelinePresentation";

export interface TmsTimelineProps {
  events: readonly TmsTimelineEvent[];
  limit?: number;
  emptyLabel?: string;
  collapsible?: boolean;
  initialVisibleCount?: number;
}

const resolveTimelineColor = (
  eventType?: string | null,
  status?: string | null,
): string => {
  const token = `${eventType ?? ""} ${status ?? ""}`.toUpperCase();
  if (token.includes("DELIVER") || token.includes("COMPLETE")) return "green";
  if (
    token.includes("CANCEL") ||
    token.includes("EXCEPTION") ||
    token.includes("FAIL") ||
    token.includes("REJECT")
  ) {
    return "red";
  }
  if (
    token.includes("DELAY") ||
    token.includes("ARRIVE") ||
    token.includes("HOLD") ||
    token.includes("WARN")
  ) {
    return "orange";
  }
  if (
    token.includes("PICK") ||
    token.includes("TRANSIT") ||
    token.includes("EN_ROUTE") ||
    token.includes("DEPART")
  ) {
    return "cyan";
  }
  return "blue";
};

export function TmsTimeline({
  events,
  limit,
  emptyLabel,
  collapsible = false,
  initialVisibleCount = 3,
}: TmsTimelineProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const timelineEvents = useMemo(
    () => collapsible
      ? [...events].sort(
          (left, right) =>
            new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
        )
      : events,
    [collapsible, events],
  );
  const visibleCount = collapsible && expanded
    ? timelineEvents.length
    : Math.min(collapsible ? initialVisibleCount : limit ?? timelineEvents.length, timelineEvents.length);
  const visible = timelineEvents.slice(0, visibleCount);

  if (visible.length === 0) {
    return <p className="tms-empty">{emptyLabel ?? t("tmsDispatch.timeline.empty")}</p>;
  }

  return (
    <div className="tms-timeline" data-testid="tms-timeline">
      <Timeline
        items={visible.map((event) => {
          const color = resolveTimelineColor(event.eventType, event.newStatus);
          const transitionText =
            event.previousStatus && event.newStatus
              ? t("tmsDispatch.timeline.statusChanged", {
                  previous: translateTimelineStatus(event.previousStatus, t),
                  next: translateTimelineStatus(event.newStatus, t),
                })
              : translateTimelineStatus(event.newStatus ?? event.source ?? t("tmsDispatch.timeline.recorded"), t);

          return {
            key: event.id,
            color,
            children: (
              <div
                className="tms-timeline__item"
                data-testid={`timeline-event-${event.id}`}
              >
                <div className="tms-timeline__header">
                  <span className="tms-timeline__title">
                    <Tag bordered={false} color={color} className="tms-timeline__tag">
                      {translateTimelineEventType(event.eventType, t)}
                    </Tag>
                    <span className="tms-timeline__transition">
                      {transitionText}
                    </span>
                  </span>
                  <time
                    className="tms-timeline__time"
                    dateTime={event.occurredAt}
                  >
                    {formatTmsDateTime(event.occurredAt)}
                  </time>
                </div>
                {event.note ? (
                  <p className="tms-timeline__note">{event.note}</p>
                ) : null}
              </div>
            ),
          };
        })}
      />
      {collapsible && timelineEvents.length > initialVisibleCount ? (
        <Button
          className="tms-timeline__toggle"
          onClick={() => setExpanded((value) => !value)}
          type="link"
        >
          {t(expanded ? "tmsDispatch.timeline.collapse" : "tmsDispatch.timeline.seeMore")}
        </Button>
      ) : null}
    </div>
  );
}
