/**
 * Deterministic demo clock and formatting helpers.
 *
 * The demo never reads the wall clock: every screen uses DEMO_NOW so ETA,
 * expiry and freshness stay consistent with the specification and with tests.
 */

import type { IsoDateTime, TimeWindow } from "@/types/tms-flow/tmsFlow.types";

export const DEMO_NOW: IsoDateTime = "2026-10-05T15:20:00-07:00";
export const DEMO_TIME_ZONE = "America/Los_Angeles";
export const DEMO_DATE_LABEL = "Monday, October 5, 2026";

export const formatTime = (value: IsoDateTime): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DEMO_TIME_ZONE,
  }).format(new Date(value));

export const formatDate = (value: IsoDateTime): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: DEMO_TIME_ZONE,
  }).format(new Date(value));

export const formatWindow = (window: TimeWindow): string =>
  `${formatTime(window.start)}–${formatTime(window.end)}`;

export const minutesSince = (from: IsoDateTime, to: IsoDateTime = DEMO_NOW): number =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);

export const addMinutes = (value: IsoDateTime, minutes: number): IsoDateTime =>
  new Date(new Date(value).getTime() + minutes * 60_000).toISOString();

export const isOutsideWindow = (eta: IsoDateTime, window: TimeWindow): boolean =>
  new Date(eta).getTime() > new Date(window.end).getTime();

export const isBeforeWindow = (eta: IsoDateTime, window: TimeWindow): boolean =>
  new Date(eta).getTime() < new Date(window.start).getTime();

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${hours}h${String(rest).padStart(2, "0")}m`;
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);

export const formatMiles = (value: number): string => `${value.toFixed(1)} mi`;

export const formatPercent = (value: number): string => `${Math.round(value)}%`;
