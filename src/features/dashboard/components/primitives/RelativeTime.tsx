import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./primitives.scss";

dayjs.extend(relativeTime);

export interface RelativeTimeProps {
  at: string; // ISO date string
  staleAfterMs?: number; // e.g. 5 minutes = 300,000 ms
  className?: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
  at,
  staleAfterMs = 300_000,
  className = "",
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const time = dayjs(at);
  const diffMs = Math.abs(dayjs().diff(time));
  const isStale = diffMs > staleAfterMs;
  const fromNow = time.fromNow();

  return (
    <span
      className={`ops-relative-time ${isStale ? "ops-relative-time--stale" : ""} ${className}`}
      title={at}
    >
      {fromNow}
      {isStale && " (cũ)"}
    </span>
  );
};

export interface UnitValueProps {
  kind: "speed" | "temp" | "weight" | "distance";
  value: number | string | null | undefined;
  className?: string;
}

export const UnitValue: React.FC<UnitValueProps> = ({
  kind,
  value,
  className = "",
}) => {
  if (value === null || value === undefined || value === "") {
    return <span className={className}>—</span>;
  }

  const units: Record<string, string> = {
    speed: "km/h",
    temp: "°C",
    weight: "kg",
    distance: "km",
  };

  const unit = units[kind] || "";
  const numVal = typeof value === "number" ? value.toLocaleString("vi-VN") : value;

  return (
    <span className={`ops-unit-value ${className}`}>
      {numVal} {unit}
    </span>
  );
};
