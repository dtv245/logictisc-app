import type { TmsScenario } from "@/types/tms-flow/tmsFlow.types";

const SCENARIOS: readonly TmsScenario[] = [
  "normal",
  "stale-approval",
  "network-error",
  "stale-assignment",
  "expired-link",
  "read-only",
];

export const parseTmsScenario = (value: string | null | undefined): TmsScenario =>
  SCENARIOS.find((scenario) => scenario === value) ?? "normal";
