import type { ReactNode } from "react";

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "positive";
  onClick?: () => void;
  testId?: string;
}

export function KpiTile({ label, value, hint, tone = "default", onClick, testId }: KpiTileProps) {
  const className = `tms-kpi tms-kpi--${tone}`;
  const content = (
    <>
      <span className="tms-kpi__label">{label}</span>
      <strong className="tms-kpi__value">{value}</strong>
      {hint ? <span className="tms-kpi__hint">{hint}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button className={className} data-testid={testId} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <div className={className} data-testid={testId}>
      {content}
    </div>
  );
}
