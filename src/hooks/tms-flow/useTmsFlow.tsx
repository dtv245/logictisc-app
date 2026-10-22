/* eslint-disable react-refresh/only-export-components */
/**
 * TmsFlowProvider — owns the snapshot for S01–S09.
 *
 * The provider is a subscriber of the gateway singleton, never a second store:
 * mutations made by one screen are immediately visible to the next.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";

import { getTmsFlowGateway } from "@/api/tms-flow/tmsFlow.demo";
import type { TmsFlowGateway } from "@/api/tms-flow/tmsFlow.api";
import type { TmsFlowPermissions, TmsFlowSnapshot, TmsScenario } from "@/types/tms-flow/tmsFlow.types";
import { parseTmsScenario } from "@/utils/tms-flow/scenario";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; snapshot: TmsFlowSnapshot }
  | { status: "error"; error: string };

type LoadAction =
  | { type: "loading" }
  | { type: "ready"; snapshot: TmsFlowSnapshot }
  | { type: "error"; error: string };

const reducer = (_state: LoadState, action: LoadAction): LoadState => {
  if (action.type === "loading") return { status: "loading" };
  if (action.type === "ready") return { status: "ready", snapshot: action.snapshot };
  return { status: "error", error: action.error };
};

export interface TmsFlowContextValue {
  state: LoadState;
  gateway: TmsFlowGateway;
  scenario: TmsScenario;
  permissions: TmsFlowPermissions;
  reload: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

const TmsFlowContext = createContext<TmsFlowContextValue | undefined>(undefined);

export const useTmsFlow = (): TmsFlowContextValue => {
  const value = useContext(TmsFlowContext);
  if (!value) throw new Error("useTmsFlow must be used inside TmsFlowProvider");
  return value;
};

export const TmsFlowProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams] = useSearchParams();
  const scenario = parseTmsScenario(searchParams.get("scenario"));
  const gateway = getTmsFlowGateway();
  const [state, dispatch] = useReducer(reducer, { status: "loading" });
  const readOnly = scenario === "read-only";

  const reload = useCallback(async () => {
    gateway.configure({ scenario, readOnly });
    dispatch({ type: "loading" });
    try {
      const snapshot = await gateway.loadSnapshot();
      dispatch({ type: "ready", snapshot });
    } catch (error) {
      dispatch({ type: "error", error: error instanceof Error ? error.message : "Unable to load the demo." });
    }
  }, [gateway, readOnly, scenario]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const resetDemo = useCallback(async () => {
    gateway.reset();
    await reload();
  }, [gateway, reload]);

  const permissions = useMemo<TmsFlowPermissions>(
    () => ({
      readOnly,
      canApprove: !readOnly,
      canMessage: !readOnly,
      canShareTracking: !readOnly,
    }),
    [readOnly],
  );

  const value = useMemo<TmsFlowContextValue>(
    () => ({ state, gateway, scenario, permissions, reload, resetDemo }),
    [state, gateway, scenario, permissions, reload, resetDemo],
  );

  return <TmsFlowContext.Provider value={value}>{children}</TmsFlowContext.Provider>;
};
