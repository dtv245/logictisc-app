import { useFrozenCustomMutation } from "@/hooks/useFrozenCustomMutation";
/** Real run/accept workflow: shared single-flight, replay identity and scoped cache changes. */
import { useCan, useInvalidate, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { ApiHttpError } from "@/providers/api/httpError";
import type { AcceptOptimizationRequest, CreateOptimizationRequest, OptimizationAccepted, OptimizationCandidate, OptimizationOutcome } from "@/types/optimization.dto";
import { optimizationApi, optimizationKeys } from "./optimization.api";
import { TRIP_EXECUTION_ENDPOINTS } from "@/features/trips/tripExecution.api";
export type OptimizationCommand = { action: "run"; payload: CreateOptimizationRequest } |
  { action: "accept"; candidate: OptimizationCandidate; payload: AcceptOptimizationRequest };
export function useOptimizationActions(outcome?: OptimizationOutcome) {
  const { t } = useTranslation(); const { tenant } = useCurrentTenant(); const client = useQueryClient(); const invalidate = useInvalidate(); const { open } = useNotification();
  const runAccess = useCan({ resource: "optimization", action: "OPTIMIZATION_RUN" }); const acceptAccess = useCan({ resource: "optimization", action: "OPTIMIZATION_ACCEPT" });
  const mutation = useFrozenCustomMutation<OptimizationOutcome | OptimizationAccepted>();
  const flight = useRef(false); const [pending, setPending] = useState(false); const [error, setError] = useState<Error | null>(null);
  const [accepted, setAccepted] = useState<OptimizationAccepted | undefined>(() => outcome ? client.getQueryData(optimizationKeys.accepted(tenant?.tenantKey, outcome.run.id)) : undefined);
  const [conflict, setConflict] = useState(false);
  const canRun = Boolean(tenant?.tenantKey && runAccess.data?.can && !outcome);
  const canAccept = (candidate: OptimizationCandidate) => Boolean(tenant?.tenantKey && acceptAccess.data?.can && outcome && !accepted && !conflict &&
    candidate.feasible === true && candidate.rejectionCodes.length === 0 && candidate.rank != null && candidate.finalScore != null &&
    /^[0-9a-f]{64}$/.test(candidate.inputFingerprint) && candidate.runId === outcome.run.id && outcome.candidates.some((row) => row.id === candidate.id && row.feasible === true && row.rejectionCodes.length === 0 && row.inputFingerprint === candidate.inputFingerprint));
  const execute = async (command: OptimizationCommand): Promise<OptimizationOutcome | OptimizationAccepted | undefined> => {
    if (flight.current) return undefined;
    if (command.action === "run" ? !canRun : !canAccept(command.candidate) || command.payload.expectedInputFingerprint !== command.candidate.inputFingerprint) throw new Error(t("forbidden.description"));
    flight.current = true; setPending(true); setError(null);
    try {
      const response = await mutation.mutateAsync({ url: command.action === "run" ? optimizationApi.create : optimizationApi.accept(outcome!.run.id, command.candidate.id),
        method: "post", values: command.payload, errorNotification: false, successNotification: false });
      if ("run" in response.data) client.setQueryData(optimizationKeys.run(tenant?.tenantKey, response.data.run.id), { data: response.data });
      else {
        // Retain only the real server-returned acceptance; no guessed status is written into immutable run audit.
        const result = response.data; setAccepted(result); client.setQueryData(optimizationKeys.accepted(tenant?.tenantKey, result.runId), result);
        await Promise.all([
          client.invalidateQueries({ queryKey: optimizationKeys.run(tenant?.tenantKey, result.runId), refetchType: "active" }),
          invalidate({ resource: "trips", invalidates: ["detail"], id: result.tripId }),
          invalidate({ resource: "trips", invalidates: ["list"] }),
          invalidate({ resource: "loads", invalidates: ["detail", "list"], id: result.loadId }),
          invalidate({ resource: "trucks", invalidates: ["detail", "list"], id: result.truckId }),
          invalidate({ resource: "drivers", invalidates: ["detail", "list"], id: result.driverId }),
          // Refine execution reads use URL keys; refresh only the accepted Trip's
          // assignments/stops plus this tenant's related resource evidence.
          client.invalidateQueries({ predicate: ({ queryKey }) => queryKey.some((part) => typeof part === "string" &&
            [TRIP_EXECUTION_ENDPOINTS.drivers(result.tripId), TRIP_EXECUTION_ENDPOINTS.stops(result.tripId)].includes(part)) ||
            (queryKey[1] === tenant?.tenantKey && ["load-timeline", "load-finance", "fleet"].includes(String(queryKey[0])) && queryKey.some((part) => part === result.loadId || part === result.truckId)), refetchType: "active" }),
        ]);
      }
      open?.({ type: "success", message: t(command.action === "run" ? "optimization.runSuccess" : "optimization.acceptSuccess") }); return response.data;
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error(t("optimization.actionFailed")); setError(failure);
      if (command.action === "accept" && failure instanceof ApiHttpError && failure.statusCode === 409 && failure.code !== "OPTIMIZATION_INPUT_EVIDENCE_REQUIRED") {
        setConflict(true);
        await Promise.all([
          client.invalidateQueries({ queryKey: optimizationKeys.run(tenant?.tenantKey, outcome!.run.id), refetchType: "active" }),
          invalidate({ resource: "trips", invalidates: ["detail"], id: command.candidate.tripId }),
          invalidate({ resource: "loads", invalidates: ["detail"], id: command.candidate.loadId }),
        ]);
      }
      open?.({ type: "error", message: t("optimization.actionFailed"), description: failure.message }); throw failure;
    } finally { flight.current = false; setPending(false); }
  };
  return { canRun, canAccept, execute, pending, error, accepted };
}
export type OptimizationActionsResult = ReturnType<typeof useOptimizationActions>;
