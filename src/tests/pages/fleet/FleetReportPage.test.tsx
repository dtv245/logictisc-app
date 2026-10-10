import type { CustomParams } from "@refinedev/core";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FleetReportPage } from "@/pages/fleet/FleetReportPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { fleetReport, fleetPolicyId, fleetTruckId, otherFleetTruckId } from "@/tests/fixtures/fleet";
import { ApiHttpError } from "@/providers/api/httpError";
const session = vi.hoisted(() => ({ tenantKey: "tenant-finance" }));
vi.mock("@/hooks/useCurrentTenant", () => ({ useCurrentTenant: () => ({ tenant: session.tenantKey ? { tenantKey: session.tenantKey } : null }) }));
beforeEach(() => { session.tenantKey = "tenant-finance"; });
async function fill(trucks = `${fleetTruckId}, ${otherFleetTruckId}, `) {
  await screen.findByRole("button", { name: "Load Report" });
  fireEvent.change(screen.getByLabelText("Published Policy ID"), { target: { value: fleetPolicyId } });
  fireEvent.change(screen.getByLabelText("Truck IDs"), { target: { value: trucks } });
  fireEvent.change(screen.getByLabelText("Business Time Zone"), { target: { value: "Asia/Ho_Chi_Minh" } });
  for (const [label, value] of [["First Date", "2026-10-01"], ["Last Date (exclusive)", "2026-10-02"]]) {
    const input = screen.getByLabelText(label!); fireEvent.change(input, { target: { value } }); fireEvent.keyDown(input, { key: "Enter", code: "Enter" }); fireEvent.blur(input);
  }
}
function submit() { fireEvent.click(screen.getByRole("button", { name: "Load Report" })); }
describe("FleetReportPage", () => {
  it("does not prefetch and requests only the explicit date-only/time-zone/truck scope", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>(async () => fleetReport);
    const { client } = await renderFinance(<FleetReportPage />, request); await fill(); expect(request).not.toHaveBeenCalled(); submit();
    expect(await screen.findByText("FLEET_POLICY / 3")).toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: "/api/reports/fleet/health", method: "get", query: { policyId: fleetPolicyId, truckIds: `${fleetTruckId},${otherFleetTruckId}`, firstDate: "2026-10-01", exclusiveLastDate: "2026-10-02", businessZoneId: "Asia/Ho_Chi_Minh" } });
    expect(screen.getByText("FLEET_REPORTING_V1 / 1")).toBeInTheDocument(); expect(screen.getByText(/10\/01\/2026, 00:00.*10\/02\/2026, 00:00/)).toBeInTheDocument();
    expect(client.getQueryCache().findAll().some((query) => query.queryKey.includes("fleet-report") && query.queryKey.includes("tenant-finance"))).toBe(true);
    fireEvent.change(screen.getByLabelText("Truck IDs"), { target: { value: otherFleetTruckId } }); submit(); await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]?.[0].query).toMatchObject({ truckIds: otherFleetTruckId });
    fireEvent.click(screen.getByRole("button", { name: "Reset" })); expect(screen.queryByText("FLEET_POLICY / 3")).not.toBeInTheDocument(); expect(request).toHaveBeenCalledTimes(2);
  });
  it("shows loading separately from unavailable metrics, then renders coverage", async () => {
    let finish: (value: unknown) => void = () => undefined; const request = vi.fn<(x: CustomParams) => Promise<unknown>>(() => new Promise((resolve) => { finish = resolve; }));
    await renderFinance(<FleetReportPage />, request); await fill(); submit(); expect(await screen.findByLabelText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument(); finish(fleetReport); expect(await screen.findByText("FLEET_POLICY / 3")).toBeInTheDocument();
    expect(screen.getByText("Historical PM due occurrences are unavailable.")).toBeInTheDocument(); expect(screen.getByText(fleetTruckId)).toBeInTheDocument();
  });
  it("shows actionable domain errors/request ID and retries only the same report", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>().mockRejectedValueOnce(new ApiHttpError({ statusCode: 400, code: "INVALID_FLEET_REPORT_PERIOD", message: "Invalid period", requestId: "fleet-support" })).mockResolvedValueOnce(fleetReport);
    await renderFinance(<FleetReportPage />, request); await fill(); submit(); expect(await screen.findByText(/Check the period.*fleet-support/)).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Try again" })); await screen.findByText("FLEET_POLICY / 3");
    expect(request).toHaveBeenCalledTimes(2); expect(request.mock.calls[0]?.[0].query).toEqual(request.mock.calls[1]?.[0].query);
  });
  it("distinguishes empty coverage from unavailable metrics and request failures", async () => {
    await renderFinance(<FleetReportPage />, async () => ({ ...fleetReport, coverage: [] })); await fill(); submit(); await screen.findByText("FLEET_POLICY / 3");
    expect(await screen.findAllByText("No data")).not.toHaveLength(0); expect(screen.getByText("Historical PM due occurrences are unavailable.")).toBeInTheDocument(); expect(screen.queryByText("Unable to load content")).not.toBeInTheDocument();
  });
  it("handles a missing report response as empty rather than zero metrics", async () => {
    await renderFinance(<FleetReportPage />, async () => null); await fill(); submit(); expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument(); expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });
  it("renders server forbidden distinctly without retry or metrics", async () => {
    const request = vi.fn(async () => { throw new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Denied", requestId: null }); });
    await renderFinance(<FleetReportPage />, request); await fill(); submit(); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(screen.queryByText("No data")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
  it("rejects duplicate scope, reversed period and invalid time zone before requesting", async () => {
    const request = vi.fn(async () => fleetReport); await renderFinance(<FleetReportPage />, request); await fill(`${fleetTruckId},${fleetTruckId}`);
    fireEvent.change(screen.getByLabelText("Business Time Zone"), { target: { value: "Unknown/Zone" } });
    const last = screen.getByLabelText("Last Date (exclusive)"); fireEvent.change(last, { target: { value: "2026-09-30" } }); fireEvent.keyDown(last, { key: "Enter", code: "Enter" }); fireEvent.blur(last); submit();
    expect(await screen.findByText("Enter 1–200 distinct truck UUIDs separated by commas or spaces.")).toBeInTheDocument(); expect(await screen.findByText("The exclusive last date must follow the first date.")).toBeInTheDocument(); expect(await screen.findByText("Enter a valid IANA time zone.")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it.each(["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"])("allows actual report role %s with no startup request", async (role) => {
    const request = vi.fn(async () => fleetReport); await renderFinance(<FleetReportPage />, request, { role }); expect(await screen.findByRole("button", { name: "Load Report" })).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it.each(["DRIVER", "DISPATCHER", "FLEET_MANAGER", "SUPERADMIN", "UNKNOWN"])("denies report entry for %s", async (role) => {
    const request = vi.fn(async () => fleetReport); await renderFinance(<FleetReportPage />, request, { role }); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
  it("does not request without a resolved tenant", async () => {
    session.tenantKey = ""; const request = vi.fn(async () => fleetReport); await renderFinance(<FleetReportPage />, request); expect(await screen.findByText("Access denied")).toBeInTheDocument(); expect(request).not.toHaveBeenCalled();
  });
});
