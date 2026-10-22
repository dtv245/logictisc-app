import type { TmsTimelineEvent } from "@/types/tms-flow/tmsFlow.types";
import { formatTmsDateTime } from "@/utils/tms-flow/presentation";

export interface TmsTimelineProps {
  events: readonly TmsTimelineEvent[];
  limit?: number;
  emptyLabel?: string;
}

export function TmsTimeline({
  events,
  limit,
  emptyLabel = "No execution events recorded yet.",
}: TmsTimelineProps) {
  const visible = [...events]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, limit ?? events.length);

  if (visible.length === 0) {
    return <p className="tms-empty">{emptyLabel}</p>;
  }

  return (
    <ul className="tms-timeline" data-testid="tms-timeline">
      {visible.map((event) => (
        <li className="tms-timeline__item" key={event.id}>
          <time dateTime={event.occurredAt}>{formatTmsDateTime(event.occurredAt)}</time>
          <span>
            {event.eventType}
            <small>
              {event.previousStatus && event.newStatus
                ? `${event.previousStatus} → ${event.newStatus}`
                : event.newStatus ?? event.source ?? "Recorded"}
            </small>
            {event.note ? <small>{event.note}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
