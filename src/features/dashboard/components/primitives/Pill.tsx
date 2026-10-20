import React from "react";
import type { Tone } from "../../types/primitives.types";
import "./primitives.scss";

export interface PillProps {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Pill: React.FC<PillProps> = ({
  tone = "neutral",
  icon,
  children,
  className = "",
  onClick,
}) => {
  const content = <>
    {icon && <span className="ops-pill__icon">{icon}</span>}
    <span>{children}</span>
  </>;

  if (onClick) {
    return <button className={`ops-pill ops-pill--${tone} ${className}`} onClick={onClick} type="button">{content}</button>;
  }

  return <span className={`ops-pill ops-pill--${tone} ${className}`}>{content}</span>;
};

export interface DeltaPillProps {
  text: string;
  tone?: Tone;
  className?: string;
}

export const DeltaPill: React.FC<DeltaPillProps> = ({
  text,
  tone = "neutral",
  className = "",
}) => {
  return (
    <span className={`ops-delta-pill ops-delta-pill--${tone} ${className}`}>
      {text}
    </span>
  );
};
