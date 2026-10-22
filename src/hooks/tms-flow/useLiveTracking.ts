/**
 * Live tracking reader for S11.
 *
 * The page sits outside TmsFlowProvider (full-screen route), so it talks to the
 * same gateway singleton directly. Freshness is derived from a demo tick, never
 * from the wall clock.
 */

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getTmsFlowGateway } from "@/api/tms-flow/tmsFlow.demo";
import type { LiveTrackingView, TmsFlowSnapshot } from "@/types/tms-flow/tmsFlow.types";
import { DEMO_NOW } from "@/utils/tms-flow/format";
import { parseTmsScenario } from "@/utils/tms-flow/scenario";

const TICK_MS = 5_000;
const STALE_AFTER_SECONDS = 60;

type LiveTrackingLoadState =
  | { status: "loading" }
  | { status: "ready"; view: LiveTrackingView; snapshot: TmsFlowSnapshot }
  | { status: "error"; error: string };

export interface LiveTrackingState {
  status: LiveTrackingLoadState["status"];
  view?: LiveTrackingView;
  snapshot?: TmsFlowSnapshot;
  error?: string;
  updatedSecondsAgo: number;
  stale: boolean;
  reload: () => void;
}

export const useLiveTracking = (token: string | undefined): LiveTrackingState => {
  const [searchParams] = useSearchParams();
  const scenario = parseTmsScenario(searchParams.get("scenario"));
  const gateway = getTmsFlowGateway();
  const [attempt, setAttempt] = useState(0);
  const [tick, setTick] = useState(0);
  const requestKey = `${token ?? "none"}|${scenario}|${attempt}`;
  const [result, setResult] = useState<{ key: string; state: LiveTrackingLoadState }>({
    key: "",
    state: { status: "loading" },
  });

  const reload = useCallback(() => {
    setTick(0);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    gateway.configure({ scenario });

    void Promise.all([
      gateway.getLiveTracking(token, DEMO_NOW, { scenario }),
      gateway.loadSnapshot(),
    ])
      .then(([view, snapshot]) => {
        if (!cancelled) setResult({ key: requestKey, state: { status: "ready", view, snapshot } });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            state: {
              status: "error",
              error: error instanceof Error ? error.message : "Unable to load live tracking.",
            },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gateway, requestKey, scenario, token]);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), TICK_MS);
    return () => window.clearInterval(interval);
  }, [token]);

  const state: LiveTrackingLoadState = !token
    ? { status: "error", error: "This tracking link is invalid or has expired." }
    : result.key === requestKey
      ? result.state
      : { status: "loading" };

  if (state.status === "ready") {
    const updatedSecondsAgo = state.view.updatedSecondsAgo + tick * (TICK_MS / 1_000);
    return {
      status: state.status,
      view: state.view,
      snapshot: state.snapshot,
      updatedSecondsAgo,
      stale: state.view.stale || updatedSecondsAgo > STALE_AFTER_SECONDS,
      reload,
    };
  }

  if (state.status === "error") {
    return { status: state.status, error: state.error, updatedSecondsAgo: 0, stale: false, reload };
  }

  return { status: "loading", updatedSecondsAgo: 0, stale: false, reload };
};
