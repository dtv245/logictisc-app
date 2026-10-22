/**
 * Real TMS operations API.
 *
 * Uses the existing logistics endpoints; no demo gateway or fixture remains.
 * Query keys are tenant-scoped so switching tenants cannot reuse another
 * tenant's cached loads.
 */

import axios from "axios";

import { getAuthHeaders } from "@/api/ai/ai.api";
import {
  TMS_MAX_LOAD_PAGES,
  TMS_MAX_TRUCK_PAGES,
} from "@/constants/tms";
import type { EmployeeResponse } from "@/types/employee.dto";
import type { LoadResponse } from "@/types/load.dto";
import type { PagedResponse } from "@/types/api.types";
import type { TruckResponse } from "@/types/truck.dto";
import type {
  TmsAiLoadStatus,
  TmsAiSuggestion,
  TmsLoadCollection,
  TmsLoadTimeline,
  TmsTruckCollection,
} from "@/types/tms-flow/tmsFlow.types";

export const tmsEndpoints = {
  loads: "/api/loads",
  load: (loadId: string) => `/api/loads/${encodeURIComponent(loadId)}`,
  loadTimeline: (loadId: string) =>
    `/api/loads/${encodeURIComponent(loadId)}/timeline`,
  trucks: "/api/trucks",
  truck: (truckId: string) => `/api/trucks/${encodeURIComponent(truckId)}`,
  driver: (driverId: string) => `/api/drivers/${encodeURIComponent(driverId)}`,
  pendingSuggestions: "/api/ai/dispatch/pending",
  loadAiOverview: "/api/ai/loads/overview",
  approveDecision: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/approve`,
  rejectDecision: (decisionId: string) =>
    `/api/ai/dispatch/decisions/${encodeURIComponent(decisionId)}/reject`,
} as const;

export const tmsKeys = {
  all: ["tms"] as const,
  loads: (tenant: string | undefined) => ["tms", tenant ?? "tenant", "loads"] as const,
  trucks: (tenant: string | undefined) => ["tms", tenant ?? "tenant", "trucks"] as const,
  pending: (tenant: string | undefined) =>
    ["tms", tenant ?? "tenant", "pending-suggestions"] as const,
  aiStatuses: (tenant: string | undefined, loadIds: readonly string[]) =>
    [
      "tms",
      tenant ?? "tenant",
      "ai-statuses",
      [...loadIds].sort().join(","),
    ] as const,
  load: (tenant: string | undefined, loadId: string) =>
    ["tms", tenant ?? "tenant", "load", loadId] as const,
  timeline: (tenant: string | undefined, loadId: string) =>
    ["tms", tenant ?? "tenant", "timeline", loadId] as const,
};

export class TmsApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { status?: number; code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "TmsApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

const unwrap = <T>(payload: unknown): T => {
  const record = payload as { data?: unknown } | null;
  return (record && "data" in record ? record.data : payload) as T;
};

const toApiError = (error: unknown): TmsApiError => {
  if (error instanceof TmsApiError) return error;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | { code?: string; message?: string; error?: string; details?: unknown }
      | undefined;
    return new TmsApiError(
      body?.message ?? body?.error ?? error.message,
      {
        status: error.response?.status,
        ...(body?.code ? { code: body.code } : {}),
        ...(body?.details !== undefined ? { details: body.details } : {}),
      },
    );
  }
  return new TmsApiError(error instanceof Error ? error.message : "TMS request failed");
};

const getPage = async <T>(
  url: string,
  params: Record<string, unknown>,
): Promise<PagedResponse<T>> => {
  try {
    const response = await axios.get(url, {
      params,
      headers: getAuthHeaders(),
    });
    const page = unwrap<Partial<PagedResponse<T>>>(response.data);
    return {
      items: Array.isArray(page.items) ? page.items : [],
      totalItems: Number(page.totalItems ?? 0),
      totalPages: Number(page.totalPages ?? 0),
      currentPage: Number(page.currentPage ?? 1),
      pageSize: Number(page.pageSize ?? 100),
    };
  } catch (error) {
    throw toApiError(error);
  }
};

const collectAllPages = async <T>(
  url: string,
  maxPages: number,
): Promise<{ items: T[]; truncated: boolean; totalItems: number }> => {
  const items: T[] = [];
  let totalItems = 0;
  let truncated = false;

  for (let page = 1; page <= maxPages; page += 1) {
    const result = await getPage<T>(url, {
      page,
      pageSize: 100,
    });
    totalItems = result.totalItems;
    items.push(...result.items);
    if (result.items.length < 100 || page >= result.totalPages) break;
    if (page === maxPages) truncated = true;
  }

  return { items, truncated, totalItems };
};

/** All loads the current tenant can list, capped to keep the fallback bounded. */
export const fetchAllLoads = (): Promise<TmsLoadCollection> =>
  collectAllPages<LoadResponse>(tmsEndpoints.loads, TMS_MAX_LOAD_PAGES);

/** All trucks with their last known coordinates. */
export const fetchAllTrucks = (): Promise<TmsTruckCollection> =>
  collectAllPages<TruckResponse>(tmsEndpoints.trucks, TMS_MAX_TRUCK_PAGES);

export const fetchLoad = async (loadId: string): Promise<LoadResponse> => {
  try {
    const response = await axios.get(tmsEndpoints.load(loadId), {
      headers: getAuthHeaders(),
    });
    return unwrap<LoadResponse>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const fetchLoadTimeline = async (
  loadId: string,
): Promise<TmsLoadTimeline> => {
  try {
    const response = await axios.get(tmsEndpoints.loadTimeline(loadId), {
      headers: getAuthHeaders(),
    });
    return unwrap<TmsLoadTimeline>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const fetchTruck = async (truckId: string): Promise<TruckResponse> => {
  try {
    const response = await axios.get(tmsEndpoints.truck(truckId), {
      headers: getAuthHeaders(),
    });
    return unwrap<TruckResponse>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const fetchDriver = async (driverId: string): Promise<EmployeeResponse> => {
  try {
    const response = await axios.get(tmsEndpoints.driver(driverId), {
      headers: getAuthHeaders(),
    });
    return unwrap<EmployeeResponse>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const fetchPendingSuggestions = async (): Promise<TmsAiSuggestion[]> => {
  try {
    const response = await axios.get(tmsEndpoints.pendingSuggestions, {
      headers: getAuthHeaders(),
    });
    const data = unwrap<unknown>(response.data);
    return Array.isArray(data) ? (data as TmsAiSuggestion[]) : [];
  } catch (error) {
    throw toApiError(error);
  }
};

/** Resolves which load each pending decision belongs to (max 100 ids per call). */
export const fetchLoadAiStatuses = async (
  loadIds: readonly string[],
): Promise<TmsAiLoadStatus[]> => {
  const bounded = [...new Set(loadIds)].slice(0, 100);
  if (bounded.length === 0) return [];
  try {
    const response = await axios.post(
      tmsEndpoints.loadAiOverview,
      { loadIds: bounded },
      { headers: getAuthHeaders() },
    );
    const data = unwrap<unknown>(response.data);
    return Array.isArray(data) ? (data as TmsAiLoadStatus[]) : [];
  } catch (error) {
    throw toApiError(error);
  }
};

export const approveSuggestion = async (
  decisionId: string,
  notes?: string,
): Promise<TmsAiSuggestion> => {
  try {
    const response = await axios.post(
      tmsEndpoints.approveDecision(decisionId),
      notes?.trim() ? { notes: notes.trim() } : {},
      { headers: getAuthHeaders() },
    );
    return unwrap<TmsAiSuggestion>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};

export const rejectSuggestion = async (
  decisionId: string,
  reason: string,
): Promise<TmsAiSuggestion> => {
  try {
    const response = await axios.post(
      tmsEndpoints.rejectDecision(decisionId),
      { reason: reason.trim() },
      { headers: getAuthHeaders() },
    );
    return unwrap<TmsAiSuggestion>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
};
