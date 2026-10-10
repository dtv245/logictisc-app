import { describe, expect, it } from "vitest";
import { formatDateTime } from "@formatters/dateTime";
import { ALLOWED_NEXT_ACTIONS, TRIP_ASSIGNMENT_TYPES } from "@/features/trips/tripExecution.api";
import type {
  TripDriverAssignment,
  TripStopExecution,
} from "@/types/tripExecution.types";

describe("Trip Execution contract tests", () => {
  it("verifies TripDriverAssignment contract with ISO timestamps and active flag", () => {
    const assignment: TripDriverAssignment = {
      id: "a1",
      tripId: "t1",
      driverId: "d1",
      driverName: "Michael Driver",
      assignmentType: "PRIMARY",
      assignedAt: "2026-10-04T05:00:00Z",
      effectiveFrom: "2026-10-04T06:00:00Z",
      effectiveTo: null,
      plannedMiles: 450.5,
      actualMiles: null,
      isActive: true,
    };

    expect(assignment.isActive).toBe(true);
    expect(TRIP_ASSIGNMENT_TYPES).toContain(assignment.assignmentType);
    expect(formatDateTime(assignment.effectiveFrom, { timeZone: "UTC", locale: "en-GB" })).toBe(
      "04/10/2026, 06:00",
    );
  });

  it("verifies TripStopExecution contract and action transition state matrix", () => {
    const stop: TripStopExecution = {
      id: "s1",
      tripId: "t1",
      order: 1,
      type: "PICKUP",
      status: "ARRIVED",
      appointmentStart: "2026-10-04T08:00:00Z",
      appointmentEnd: "2026-10-04T10:00:00Z",
      arrivedAt: "2026-10-04T08:15:00Z",
      serviceStartedAt: null,
      serviceCompletedAt: null,
      departedAt: null,
      dwellMinutes: 0,
      addressCity: "Dallas",
      addressState: "TX",
    };

    expect(stop.status).toBe("ARRIVED");
    const nextAction = ALLOWED_NEXT_ACTIONS[stop.status];
    expect(nextAction).toBeDefined();
    expect(nextAction?.action).toBe("startService");
    expect(nextAction?.targetStatus).toBe("SERVICE_STARTED");
  });

  it("verifies terminal stop status DEPARTED has no next action", () => {
    expect(ALLOWED_NEXT_ACTIONS.DEPARTED).toBeNull();
  });
});
