import React from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "antd";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { KpiItemProps } from "../types/primitives.types";
import { DeltaPill, Pill } from "./primitives";
import "./KpiStrip.scss";

export const KpiItem: React.FC<KpiItemProps> = ({
  label,
  value,
  delta,
  tag,
  context,
  href,
  state = "ready",
}) => {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "vi";
  const content = (
    <div className={`ops-kpi-item ops-kpi-item--${state}`}>
      <div className="ops-kpi-item__header">
        <span className="ops-kpi-item__label">{label}</span>
      </div>

      <div className="ops-kpi-item__body">
        {state === "loading" ? (
          <Skeleton.Input active size="small" style={{ width: 70, height: 34 }} />
        ) : state === "error" ? (
          <span className="ops-kpi-item__error" title={t("dashboard.opsView.kpi.loadError")}>
            <AlertCircle size={16} />
            <span>{t("dashboard.opsView.kpi.error")}</span>
          </span>
        ) : (
          <div className="ops-kpi-item__value-row">
            <span className="ops-kpi-item__value">
              {value !== null && value !== undefined
                ? value.toLocaleString(locale)
                : "—"}
            </span>
            {delta && <DeltaPill text={delta.text} tone={delta.tone} />}
            {tag && (
              <Pill className="ops-kpi-item__tag" tone={tag.tone}>
                {tag.text}
              </Pill>
            )}
          </div>
        )}
      </div>

      {context ? (
        <div className="ops-kpi-item__context">{context}</div>
      ) : state === "unavailable" ? (
        <div className="ops-kpi-item__context">{t("dashboard.opsView.kpi.unavailable")}</div>
      ) : null}
    </div>
  );

  return href ? (
    <Link className="ops-kpi-item-link" to={href}>
      {content}
    </Link>
  ) : (
    content
  );
};

export interface KpiStripProps {
  items: KpiItemProps[];
  className?: string;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  items,
  className = "",
}) => (
  <div className={`ops-kpi-strip ${className}`}>
    {items.map((item) => (
      <KpiItem key={item.label} {...item} />
    ))}
  </div>
);
