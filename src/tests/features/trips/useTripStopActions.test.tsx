import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refineCore from "@refinedev/core";
import { useTripStopActions } from "@/features/trips/useTripStopActions";
import type { TripStopExecution } from "@/types/tripExecution.types";

vi.mock("@refinedev/core", () => ({
  useCustom: vi.fn(),
  useCustomMutation: vi.fn(),
  useInvalidate: vi.fn(),
  useNotification: vi.fn(),
}));

describe("useTripStopActions", () => {
  const mockMutateAsync = vi.fn();
  const mockInvalidate = vi.fn();
  const mockOpenNotification = vi.fn();
  const mockRefetch = vi.fn();

  const sampleStops: TripStopExecution[] = [
    {
      id: "stop-2",
      tripId: "trip-100",
      order: 2,
      type: "DELIVERY",
      status: "PENDING",
      addressCity: "Chicago",
      addressState: "IL",
    },
    {
      id: "stop-1",
      tripId: "trip-100",
      order: 1,
      type: "PICKUP",
      status: "ARRIVED",
      addressCity: "Dallas",
      addressState: "TX",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(refineCore.useInvalidate).mockReturnValue(mockInvalidate);
    vi.mocked(refineCore.useNotification).mockReturnValue({
      open: mockOpenNotification,
      close: vi.fn(),
    });
    vi.mocked(refineCore.useCustom).mockReturnValue({
      data: { data: sampleStops },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof refineCore.useCustom>);
    vi.mocked(refineCore.useCustomMutation).mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: vi.fn(),
      isLoading: false,
      error: null,
      isSuccess: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof refineCore.useCustomMutation>);
  });

  it("loads and sorts stops by order ascending", () => {
    const { result } = renderHook(() => useTripStopActions("trip-100"));

    expect(result.current.stops).toHaveLength(2);
    // Order 1 is first even though returned second in raw array
    expect(result.current.stops[0].id).toBe("stop-1");
    expect(result.current.stops[0].order).toBe(1);
    expect(result.current.stops[1].id).toBe("stop-2");
    expect(result.current.stops[1].order).toBe(2);
  });

  it("executeTransition sends POST to correct endpoint for each action", async () => {
    mockMutateAsync.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useTripStopActions("trip-100"));

    // arrive
    await act(async () => {
      await result.current.executeTransition("arrive", "stop-2");
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trip-stops/stop-2/arrive",
      method: "post",
      values: {},
    });

    // startService
    await act(async () => {
      await result.current.executeTransition("startService", "stop-1");
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trip-stops/stop-1/start-service",
      method: "post",
      values: {},
    });

    // completeService
    await act(async () => {
      await result.current.executeTransition("completeService", "stop-1");
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trip-stops/stop-1/complete-service",
      method: "post",
      values: {},
    });

    // depart
    await act(async () => {
      await result.current.executeTransition("depart", "stop-1");
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trip-stops/stop-1/depart",
      method: "post",
      values: {},
    });

    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "trips",
      invalidates: ["detail"],
      id: "trip-100",
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("handles transition error and surfaces notification", async () => {
    const errorResponse = {
      message: "Trip stop cannot transition from ARRIVED to DEPARTED",
      status: 400,
    };
    mockMutateAsync.mockRejectedValueOnce(errorResponse);

    const { result } = renderHook(() => useTripStopActions("trip-100"));

    let success = true;
    await act(async () => {
      success = await result.current.executeTransition("depart", "stop-1");
    });

    expect(success).toBe(false);
    expect(mockOpenNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        message: "Trip stop cannot transition from ARRIVED to DEPARTED",
      }),
    );
  });
});
