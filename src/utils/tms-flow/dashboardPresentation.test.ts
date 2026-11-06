import { afterEach, describe, expect, it, vi } from "vitest";

import { getDashboardStatusLabel } from "@/utils/tms-flow/dashboardPresentation";

describe("dashboard operational status labels", () => {
  afterEach(() => vi.restoreAllMocks());

  it("translates known statuses and warns for an unknown enum", () => {
    const translate = (key: string) => key;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(getDashboardStatusLabel("open", translate)).toBe("tmsDashboard.statuses.open");
    expect(getDashboardStatusLabel("unrecognized_status", translate)).toBe("tmsDashboard.unknownStatus");
    expect(warn).toHaveBeenCalledWith("[TmsDashboard] Unknown operational load status: unrecognized_status");
  });
});
