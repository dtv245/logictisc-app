import { useCallback } from "react";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import type { DriverDirectoryItem } from "@/types/drivers/driver-profile.types";

export const useDriver = (id: string | undefined) => {
  const load = useCallback(
    (signal: AbortSignal) => id
      ? driverProfileApi.getDriver(id, signal)
      : Promise.reject(new Error("DRIVER_ID_REQUIRED")),
    [id],
  );
  const request = useDriverProfileRequest<DriverDirectoryItem>(load, Boolean(id));
  return { data: request.data, isLoading: request.loading, error: request.error, reload: request.reload };
};
