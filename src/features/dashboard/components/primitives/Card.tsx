import React from "react";
import "./primitives.scss";

export interface OpsCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: "default" | "ai";
  padding?: string | number;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const OpsCard: React.FC<OpsCardProps> = ({
  variant = "default",
  padding,
  title,
  extra,
  children,
  className = "",
  style,
  ...rest
}) => {
  const customStyle: React.CSSProperties = {
    ...(padding !== undefined ? { padding } : {}),
    ...style,
  };

  return (
    <div
      className={`ops-card ${variant === "ai" ? "ops-card--ai" : ""} ${className}`}
      style={customStyle}
      {...rest}
    >
      {(title || extra) && (
        <div className="ops-card__header">
          {title ? (
            typeof title === "string" ? (
              <h3 className="ops-card__title">{title}</h3>
            ) : (
              title
            )
          ) : <div />}
          {extra && <div className="ops-card__extra">{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default OpsCard;
