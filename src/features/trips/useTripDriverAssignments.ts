import { useCustom, useCustomMutation, useInvalidate, useNotification } from "@refinedev/core";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type {
  AssignDriverPayload,
  TripDriverAssignment,
} from "@/types/tripExecution.types";
import { TRIP_EXECUTION_ENDPOINTS } from "./tripExecution.api";

export interface UseTripDriverAssignmentsReturn {
  drivers: TripDriverAssignment[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  isSubmitting: boolean;
  assignDriver: (payload: AssignDriverPayload) => Promise<boolean>;
  unassignDriver: (assignmentId: string) => Promise<boolean>;
}

export const useTripDriverAssignments = (
  tripId: string,
): UseTripDriverAssignmentsReturn => {
  const { t } = useTranslation();
  const invalidate = useInvalidate();
  const { open } = useNotification();
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustom<TripDriverAssignment[], ApiError>({
    url: TRIP_EXECUTION_ENDPOINTS.drivers(tripId),
    method: "get",
    queryOptions: {
      enabled: Boolean(tripId),
    },
  });

  const { mutateAsync: mutateCustom } = useCustomMutation<
    TripDriverAssignment,
    ApiError
  >();

  const assignDriver = useCallback(
    async (payload: AssignDriverPayload): Promise<boolean> => {
      if (isSubmittingRef.current) {
        return false;
      }
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        await mutateCustom({
          url: TRIP_EXECUTION_ENDPOINTS.drivers(tripId),
          method: "post",
          values: payload,
        });

        open?.({
          type: "success",
          message: t("trips.driverAssignments.assignSuccess", "Driver assigned successfully"),
        });

        invalidate({
          resource: "trips",
          invalidates: ["detail"],
          id: tripId,
        });
        refetch();
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        open?.({
          type: "error",
          message:
            apiError?.message ||
            t("trips.driverAssignments.assignFailed", "Failed to assign driver"),
        });
        return false;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [tripId, mutateCustom, open, t, invalidate, refetch],
  );

  const unassignDriver = useCallback(
    async (assignmentId: string): Promise<boolean> => {
      if (isSubmittingRef.current) {
        return false;
      }
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        // Crucial: calls POST unassign endpoint, NEVER DELETE!
        await mutateCustom({
          url: TRIP_EXECUTION_ENDPOINTS.unassign(tripId, assignmentId),
          method: "post",
          values: {},
        });

        open?.({
          type: "success",
          message: t(
            "trips.driverAssignments.unassignSuccess",
            "Driver unassigned successfully",
          ),
        });

        invalidate({
          resource: "trips",
          invalidates: ["detail"],
          id: tripId,
        });
        refetch();
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        open?.({
          type: "error",
          message:
            apiError?.message ||
            t(
              "trips.driverAssignments.unassignFailed",
              "Failed to unassign driver",
            ),
        });
        return false;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [tripId, mutateCustom, open, t, invalidate, refetch],
  );

  const drivers = Array.isArray(data?.data) ? data.data : [];

  return {
    drivers,
    isLoading,
    isError,
    error: (error as ApiError) || null,
    refetch: () => void refetch(),
    isSubmitting,
    assignDriver,
    unassignDriver,
  };
};
