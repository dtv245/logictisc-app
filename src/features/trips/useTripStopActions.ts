import { useCustom, useCustomMutation, useInvalidate, useNotification } from "@refinedev/core";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApiError } from "@/types/api.types";
import type { TripStopExecution } from "@/types/tripExecution.types";
import { TRIP_EXECUTION_ENDPOINTS } from "./tripExecution.api";

export type TripStopAction = "arrive" | "startService" | "completeService" | "depart";

export interface UseTripStopActionsReturn {
  stops: TripStopExecution[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  isSubmitting: boolean;
  executeTransition: (action: TripStopAction, stopId: string) => Promise<boolean>;
}

export const useTripStopActions = (tripId: string): UseTripStopActionsReturn => {
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
  } = useCustom<TripStopExecution[], ApiError>({
    url: TRIP_EXECUTION_ENDPOINTS.stops(tripId),
    method: "get",
    queryOptions: {
      enabled: Boolean(tripId),
    },
  });

  const { mutateAsync: mutateCustom } = useCustomMutation<
    TripStopExecution,
    ApiError
  >();

  const getActionUrl = (action: TripStopAction, stopId: string): string => {
    switch (action) {
      case "arrive":
        return TRIP_EXECUTION_ENDPOINTS.arrive(stopId);
      case "startService":
        return TRIP_EXECUTION_ENDPOINTS.startService(stopId);
      case "completeService":
        return TRIP_EXECUTION_ENDPOINTS.completeService(stopId);
      case "depart":
        return TRIP_EXECUTION_ENDPOINTS.depart(stopId);
    }
  };

  const executeTransition = useCallback(
    async (action: TripStopAction, stopId: string): Promise<boolean> => {
      if (isSubmittingRef.current) {
        return false;
      }
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      const url = getActionUrl(action, stopId);

      try {
        await mutateCustom({
          url,
          method: "post",
          values: {},
        });

        open?.({
          type: "success",
          message: t(
            `trips.execution.actions.${action}Success`,
            "Stop status updated successfully",
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
              `trips.execution.actions.${action}Failed`,
              "Failed to update stop status",
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

  const rawStops = Array.isArray(data?.data) ? data.data : [];
  // Ensure stops are sorted by order ascending
  const stops = [...rawStops].sort((a, b) => a.order - b.order);

  return {
    stops,
    isLoading,
    isError,
    error: (error as ApiError) || null,
    refetch: () => void refetch(),
    isSubmitting,
    executeTransition,
  };
};
