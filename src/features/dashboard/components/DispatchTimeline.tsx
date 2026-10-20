import type { CSSProperties, ReactElement } from "react";
import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTimelineClock } from "@/hooks/dashboard/useTimelineClock";
import { createLocaleLabels, resolveSupportedLocale } from "@/locales";
import type { DispatchTimelineProps } from "@/types/dashboard/operations-panels.types";
import "@/features/dashboard/components/DispatchTimeline.scss";

export type { DispatchTimelineProps, DriverTimelineRow } from "@/types/dashboard/operations-panels.types";

const timelineLabelKeys = ["label", "title", "aiSuggestions", "drivers", "loading", "invalidRange", "noDrivers", "retry", "driver", "schedule", "currentTime"] as const;

function minutes(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hour = Number(match[1]), minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : hour === 24 && minute === 0 ? 1440 : undefined;
}

export function DispatchTimeline({ totalDriversCount, shownDriversCount, drivers = [], startHour = 6, endHour = 18, now, isLoading = false, error, onRetry, locale, className = "" }: DispatchTimelineProps): ReactElement {
  const { i18n } = useTranslation();
  const activeLocale = resolveSupportedLocale(locale ?? i18n.resolvedLanguage);
  const fixedT = i18n.getFixedT(activeLocale);
  const text = createLocaleLabels(fixedT, "dashboard.opsView.panels.timeline", timelineLabelKeys);
  const clock = useTimelineClock(now);
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
    ? fixedT("dashboard.opsView.panels.timeline.driversCount", { shown: count, total: totalDriversCount })
    : fixedT("dashboard.opsView.panels.timeline.drivers", { count });
  const stateMessage = isLoading ? text.loading
    : error || (!validRange ? text.invalidRange
    : drivers.length === 0 ? text.noDrivers : undefined);

  return (
    <section className={`ops-timeline-card ${className}`} aria-label={text.label} aria-busy={isLoading}>
      <header className="ops-timeline-header">
        <div><h2>{text.title}</h2><p>{countLabel} · {text.aiSuggestions}</p></div>
      </header>
      {stateMessage ? <div className="ops-timeline-state" role={error || !validRange ? "alert" : "status"}><p>{stateMessage}</p>{error && onRetry && <button type="button" onClick={onRetry}>{text.retry}</button>}</div> : (
        <div className="ops-timeline-scrollable" tabIndex={0} role="region" aria-label={text.schedule}>
          <div className="ops-timeline-grid" style={{ "--timeline-rows": drivers.length } as CSSProperties}>
            <div className="ops-timeline-axis-row">
              <span className="ops-timeline-driver-cell ops-timeline-driver-cell--header">{text.driver}</span>
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
            {nowPosition != null && <div className="ops-timeline-now-layer" aria-label={`${text.currentTime}: ${clock}`}><div className="ops-now-marker" style={{ left: `${nowPosition}%` }}><span className="ops-now-marker__badge">{clock}</span><span className="ops-now-marker__line" /></div></div>}
          </div>
        </div>
      )}
    </section>
  );
}
