import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DriverProfileSection } from "./DriverProfileSection";
import type { DriverProfileSectionDefinition } from "./driverProfileSections";
import { setTestLocale } from "@/tests/testLocale";
import { ApiHttpError } from "@/utils/httpError";

const DRIVER_ID = "6f1c2a84-3b7d-4c7e-9f5a-1d2e3f4a5b6c";

const definitionWithList = (
  list: NonNullable<DriverProfileSectionDefinition["list"]>,
): DriverProfileSectionDefinition => ({
  key: "licenses",
  labelKey: "driverProfile.tabs.licenses",
  group: "operations",
  fields: [],
  columns: ["licenseNumber"],
  list,
});

const httpError = (statusCode: number, message: string) =>
  new ApiHttpError({ statusCode, code: `HTTP_${statusCode}`, message, requestId: null });

describe("DriverProfileSection list states", () => {
  beforeEach(async () => {
    await setTestLocale("en");
  });

  it("shows a guided empty state instead of the 404 page when a sub-resource returns 404", async () => {
    const definition = definitionWithList(() =>
      Promise.reject(httpError(404, "Requested resource was not found")));

    render(<DriverProfileSection definition={definition} driverId={DRIVER_ID} />);

    expect(await screen.findByText("No records found for this section.")).toBeInTheDocument();
    expect(screen.getByText("No records yet.")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("keeps the retry error state for non-404 failures", async () => {
    const definition = definitionWithList(() =>
      Promise.reject(httpError(500, "Server exploded")));

    render(<DriverProfileSection definition={definition} driverId={DRIVER_ID} />);

    expect(await screen.findByText("Unable to load content")).toBeInTheDocument();
    expect(screen.getByText("Server exploded")).toBeInTheDocument();
    expect(screen.queryByText("No records found for this section.")).not.toBeInTheDocument();
  });

  it("keeps the forbidden state for 403 responses", async () => {
    const definition = definitionWithList(() =>
      Promise.reject(httpError(403, "Forbidden")));

    render(<DriverProfileSection definition={definition} driverId={DRIVER_ID} />);

    expect(await screen.findByText("Access denied")).toBeInTheDocument();
  });
});
