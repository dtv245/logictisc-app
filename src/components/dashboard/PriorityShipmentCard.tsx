import { useId, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Sparkles, Truck, UserRound } from "lucide-react";
import truckImage from "@/assets/dashboard/priority-truck.png";
import type { PriorityShipment, PriorityShipmentCardProps, ShipmentCardLocale } from "@/types/dashboard/priority-shipment.types";
import "@/components/dashboard/PriorityShipmentCard.scss";

const labels = {
  vi: {
    title: "Chuyến vận chuyển ưu tiên", empty: "Chưa có chuyến đang vận chuyển",
    emptyHint: "Chuyến đang trên đường sẽ xuất hiện tại đây.", unavailable: "Chưa có dữ liệu chuyến từ API",
    unavailableHint: "Nguồn dữ liệu hiện tại chưa cung cấp thông tin chuyến để hiển thị.", window: "Khung giờ giao",
    scheduled: "Giờ giao đã hẹn", eta: "ETA hiện tại", detour: "Với tuyến tránh",
    inside: "trong khung giờ", ahead: "phút sớm hơn kế hoạch", late: "phút so với kế hoạch",
    onTime: "đúng kế hoạch", speed: "Vận tốc", fuel: "Nhiên liệu · tầm chạy", reefer: "Thùng lạnh",
    load: "Hàng hóa", pallets: "pallet", set: "đặt", driver: "Chưa có dữ liệu tài xế",
    noTelemetry: "Chưa có dữ liệu", route: "Tiến độ hành trình", noRoute: "Chưa có mốc hành trình",
    speedChange: "tốc độ", loading: "Đang tải chuyến vận chuyển", retry: "Thử lại",
    previous: "Chuyến trước", next: "Chuyến tiếp theo", current: "Vị trí xe hiện tại",
  },
  en: {
    title: "Priority shipment", empty: "No shipments in transit", emptyHint: "Active shipments will appear here.",
    unavailable: "Live shipment data unavailable", unavailableHint: "The current data source did not provide shipment records.",
    window: "Window", scheduled: "Scheduled delivery", eta: "ETA now", detour: "With detour", inside: "inside window",
    ahead: "min ahead of plan", late: "min vs plan", onTime: "on schedule", speed: "Speed",
    fuel: "Fuel · range", reefer: "Reefer", load: "Load", pallets: "pallets", set: "set",
    driver: "Driver data unavailable", noTelemetry: "No data available", route: "Route progress",
    noRoute: "No route milestones available", speedChange: "speed", loading: "Loading shipment",
    retry: "Retry", previous: "Previous shipment", next: "Next shipment", current: "Current truck position",
  },
} as const;

const clampPercent = (value: number): number => Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

function AgentMark(): ReactElement {
  return <span className="priority-shipment__agent-mark" aria-hidden="true"><Sparkles size={10} strokeWidth={1.8} /></span>;
}

function Metric({ label, value, caption, tone }: { label: string; value?: string; caption?: string; tone?: string }): ReactElement {
  return (
    <div className={`priority-shipment__metric ${tone ? `priority-shipment__metric--${tone}` : ""}`}>
      <dt>{label}</dt><dd>{value || "—"}</dd>{caption && <span>{caption}</span>}
    </div>
  );
}

function Callout({ kind, label, children, unavailable }: { kind: string; label: string; children: ReactNode; unavailable?: boolean }): ReactElement {
  return (
    <div className={`priority-shipment__callout priority-shipment__callout--${kind}${unavailable ? " priority-shipment__callout--unavailable" : ""}`}>
      <span className="priority-shipment__callout-label">{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

function ShipmentRoute({ shipment, locale }: { shipment: PriorityShipment; locale: ShipmentCardLocale }): ReactElement {
  const text = labels[locale];
  const stops = shipment.stops ?? [];
  const progress = shipment.progressPercent == null ? undefined : clampPercent(shipment.progressPercent);
  const congestion = shipment.congestion;
  const congestionStart = clampPercent(congestion?.startPercent ?? 0);
  const congestionEnd = Math.max(congestionStart, clampPercent(congestion?.endPercent ?? 0));
  const style = {
    "--route-progress": `${progress ?? 0}%`,
    "--congestion-start": `${congestionStart}%`,
    "--congestion-width": `${congestionEnd - congestionStart}%`,
  } as CSSProperties;

  return (
    <div className="priority-shipment__route" role="group" aria-label={text.route} style={style}>
      {shipment.detour && (
        <div className="priority-shipment__detour"><AgentMark /><span>{shipment.detour.label}</span>
          {shipment.detour.savedMinutes != null && <strong>−{shipment.detour.savedMinutes} min</strong>}
        </div>
      )}
      {shipment.detour && progress != null && <svg className="priority-shipment__detour-path" viewBox="0 0 160 48" fill="none" aria-hidden="true"><path d="M2 46C28 10 66 3 158 3" /></svg>}
      {stops.length > 0 ? (
        <>
          <div className="priority-shipment__track" aria-hidden="true">
            {progress != null && <span className="priority-shipment__track-complete" />}
            {congestion && <span className="priority-shipment__track-congestion" />}
            {progress != null && <span className="priority-shipment__current"><Truck size={14} strokeWidth={2} /></span>}
          </div>
          {progress != null && <span className="priority-shipment__sr-only">{text.current}: {progress}%</span>}
          <ol className="priority-shipment__stops">
            {stops.map((stop, stopIndex) => (
              <li key={stop.id} className={`${stop.completed ? "is-complete" : ""} ${stop.estimated ? "is-estimated" : ""}`}
                style={{ "--stop-position": `${clampPercent(stop.positionPercent ?? (stops.length > 1 ? stopIndex / (stops.length - 1) * 100 : 0))}%` } as CSSProperties}>
                <span className="priority-shipment__stop-dot" aria-hidden="true" />
                <span className="priority-shipment__stop-name">{stop.name}</span>
                {stop.time && <span className="priority-shipment__stop-time">{stop.estimated ? "ETA " : ""}{stop.time}</span>}
              </li>
            ))}
          </ol>
          {congestion && <div className="priority-shipment__congestion-label"><span>{congestion.label}</span>
            {congestion.changePercent != null && <strong>{congestion.changePercent > 0 ? "+" : ""}{congestion.changePercent}% {text.speedChange}</strong>}
          </div>}
        </>
      ) : <p className="priority-shipment__no-route">{text.noRoute}</p>}
    </div>
  );
}

/** Screenshot-inspired card. Business values are supplied by its caller, never sample fallbacks. */
export function PriorityShipmentCard({ shipments = [], isLoading = false, isUnavailable = false, error, onRetry, onSelectShipment, locale = "vi", className = "" }: PriorityShipmentCardProps): ReactElement {
  const text = labels[locale];
  const headingId = useId();
  const [selectedId, setSelectedId] = useState<string>();
  const index = Math.max(0, shipments.findIndex((shipment) => shipment.id === selectedId));
  const shipment = shipments[index];
  const number = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 });
  const unavailable = <span title={text.noTelemetry}>—</span>;

  const select = (offset: number): void => {
    const next = shipments[(index + offset + shipments.length) % shipments.length];
    if (!next) return;
    setSelectedId(next.id);
    onSelectShipment?.(next.id);
  };

  if (isLoading || error) {
    return <section className={`priority-shipment priority-shipment--pending ${className}`} aria-labelledby={headingId} aria-busy={isLoading}>
      <h2 id={headingId} className="priority-shipment__sr-only">{text.title}</h2>
      <div className="priority-shipment__state" role={error ? "alert" : "status"}>
        {error ? <AlertTriangle size={24} aria-hidden="true" /> : <Truck size={28} aria-hidden="true" />}
        <p>{error || text.loading}</p>
        {error && onRetry && <button className="priority-shipment__retry" type="button" onClick={onRetry}><RefreshCw size={14} />{text.retry}</button>}
      </div>
    </section>;
  }

  const delay = shipment?.delayMinutes;
  const etaCaption = delay == null ? undefined : delay === 0 ? text.onTime : delay > 0 ? `+${delay} ${text.late}` : `${Math.abs(delay)} ${text.ahead}`;
  const cargo = shipment?.cargo;
  const cargoParts: string[] = [];
  if (cargo?.pallets != null) cargoParts.push(`${number.format(cargo.pallets)}${cargo.capacity != null ? ` / ${number.format(cargo.capacity)}` : ""} ${text.pallets}`);
  if (cargo?.weight != null && cargo.weightUnit) cargoParts.push(`${number.format(cargo.weight)} ${cargo.weightUnit}`);
  const fuelParts: string[] = [];
  if (shipment?.fuel?.percent != null) fuelParts.push(`${number.format(shipment.fuel.percent)}%`);
  if (shipment?.fuel?.range != null && shipment.fuel.rangeUnit) fuelParts.push(`${number.format(shipment.fuel.range)} ${shipment.fuel.rangeUnit}`);
  const driver = shipment?.driver;
  const driverMeta = [shipment?.vehicleLabel, driver?.dutyLabel].filter(Boolean).join(" · ");

  return (
    <section className={`priority-shipment ${className}`} aria-labelledby={headingId}>
      <span className="priority-shipment__sr-only">{text.title}</span>
      <div className="priority-shipment__header">
        <div className="priority-shipment__identity">
          {shipment?.agent && <div className="priority-shipment__agent"><AgentMark />
            <span>{shipment.agent.label}{shipment.agent.timeLabel ? ` · ${shipment.agent.timeLabel}` : ""}</span>
          </div>}
          <div className="priority-shipment__title-row">
            <h2 id={headingId}>{shipment ? <>{shipment.origin} <span aria-hidden="true">→</span> {shipment.destination}</> : isUnavailable ? text.unavailable : text.empty}</h2>
            {shipment?.status && <span className={`priority-shipment__status priority-shipment__status--${shipment.status.tone}`}>
              {(shipment.status.tone === "warning" || shipment.status.tone === "danger") && <AlertTriangle size={11} fill="currentColor" aria-hidden="true" />}
              {shipment.status.label}
            </span>}
          </div>
        <p className="priority-shipment__meta">{shipment ? [shipment.reference, shipment.customer, cargo?.pallets != null ? `${number.format(cargo.pallets)} ${text.pallets}` : undefined].filter(Boolean).join(" · ") : isUnavailable ? text.unavailableHint : text.emptyHint}</p>
        </div>
        <dl className="priority-shipment__metrics">
          <Metric label={shipment?.deliveryWindow ? text.window : text.scheduled} value={shipment?.deliveryWindow ?? shipment?.scheduledDelivery} />
          <Metric label={text.eta} value={shipment?.eta} caption={etaCaption} tone={delay != null && delay > 0 ? "danger" : undefined} />
          <Metric label={text.detour} value={shipment?.detour?.eta} caption={shipment?.detour?.insideWindow ? text.inside : undefined} tone="purple" />
        </dl>
      </div>

      <div className="priority-shipment__showcase">
        <div className="priority-shipment__truck-shadow" aria-hidden="true" />
        <img className="priority-shipment__truck" src={truckImage} alt="" width={2048} height={768} draggable={false} />
        <svg className="priority-shipment__connectors" viewBox="0 0 680 215" preserveAspectRatio="none" aria-hidden="true">
          <path d="M112 104H152L193 132" className="priority-shipment__connector-speed" />
          <path d="M365 48H510M435 116H538M106 169H187" />
        </svg>
        <span className="priority-shipment__pin priority-shipment__pin--speed" aria-hidden="true" />
        <span className="priority-shipment__pin priority-shipment__pin--reefer" aria-hidden="true" />
        <span className="priority-shipment__pin priority-shipment__pin--load" aria-hidden="true" />
        <div className="priority-shipment__driver">
          <span className="priority-shipment__avatar">{driver?.avatarUrl ? <img src={driver.avatarUrl} alt="" /> : <UserRound size={16} aria-hidden="true" />}</span>
          <span><strong>{driver?.name ?? text.driver}</strong>{driverMeta && <small>{driverMeta}</small>}</span>
        </div>
        <Callout kind="speed" label={text.speed} unavailable={!shipment?.speed}>
          {shipment?.speed ? <>{number.format(shipment.speed.value)} {shipment.speed.unit}
            {shipment.speed.changePercent != null && <> · {shipment.speed.changePercent < 0 ? "↓" : "↑"}{Math.abs(shipment.speed.changePercent)}%</>}
            {shipment.speed.road && <> {locale === "en" ? "on" : "trên"} {shipment.speed.road}</>}
          </> : unavailable}
        </Callout>
        <Callout kind="fuel" label={text.fuel} unavailable={fuelParts.length === 0}>{fuelParts.length ? fuelParts.join(" · ") : unavailable}</Callout>
        <Callout kind="reefer" label={text.reefer} unavailable={!shipment?.reefer}>
          {shipment?.reefer ? <>{number.format(shipment.reefer.temperature)}°{shipment.reefer.unit}{shipment.reefer.setPoint != null && <> · {text.set} {number.format(shipment.reefer.setPoint)}°{shipment.reefer.unit}</>}</> : unavailable}
        </Callout>
        <Callout kind="load" label={text.load} unavailable={cargoParts.length === 0}>{cargoParts.length ? cargoParts.join(" · ") : unavailable}</Callout>
      </div>

      {shipment ? <ShipmentRoute shipment={shipment} locale={locale} /> : <p className="priority-shipment__empty" role="status">{isUnavailable ? text.unavailable : text.noTelemetry}</p>}
      {shipments.length > 1 && <nav className="priority-shipment__pager" aria-label={text.title}>
        <span aria-live="polite">{index + 1} / {shipments.length}</span>
        <button type="button" aria-label={text.previous} onClick={() => select(-1)}><ChevronLeft size={16} /></button>
        <button type="button" aria-label={text.next} onClick={() => select(1)}><ChevronRight size={16} /></button>
      </nav>}
    </section>
  );
}
