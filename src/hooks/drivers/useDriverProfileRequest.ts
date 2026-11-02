import { useCallback, useEffect, useState } from "react";

export interface DriverProfileRequestState<TData> {
  data: TData | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

/** Keeps profile data in the mounted screen only; requests are aborted on exit. */
export const useDriverProfileRequest = <TData>(
  load: (signal: AbortSignal) => Promise<TData>,
  enabled = true,
): DriverProfileRequestState<TData> => {
  const [requestVersion, setRequestVersion] = useState(0);
  const [completed, setCompleted] = useState<{
    load: (signal: AbortSignal) => Promise<TData>;
    requestVersion: number;
    data?: TData;
    error?: unknown;
  }>();

  const reload = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    void load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setCompleted({ load, requestVersion, data });
      },
      (reason: unknown) => {
        if (!controller.signal.aborted) setCompleted({ load, requestVersion, error: reason });
      },
    );

    return () => controller.abort();
  }, [enabled, load, requestVersion]);

  const isCurrent = enabled && completed?.load === load && completed.requestVersion === requestVersion;
  return {
    data: isCurrent ? completed.data : undefined,
    error: isCurrent ? completed.error : undefined,
    loading: enabled && !isCurrent,
    reload,
  };
};
