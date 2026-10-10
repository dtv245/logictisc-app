import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refineCore from "@refinedev/core";
import { useTripDriverAssignments } from "@/features/trips/useTripDriverAssignments";
import type { TripDriverAssignment } from "@/types/tripExecution.types";

vi.mock("@refinedev/core", () => ({
  useCustom: vi.fn(),
  useCustomMutation: vi.fn(),
  useInvalidate: vi.fn(),
  useNotification: vi.fn(),
}));

describe("useTripDriverAssignments", () => {
  const mockMutateAsync = vi.fn();
  const mockInvalidate = vi.fn();
  const mockOpenNotification = vi.fn();
  const mockRefetch = vi.fn();

  const sampleAssignments: TripDriverAssignment[] = [
    {
      id: "assign-1",
      tripId: "trip-100",
      driverId: "drv-1",
      driverName: "John Doe",
      assignmentType: "PRIMARY",
      assignedAt: "2026-10-04T00:00:00Z",
      effectiveFrom: "2026-10-04T00:00:00Z",
      effectiveTo: null,
      plannedMiles: 300,
      actualMiles: null,
      isActive: true,
    },
    {
      id: "assign-2",
      tripId: "trip-100",
      driverId: "drv-2",
      driverName: "Jane Smith",
      assignmentType: "RELIEF",
      assignedAt: "2026-10-03T00:00:00Z",
      effectiveFrom: "2026-10-03T00:00:00Z",
      effectiveTo: "2026-10-03T12:00:00Z",
      plannedMiles: 150,
      actualMiles: 145,
      isActive: false,
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
      data: { data: sampleAssignments },
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

  it("loads driver assignments via useCustom", () => {
    const { result } = renderHook(() => useTripDriverAssignments("trip-100"));

    expect(result.current.drivers).toHaveLength(2);
    expect(result.current.drivers[0].driverName).toBe("John Doe");
    expect(result.current.drivers[0].isActive).toBe(true);
    expect(result.current.drivers[1].isActive).toBe(false);
  });

  it("assignDriver issues POST to /api/trips/:tripId/drivers and invalidates detail", async () => {
    mockMutateAsync.mockResolvedValueOnce({ data: sampleAssignments[0] });

    const { result } = renderHook(() => useTripDriverAssignments("trip-100"));

    let success = false;
    await act(async () => {
      success = await result.current.assignDriver({
        driverId: "drv-1",
        assignmentType: "PRIMARY",
        plannedMiles: 300,
      });
    });

    expect(success).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trips/trip-100/drivers",
      method: "post",
      values: {
        driverId: "drv-1",
        assignmentType: "PRIMARY",
        plannedMiles: 300,
      },
    });
    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "trips",
      invalidates: ["detail"],
      id: "trip-100",
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("unassignDriver issues POST to unassign endpoint, NEVER DELETE", async () => {
    mockMutateAsync.mockResolvedValueOnce({ data: { ...sampleAssignments[0], isActive: false } });

    const { result } = renderHook(() => useTripDriverAssignments("trip-100"));

    let success = false;
    await act(async () => {
      success = await result.current.unassignDriver("assign-1");
    });

    expect(success).toBe(true);
    // Verified: uses POST to /api/trips/:tripId/drivers/:assignmentId/unassign
    expect(mockMutateAsync).toHaveBeenCalledWith({
      url: "/api/trips/trip-100/drivers/assign-1/unassign",
      method: "post",
      values: {},
    });
    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "trips",
      invalidates: ["detail"],
      id: "trip-100",
    });
  });

  it("handles 409 conflict or other error and opens error notification", async () => {
    const errorResponse = {
      message: "Assignment is already closed",
      status: 409,
    };
    mockMutateAsync.mockRejectedValueOnce(errorResponse);

    const { result } = renderHook(() => useTripDriverAssignments("trip-100"));

    let success = true;
    await act(async () => {
      success = await result.current.unassignDriver("assign-1");
    });

    expect(success).toBe(false);
    expect(mockOpenNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        message: "Assignment is already closed",
      }),
    );
  });
});
