import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriverExpiringPage } from "./DriverExpiringPage";
import { setTestLocale } from "@/tests/testLocale";
import { ApiHttpError } from "@/utils/httpError";

const fixture = vi.hoisted(() => ({ listExpiring: vi.fn() }));

vi.mock("@/api/drivers/driver-profile.api", () => ({
  driverProfileApi: { listExpiring: fixture.listExpiring },
}));

const emptyPage = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 20,
  hasNext: false,
};

const renderPage = () =>
  render(<MemoryRouter initialEntries={["/drivers/expiring"]}><DriverExpiringPage /></MemoryRouter>);

const httpError = (statusCode: number, code: string, message: string) =>
  new ApiHttpError({ statusCode, code, message, requestId: null });

describe("DriverExpiringPage", () => {
  beforeEach(async () => {
    fixture.listExpiring.mockReset();
    await setTestLocale("en");
  });

  it("uses the expiring list endpoint and shows guidance when the server lacks the route", async () => {
    fixture.listExpiring.mockRejectedValue(httpError(
      400,
      "VALIDATION_FAILED",
      "Request parameter 'id' with value 'expiring' is invalid; expected type 'UUID'",
    ));

    renderPage();

    expect(await screen.findByText("Expiring documents are not available on this server.")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load content")).not.toBeInTheDocument();
    expect(fixture.listExpiring).toHaveBeenCalledTimes(1);
    expect(fixture.listExpiring).toHaveBeenCalledWith(
      expect.objectContaining({ days: 30, page: 1 }),
      expect.any(AbortSignal),
    );
  });

  it("renders the empty table state when the server returns no expiring documents", async () => {
    fixture.listExpiring.mockResolvedValue(emptyPage);

    renderPage();

    expect(await screen.findByText("No documents match these filters.")).toBeInTheDocument();
    expect(screen.queryByText("Expiring documents are not available on this server.")).not.toBeInTheDocument();
  });

  it("keeps the retry error state for other server failures", async () => {
    fixture.listExpiring.mockRejectedValue(httpError(500, "INTERNAL_ERROR", "Server exploded"));

    renderPage();

    expect(await screen.findByText("Unable to load content")).toBeInTheDocument();
    expect(screen.getByText("Server exploded")).toBeInTheDocument();
  });
});
