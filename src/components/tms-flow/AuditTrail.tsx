import type { AuditEvent } from "@/types/tms-flow/tmsFlow.types";
import { formatTime } from "@/utils/tms-flow/format";

export interface AuditTrailProps {
  events: AuditEvent[];
  emptyLabel?: string;
  limit?: number;
}

export function AuditTrail({ events, emptyLabel = "No audit events yet.", limit }: AuditTrailProps) {
  const visible = limit ? events.slice(0, limit) : events;
  if (visible.length === 0) {
    return <p className="tms-audit__empty">{emptyLabel}</p>;
  }

  return (
    <ol className="tms-audit">
      {visible.map((event) => (
        <li className="tms-audit__item" key={event.id}>
          <span className="tms-audit__time">{formatTime(event.at)}</span>
          <div>
            <strong>{event.action.replaceAll("_", " ")}</strong>
            <p>{event.detail}</p>
            <small>{event.actor}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
