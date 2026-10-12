import type { CustomParams } from "@refinedev/core";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FleetReportPage } from "@/pages/fleet/FleetReportPage";
import { renderFinance } from "@/tests/fixtures/FinanceTestHarness";
import { fleetReport, fleetPolicyId, fleetTruckId, otherFleetTruckId } from "@/tests/fixtures/fleet";
import { ApiHttpError } from "@/providers/api/httpError";
import type { Truck } from "@/types/truck.types";

const session = vi.hoisted(() => ({ tenantKey: "tenant-finance" }));
vi.mock("@/hooks/useCurrentTenant", () => ({
  useCurrentTenant: () => ({ tenant: session.tenantKey ? { tenantKey: session.tenantKey } : null }),
}));

const mockPolicies = [
  { id: fleetPolicyId, code: "FLEET_POLICY", version: 3 },
  { id: "44444444-4444-4444-8444-444444444444", code: "OTHER_POLICY", version: 1 },
];

const mockTrucks: Truck[] = [
  { id: fleetTruckId, licensePlate: "29C-12345", number: "TRK-01", type: "SEMI_TRAILER" } as Truck,
  { id: otherFleetTruckId, licensePlate: "51D-67890", number: "TRK-02", type: "FLATBED" } as Truck,
];

beforeEach(() => {
  session.tenantKey = "tenant-finance";
});

async function fill(
  container: HTMLElement,
  options?: {
    policyLabel?: string;
    trucks?: string[];
    useSelectAllTrucks?: boolean;
    startDate?: string;
    inclusiveEndDate?: string;
  },
) {
  const policyLabel = options?.policyLabel ?? "FLEET_POLICY (v3)";
  const useSelectAllTrucks = options?.useSelectAllTrucks ?? true;
  const trucks = options?.trucks ?? [fleetTruckId, otherFleetTruckId];
  const startDate = options?.startDate ?? "2026-10-01";
  const inclusiveEndDate = options?.inclusiveEndDate ?? "2026-10-01";

  await screen.findByRole("button", { name: "Load Report" });

  // 1. Policy Select
  const policyInput = container.querySelector("#policyId")!;
  fireEvent.mouseDown(policyInput);
  const policyOption = await screen.findByText(policyLabel);
  fireEvent.click(policyOption);

  // 2. Trucks Select
  if (useSelectAllTrucks) {
    const allBtn = screen.getByRole("button", { name: "All vehicles" });
    fireEvent.click(allBtn);
  } else {
    const trucksInput = container.querySelector("#truckIds")!;
    for (const tId of trucks) {
      fireEvent.mouseDown(trucksInput);
      const label = tId === fleetTruckId ? "29C-12345 (SEMI_TRAILER)" : "51D-67890 (FLATBED)";
      const opt = await screen.findByText(label);
      fireEvent.click(opt);
    }
  }

  // 3. Date Range Picker
  const dateInputs = container.querySelectorAll(".ant-picker-input input");
  fireEvent.change(dateInputs[0]!, { target: { value: startDate } });
  fireEvent.keyDown(dateInputs[0]!, { key: "Enter", code: "Enter" });
  fireEvent.blur(dateInputs[0]!);
  fireEvent.change(dateInputs[1]!, { target: { value: inclusiveEndDate } });
  fireEvent.keyDown(dateInputs[1]!, { key: "Enter", code: "Enter" });
  fireEvent.blur(dateInputs[1]!);
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Load Report" }));
}

describe("FleetReportPage", () => {
  it("does not prefetch and requests only the explicit date-only/time-zone/truck scope", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>(async () => fleetReport);
    const { container, client } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
    );

    // Initial state: no request made, submit button is disabled
    expect(request).not.toHaveBeenCalled();
    const loadBtn = await screen.findByRole("button", { name: "Load Report" });
    expect(loadBtn).toBeDisabled();

    // Fill the form: policy, all vehicles, date range 2026-10-01 -> 2026-10-01 (exclusive 2026-10-02)
    await fill(container);
    expect(request).not.toHaveBeenCalled();
    expect(loadBtn).not.toBeDisabled();

    // Verify confirmation line is rendered
    expect(screen.getByText(/From 00:00 01\/10 to end of 01\/10/)).toBeInTheDocument();

    submit();
    expect(await screen.findByText("FLEET_POLICY / 3")).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      url: "/api/reports/fleet/health",
      method: "get",
      query: {
        policyId: fleetPolicyId,
        truckIds: `${fleetTruckId},${otherFleetTruckId}`,
        firstDate: "2026-10-01",
        exclusiveLastDate: "2026-10-02",
        businessZoneId: "Asia/Ho_Chi_Minh",
      },
    });

    expect(screen.getByText("FLEET_REPORTING_V1 / 1")).toBeInTheDocument();
    expect(screen.getByText(/10\/01\/2026, 00:00.*10\/02\/2026, 00:00/)).toBeInTheDocument();
    expect(
      client
        .getQueryCache()
        .findAll()
        .some((query) => query.queryKey.includes("fleet-report") && query.queryKey.includes("tenant-finance")),
    ).toBe(true);

    // Remove the first truck tag to leave only otherFleetTruckId
    const removeIcons = container.querySelectorAll(".ant-select-selection-item-remove");
    expect(removeIcons.length).toBe(2);
    fireEvent.click(removeIcons[0]!);

    submit();
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]?.[0].query).toMatchObject({ truckIds: otherFleetTruckId });

    // Reset clears report and resets scope
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("FLEET_POLICY / 3")).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("shows loading separately from unavailable metrics, then renders coverage", async () => {
    let finish: (value: unknown) => void = () => undefined;
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
    );
    await fill(container);
    submit();

    expect(await screen.findByLabelText("Loading content")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();

    finish(fleetReport);
    expect(await screen.findByText("FLEET_POLICY / 3")).toBeInTheDocument();
    expect(screen.getByText("Historical PM due occurrences are unavailable.")).toBeInTheDocument();
    expect(screen.getByText(fleetTruckId)).toBeInTheDocument();
  });

  it("shows actionable domain errors/request ID and retries only the same report", async () => {
    const request = vi
      .fn<(x: CustomParams) => Promise<unknown>>()
      .mockRejectedValueOnce(
        new ApiHttpError({
          statusCode: 400,
          code: "INVALID_FLEET_REPORT_PERIOD",
          message: "Invalid period",
          requestId: "fleet-support",
        }),
      )
      .mockResolvedValueOnce(fleetReport);

    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
    );
    await fill(container);
    submit();

    expect(await screen.findByText(/Check the period.*fleet-support/)).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("FLEET_POLICY / 3");
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]?.[0].query).toEqual(request.mock.calls[1]?.[0].query);
  });

  it("distinguishes empty coverage from unavailable metrics and request failures", async () => {
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      async () => ({ ...fleetReport, coverage: [] }),
    );
    await fill(container);
    submit();

    await screen.findByText("FLEET_POLICY / 3");
    expect(await screen.findAllByText("No data")).not.toHaveLength(0);
    expect(screen.getByText("Historical PM due occurrences are unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load content")).not.toBeInTheDocument();
  });

  it("handles a missing report response as empty rather than zero metrics", async () => {
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      async () => null,
    );
    await fill(container);
    submit();

    expect(await screen.findByText("No data", { selector: "strong" })).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("renders server forbidden distinctly without retry or metrics", async () => {
    const request = vi.fn(async () => {
      throw new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Denied", requestId: null });
    });
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
    );
    await fill(container);
    submit();

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("keeps Load Report button disabled when required fields are missing or invalid", async () => {
    const request = vi.fn(async () => fleetReport);
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
    );

    const loadBtn = await screen.findByRole("button", { name: "Load Report" });
    // Initially disabled
    expect(loadBtn).toBeDisabled();

    // Select policy only
    const policyInput = container.querySelector("#policyId")!;
    fireEvent.mouseDown(policyInput);
    const policyOption = await screen.findByText("FLEET_POLICY (v3)");
    fireEvent.click(policyOption);
    expect(loadBtn).toBeDisabled();

    // Select trucks only
    const allBtn = screen.getByRole("button", { name: "All vehicles" });
    fireEvent.click(allBtn);
    expect(loadBtn).toBeDisabled();

    // Now set valid dates
    const dateInputs = container.querySelectorAll(".ant-picker-input input");
    fireEvent.change(dateInputs[0]!, { target: { value: "2026-10-01" } });
    fireEvent.keyDown(dateInputs[0]!, { key: "Enter", code: "Enter" });
    fireEvent.blur(dateInputs[0]!);
    fireEvent.change(dateInputs[1]!, { target: { value: "2026-10-01" } });
    fireEvent.keyDown(dateInputs[1]!, { key: "Enter", code: "Enter" });
    fireEvent.blur(dateInputs[1]!);

    // Now form is complete and valid -> button is enabled
    expect(loadBtn).not.toBeDisabled();
    expect(request).not.toHaveBeenCalled();
  });

  it("initializes form and scope directly from URL query parameters without manual fill", async () => {
    const request = vi.fn<(x: CustomParams) => Promise<unknown>>(async () => fleetReport);
    const url = `/?policyId=${fleetPolicyId}&truckIds=${fleetTruckId}&firstDate=2026-10-01&exclusiveLastDate=2026-10-02&businessZoneId=Asia/Ho_Chi_Minh`;

    await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      request,
      { initialEntries: [url] },
    );

    // Initialized from URL: report query executes automatically
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      url: "/api/reports/fleet/health",
      method: "get",
      query: {
        policyId: fleetPolicyId,
        truckIds: fleetTruckId,
        firstDate: "2026-10-01",
        exclusiveLastDate: "2026-10-02",
        businessZoneId: "Asia/Ho_Chi_Minh",
      },
    });

    expect(await screen.findByText("FLEET_POLICY / 3")).toBeInTheDocument();
    expect(screen.getByText(/From 00:00 01\/10 to end of 01\/10/)).toBeInTheDocument();
  });

  it("displays truck license plate and type without showing UUID in the options", async () => {
    const { container } = await renderFinance(
      <FleetReportPage policies={mockPolicies} trucks={mockTrucks} />,
      async () => fleetReport,
    );

    await screen.findByRole("button", { name: "Load Report" });

    const trucksInput = container.querySelector("#truckIds")!;
    fireEvent.mouseDown(trucksInput);

    // Option labels display license plate + vehicle type
    expect(await screen.findByText("29C-12345 (SEMI_TRAILER)")).toBeInTheDocument();
    expect(await screen.findByText("51D-67890 (FLATBED)")).toBeInTheDocument();

    // Does NOT display raw UUID in visible option text
    const visibleOptions = Array.from(document.querySelectorAll(".ant-select-item-option-content")).map(
      (el) => el.textContent,
    );
    expect(visibleOptions).toContain("29C-12345 (SEMI_TRAILER)");
    expect(visibleOptions).toContain("51D-67890 (FLATBED)");
    expect(visibleOptions.some((text) => text?.includes(fleetTruckId))).toBe(false);
    expect(visibleOptions.some((text) => text?.includes(otherFleetTruckId))).toBe(false);

    // Click "All vehicles" button
    const allBtn = screen.getByRole("button", { name: "All vehicles" });
    fireEvent.click(allBtn);

    // Selected count indicator displays
    expect(await screen.findByText("Selected: 2 / 200 trucks")).toBeInTheDocument();
  });

  it.each(["ADMIN", "ACCOUNTANT", "PAYROLL", "PAYROLL_MANAGER"])(
    "allows actual report role %s with no startup request",
    async (role) => {
      const request = vi.fn(async () => fleetReport);
      await renderFinance(<FleetReportPage policies={mockPolicies} trucks={mockTrucks} />, request, { role });
      expect(await screen.findByRole("button", { name: "Load Report" })).toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
    },
  );

  it.each(["DRIVER", "DISPATCHER", "FLEET_MANAGER", "SUPERADMIN", "UNKNOWN"])(
    "denies report entry for %s",
    async (role) => {
      const request = vi.fn(async () => fleetReport);
      await renderFinance(<FleetReportPage policies={mockPolicies} trucks={mockTrucks} />, request, { role });
      expect(await screen.findByText("Access denied")).toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
    },
  );

  it("does not request without a resolved tenant", async () => {
    session.tenantKey = "";
    const request = vi.fn(async () => fleetReport);
    await renderFinance(<FleetReportPage policies={mockPolicies} trucks={mockTrucks} />, request);
    expect(await screen.findByText("Access denied")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });
});
