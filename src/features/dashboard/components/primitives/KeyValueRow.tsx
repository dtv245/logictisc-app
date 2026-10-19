import React from "react";
import type { Tone } from "../../types/primitives.types";
import "./primitives.scss";

export interface KeyValueRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({
  label,
  value,
  className = "",
}) => {
  return (
    <div className={`ops-key-value-row ${className}`}>
      <span className="ops-key-value-row__label">{label}</span>
      <span className="ops-key-value-row__value">{value}</span>
    </div>
  );
};

export interface MeterBarProps {
  value: number; // 0 to 1
  tone?: Tone;
  className?: string;
}

export const MeterBar: React.FC<MeterBarProps> = ({
  value,
  tone = "info",
  className = "",
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div className={`ops-meter-bar ${className}`}>
      <div
        className={`ops-meter-bar__fill ops-meter-bar__fill--${tone}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export interface StatusTextProps {
  tone?: Tone;
  icon?: React.ReactNode;
  text: React.ReactNode;
  className?: string;
}

export const StatusText: React.FC<StatusTextProps> = ({
  tone = "neutral",
  icon,
  text,
  className = "",
}) => {
  return (
    <span className={`ops-status-text ops-status-text--${tone} ${className}`}>
      {icon}
      <span>{text}</span>
    </span>
  );
};
