import type { CSSProperties, ReactElement } from "react";
import { UserRound } from "lucide-react";
import { useTimelineClock } from "@/hooks/dashboard/useTimelineClock";
import type { DispatchTimelineProps } from "@/types/dashboard/operations-panels.types";
import "@/features/dashboard/components/DispatchTimeline.scss";

export type { DispatchTimelineProps, DriverTimelineRow } from "@/types/dashboard/operations-panels.types";

function minutes(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : hour === 24 && minute === 0 ? 1440 : undefined;
}

export function DispatchTimeline({ totalDriversCount, shownDriversCount, drivers = [], startHour = 6, endHour = 18, now, isLoading = false, error, onRetry, locale = "vi", className = "" }: DispatchTimelineProps): ReactElement {
  const clock = useTimelineClock(now);
  const english = locale === "en";
  const validRange = Number.isFinite(startHour) && Number.isFinite(endHour) && startHour >= 0 && endHour <= 24 && endHour > startHour;
  const start = startHour * 60, end = endHour * 60;
  const total = end - start;
  const current = minutes(clock);
  const nowPosition = validRange && current != null && current >= start && current <= end ? (current - start) / total * 100 : undefined;
  const hours: number[] = [];
  if (validRange) {
    for (let hour = startHour; hour <= endHour; hour += 2) hours.push(hour);
    if (hours.at(-1) !== endHour) hours.push(endHour);
  }
  const count = shownDriversCount ?? drivers.length;
  const countLabel = totalDriversCount != null
    ? english ? `${count} of ${totalDriversCount} drivers` : `${count} / ${totalDriversCount} tài xế`
    : english ? `${count} drivers` : `${count} tài xế`;
  const stateMessage = isLoading ? english ? "Loading dispatch schedule…" : "Đang tải lịch điều phối…"
    : error || (!validRange ? english ? "Invalid timeline time range." : "Khung giờ timeline không hợp lệ."
    : drivers.length === 0 ? english ? "No driver schedules available." : "Chưa có lịch điều phối tài xế." : undefined);

  return (
    <section className={`ops-timeline-card ${className}`} aria-label={english ? "Dispatch timeline" : "Biểu đồ điều phối tài xế"} aria-busy={isLoading}>
      <header className="ops-timeline-header">
        <div><h2>Dispatch timeline</h2><p>{countLabel} · {english ? "AI suggestions are dashed" : "Đề xuất AI có viền nét đứt"}</p></div>
      </header>
      {stateMessage ? <div className="ops-timeline-state" role={error || !validRange ? "alert" : "status"}><p>{stateMessage}</p>{error && onRetry && <button type="button" onClick={onRetry}>{english ? "Retry" : "Thử lại"}</button>}</div> : (
        <div className="ops-timeline-scrollable" tabIndex={0} role="region" aria-label={english ? "Driver schedule" : "Lịch chạy theo tài xế"}>
          <div className="ops-timeline-grid" style={{ "--timeline-rows": drivers.length } as CSSProperties}>
            <div className="ops-timeline-axis-row">
              <span className="ops-timeline-driver-cell ops-timeline-driver-cell--header">{english ? "Driver" : "Tài xế"}</span>
              <div className="ops-timeline-track ops-timeline-track--axis">{hours.map((hour) => <span className="ops-time-marker" key={hour} style={{ left: `${(hour * 60 - start) / total * 100}%` }}>{String(Math.floor(hour)).padStart(2, "0")}:{String(Math.round((hour % 1) * 60)).padStart(2, "0")}</span>)}</div>
            </div>
            {drivers.map((driver) => <div className="ops-timeline-driver-row" key={driver.driverId}>
              <div className="ops-timeline-driver-cell"><span className="ops-timeline-avatar" aria-hidden="true">{driver.avatarUrl ? <img src={driver.avatarUrl} alt="" /> : <UserRound size={14} />}</span><div className="ops-timeline-driver-info"><strong>{driver.driverName}</strong><span className={driver.statusTag ? `ops-timeline-driver-status--${driver.statusTag.tone}` : ""}>{driver.statusTag?.text || driver.vehiclePlate}</span></div></div>
              <div className="ops-timeline-track">
                {hours.map((hour) => <i className="ops-timeline-gridline" key={hour} style={{ left: `${(hour * 60 - start) / total * 100}%` }} aria-hidden="true" />)}
                {driver.blocks.map((block) => {
                  const blockStart = minutes(block.startAt), blockEnd = minutes(block.endAt);
                  if (blockStart == null || blockEnd == null || blockEnd <= blockStart) return null;
                  const visibleStart = Math.max(start, blockStart), visibleEnd = Math.min(end, blockEnd);
                  if (visibleEnd <= visibleStart) return null;
                  const description = `${block.label} · ${block.startAt}–${block.endAt}${block.delayMinutes != null ? ` · +${block.delayMinutes} min` : ""}`;
                  return <div key={block.id} className={`ops-timeline-block ops-timeline-block--${block.kind}`} style={{ left: `${(visibleStart - start) / total * 100}%`, width: `${(visibleEnd - visibleStart) / total * 100}%` }} title={description} aria-label={description} role="img" tabIndex={0}><span>{block.label}</span></div>;
                })}
              </div>
            </div>)}
            {nowPosition != null && <div className="ops-timeline-now-layer" aria-label={`${english ? "Current time" : "Giờ hiện tại"}: ${clock}`}><div className="ops-now-marker" style={{ left: `${nowPosition}%` }}><span className="ops-now-marker__badge">{clock}</span><span className="ops-now-marker__line" /></div></div>}
          </div>
        </div>
      )}
    </section>
  );
}
