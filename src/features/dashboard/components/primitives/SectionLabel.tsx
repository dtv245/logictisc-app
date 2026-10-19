import React from "react";
import "./primitives.scss";

export interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({
  children,
  className = "",
}) => {
  return <span className={`ops-section-label ${className}`}>{children}</span>;
};
