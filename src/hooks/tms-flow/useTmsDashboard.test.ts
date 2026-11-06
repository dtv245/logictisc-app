import { describe, expect, it } from "vitest";

import {
  dashboardCountFromServer,
  dashboardCountUnavailable,
  dashboardCountValue,
  getRefineServerTotal,
} from "@/hooks/tms-flow/useTmsDashboard";

describe("dashboard server counts", () => {
  it("shows an unavailable marker when the count request fails instead of displaying zero", () => {
    const count = dashboardCountFromServer({ isError: true, total: undefined });
    expect(count).toEqual({ state: "error" });
    expect(dashboardCountValue(count)).toBeUndefined();
  });

  it("keeps the count stable when a server page size changes", () => {
    const pageSizeTen = dashboardCountFromServer({ total: getRefineServerTotal({ data: Array(10), total: 81 }) });
    const pageSizeOne = dashboardCountFromServer({ total: getRefineServerTotal({ data: [{}], total: 81 }) });
    expect(pageSizeTen).toEqual({ state: "ready", value: 81 });
    expect(pageSizeOne).toEqual(pageSizeTen);
  });

  it("preserves a real zero from the server", () => {
    expect(dashboardCountFromServer({ total: 0 })).toEqual({ state: "ready", value: 0 });
  });

  it("keeps lifecycle counts unavailable when the server cannot filter their source timestamps", () => {
    expect(dashboardCountUnavailable("attention-filter-unavailable")).toEqual({
      state: "unavailable",
      reason: "attention-filter-unavailable",
    });
    expect(dashboardCountUnavailable("unassigned-filter-unavailable")).toEqual({
      state: "unavailable",
      reason: "unassigned-filter-unavailable",
    });
    expect(dashboardCountUnavailable("server-filter-unavailable")).toEqual({
      state: "unavailable",
      reason: "server-filter-unavailable",
    });
    expect(dashboardCountUnavailable("lifecycle-filter-unavailable")).toEqual({
      state: "unavailable",
      reason: "lifecycle-filter-unavailable",
    });
  });
});
