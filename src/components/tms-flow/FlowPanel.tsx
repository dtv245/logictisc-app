import type { ReactNode } from "react";

export interface FlowPanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function FlowPanel({ title, subtitle, action, children, className, testId }: FlowPanelProps) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <section className={`tms-panel ${className ?? ""}`.trim()} data-testid={testId}>
      {hasHeader ? (
        <header className="tms-panel__header">
          <div>
            {title ? <h2 className="tms-panel__title">{title}</h2> : null}
            {subtitle ? <p className="tms-panel__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="tms-panel__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="tms-panel__body">{children}</div>
    </section>
  );
}
