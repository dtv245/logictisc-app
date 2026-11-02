import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriverSelfProfilePage } from "@/pages/drivers/DriverProfilePage";
import { setTestLocale } from "@/tests/testLocale";
import { ApiHttpError } from "@/utils/httpError";

const fixture = vi.hoisted(() => ({
  roles: ["DRIVER"] as string[],
  state: { data: undefined as unknown, error: undefined as unknown, loading: false },
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { roles: fixture.roles }, isLoading: false }),
}));

vi.mock("@/hooks/drivers/useDriverProfileRequest", () => ({
  useDriverProfileRequest: (_load: unknown, enabled = true) => enabled
    ? { ...fixture.state, reload: vi.fn() }
    : { data: undefined, error: undefined, loading: false, reload: vi.fn() },
}));

describe("driver self profile", () => {
  beforeEach(async () => {
    fixture.roles = ["DRIVER"];
    fixture.state = {
      data: {
        id: "profile-1",
        driverId: "driver-1",
        dateOfBirth: "1990-01-02",
        nationalIdNumber: "****1234",
        personalTaxCode: null,
      },
      error: undefined,
      loading: false,
    };
    await setTestLocale("en");
  });

  it("renders masked profile data without administrative sensitive actions", () => {
    render(<MemoryRouter><DriverSelfProfilePage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "My driver profile" })).toBeInTheDocument();
    expect(screen.getByText("****1234")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View full details" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("denies non-driver roles before loading profile sections", () => {
    fixture.roles = ["DISPATCHER"];
    render(<MemoryRouter><DriverSelfProfilePage /></MemoryRouter>);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });

  it("renders the backend 403 state for a forbidden self endpoint", () => {
    fixture.state = {
      data: undefined,
      error: new ApiHttpError({ statusCode: 403, code: "FORBIDDEN", message: "Forbidden", requestId: "profile-403" }),
      loading: false,
    };
    render(<MemoryRouter><DriverSelfProfilePage /></MemoryRouter>);

    expect(screen.getByText("Access denied")).toBeInTheDocument();
  });
});
