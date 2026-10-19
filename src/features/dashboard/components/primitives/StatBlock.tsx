import React from "react";
import { Skeleton } from "antd";
import type { StatBlockProps, Tone } from "../../types/primitives.types";
import "./primitives.scss";

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  caption,
  tone = "neutral",
  state = "ready",
  className = "",
}) => {
  if (state === "loading") {
    return (
      <div className={`ops-stat-block ${className}`}>
        <span className="ops-stat-block__label">{label}</span>
        <Skeleton.Input active size="small" style={{ width: 80, height: 24 }} />
      </div>
    );
  }

  if (state === "unavailable") {
    return (
      <div className={`ops-stat-block ${className}`}>
        <span className="ops-stat-block__label">{label}</span>
        <span className="ops-stat-block__value ops-stat-block__value--neutral">—</span>
        <span className="ops-stat-block__caption ops-stat-block__caption--neutral">
          Chưa có dữ liệu
        </span>
      </div>
    );
  }

  return (
    <div className={`ops-stat-block ${className}`}>
      <span className="ops-stat-block__label">{label}</span>
      <span className={`ops-stat-block__value ops-stat-block__value--${tone}`}>
        {value}
      </span>
      {caption && (
        <span
          className={`ops-stat-block__caption ops-stat-block__caption--${caption.tone || "neutral"}`}
        >
          {caption.icon}
          {caption.text}
        </span>
      )}
    </div>
  );
};

export interface MetricStripItem {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
}

export interface MetricStripProps {
  items: MetricStripItem[];
  className?: string;
}

export const MetricStrip: React.FC<MetricStripProps> = ({
  items,
  className = "",
}) => {
  return (
    <div className={`ops-metric-strip ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <div className="ops-metric-strip__divider" />}
          <div className="ops-metric-strip__item">
            <span className="ops-stat-block__label">{item.label}</span>
            <span
              className={`ops-stat-block__value ops-stat-block__value--${item.tone || "neutral"}`}
              style={{ fontSize: 16 }}
            >
              {item.value}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
