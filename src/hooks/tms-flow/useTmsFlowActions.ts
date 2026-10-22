/**
 * Action hooks for the TMS flow. Each call is single-flight per component,
 * reloads the shared snapshot on success and keeps the typed error for the UI.
 */

import { useCallback, useState } from "react";

import type { CreateTrackingInput, RouteDecision } from "@/api/tms-flow/tmsFlow.api";
import { TmsFlowPermissionError } from "@/api/tms-flow/tmsFlow.api";
import { useTmsFlow } from "@/hooks/tms-flow/useTmsFlow";
import type {
  MessageDraft,
  NewShipmentInput,
  RouteStop,
  TrackingPreferences,
} from "@/types/tms-flow/tmsFlow.types";

export interface TmsFlowActions {
  pending: string | null;
  error: string | null;
  clearError: () => void;
  createShipment: (input: NewShipmentInput) => Promise<{ shipmentId: string }>;
  autoAssign: (loadIds: string[]) => Promise<void>;
  applyRoute: (routeId: string) => Promise<void>;
  saveStops: (routeId: string, stops: RouteStop[]) => Promise<void>;
  decideRoute: (approvalId: string, decision: RouteDecision, reason?: string) => Promise<void>;
  sendMessage: (draft: MessageDraft) => Promise<void>;
  createTrackingLink: (input: CreateTrackingInput) => Promise<{ token: string }>;
  updateTrackingLink: (token: string, preferences: TrackingPreferences) => Promise<void>;
  resetDemo: () => Promise<void>;
}

export const useTmsFlowActions = (): TmsFlowActions => {
  const { gateway, reload, permissions, resetDemo } = useTmsFlow();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(key: string, operation: () => Promise<T>): Promise<T> => {
      if (pending) throw new Error("Another demo action is still running.");
      if (permissions.readOnly) {
        const readOnlyError = new TmsFlowPermissionError("This demo is running in read-only mode.");
        setError(readOnlyError.message);
        throw readOnlyError;
      }
      setPending(key);
      setError(null);
      try {
        const result = await operation();
        await reload();
        return result;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The demo action failed.");
        throw cause;
      } finally {
        setPending(null);
      }
    },
    [pending, permissions.readOnly, reload],
  );

  const createShipment = useCallback(
    (input: NewShipmentInput) => run("create-shipment", () => gateway.createShipment(input)),
    [gateway, run],
  );

  const autoAssign = useCallback(
    async (loadIds: string[]) => {
      await run("auto-assign", () => gateway.autoAssign(loadIds));
    },
    [gateway, run],
  );

  const applyRoute = useCallback(
    async (routeId: string) => {
      await run("apply-route", () => gateway.applyOptimizedRoute(routeId));
    },
    [gateway, run],
  );

  const saveStops = useCallback(
    async (routeId: string, stops: RouteStop[]) => {
      await run("save-stops", () => gateway.saveRouteStops(routeId, stops));
    },
    [gateway, run],
  );

  const decideRoute = useCallback(
    async (approvalId: string, decision: RouteDecision, reason?: string) => {
      await run(`route-${decision}`, () => gateway.decideRouteChange(approvalId, decision, reason));
    },
    [gateway, run],
  );

  const sendMessage = useCallback(
    async (draft: MessageDraft) => {
      await run("send-message", () => gateway.sendMessage(draft));
    },
    [gateway, run],
  );

  const createTrackingLink = useCallback(
    async (input: CreateTrackingInput) => {
      const link = await run("create-tracking-link", () => gateway.createTrackingLink(input));
      return { token: link.token };
    },
    [gateway, run],
  );

  const updateTrackingLink = useCallback(
    async (token: string, preferences: TrackingPreferences) => {
      await run("update-tracking-link", () => gateway.updateTrackingLink(token, preferences));
    },
    [gateway, run],
  );

  const resetDemoAction = useCallback(async () => {
    await resetDemo();
  }, [resetDemo]);

  return {
    pending,
    error,
    clearError: () => setError(null),
    createShipment,
    autoAssign,
    applyRoute,
    saveStops,
    decideRoute,
    sendMessage,
    createTrackingLink,
    updateTrackingLink,
    resetDemo: resetDemoAction,
  };
};
