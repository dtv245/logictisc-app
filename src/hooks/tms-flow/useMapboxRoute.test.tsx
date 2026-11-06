import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMapboxDrivingRoute } from "@/api/mapbox/mapbox.api";
import { useMapboxRoute } from "@/hooks/tms-flow/useMapboxRoute";

vi.mock("@/api/mapbox/mapbox.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/mapbox/mapbox.api")>();
  return { ...actual, fetchMapboxDrivingRoute: vi.fn() };
});

const pickup = { latitude: 10.8, longitude: 106.6 };
const delivery = { latitude: 10.9, longitude: 106.7 };

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useMapboxRoute diagnostics", () => {
  beforeEach(() => {
    vi.mocked(fetchMapboxDrivingRoute).mockReset();
  });

  it("logs missing pickup and delivery coordinates without making a request", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(
      () => useMapboxRoute(null, delivery, { accessToken: "pk.test", enabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(warnSpy).toHaveBeenCalledWith(
      "[useMapboxRoute] Missing pickup coordinates; check the load address.",
    ));
    expect(result.current.isError).toBe(false);
    expect(fetchMapboxDrivingRoute).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it.each([401, 403])("logs a safe Directions authorization warning for HTTP %s", async (status) => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = { response: { status, data: { message: "bad token should not be logged" } } };
    vi.mocked(fetchMapboxDrivingRoute).mockRejectedValue(error);

    const { result } = renderHook(
      () => useMapboxRoute(pickup, delivery, { accessToken: "pk.never-log-this" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(warnSpy).toHaveBeenCalledWith(
      "[useMapboxRoute] Directions rejected the token or its permissions (HTTP 401/403).",
    );
    expect(warnSpy.mock.calls.flat().join(" ")).not.toContain("pk.never-log-this");
    expect(warnSpy.mock.calls.flat().join(" ")).not.toContain("bad token should not be logged");
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("pk.never-log-this");
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("bad token should not be logged");
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs a distinct quota warning for a rate-limited Directions request", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetchMapboxDrivingRoute).mockRejectedValue({ response: { status: 429 } });

    const { result } = renderHook(
      () => useMapboxRoute(pickup, delivery, { accessToken: "pk.test" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(warnSpy).toHaveBeenCalledWith(
      "[useMapboxRoute] Directions request exceeded the Mapbox quota or rate limit.",
    );
    expect(errorSpy.mock.calls.flat().join(" ")).not.toContain("pk.test");
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
