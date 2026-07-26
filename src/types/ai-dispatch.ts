/**
 * Chứa các kiểu dữ liệu phiên điều phối AI và quyết định được đề xuất.
 */

import type { AuditableEntity } from "./common";
import type { Load } from "./load";
import type { Trip } from "./trip";
import type { Truck } from "./truck";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AiDispatchMode = "manual" | "assisted" | "automatic";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AiDispatchSessionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AiDispatchDecisionType =
  | "assign_load"
  | "assign_truck"
  | "create_trip"
  | "reorder_stops"
  | "reject_load";

// TODO: xác nhận lại danh sách giá trị enum với backend.
export type AiDispatchDecisionStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

/** Một lần chạy AI để phân tích và đề xuất phương án điều phối. */
export interface AiDispatchSession extends AuditableEntity {
  id: string;
  number: number;
  mode: AiDispatchMode;
  status: AiDispatchSessionStatus;
  triggeredByUserId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  instructions?: string | null;
  inputTokensUsed: number;
  outputTokensUsed: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCostUsd: number;
  modelUsed?: string | null;
  decisionCount: number;
  summary?: string | null;
  errorMessage?: string | null;
  requestCost: number;
  isOverage: boolean;
}

/** Một quyết định do phiên điều phối AI tạo và theo dõi thực thi. */
export interface AiDispatchDecision {
  id: string;
  sessionId: string;
  type: AiDispatchDecisionType;
  status: AiDispatchDecisionStatus;
  reasoning: string;
  toolName?: string | null;
  toolInput?: unknown | null; // TODO: định nghĩa shape cụ thể khi biết rõ payload.
  toolOutput?: unknown | null; // TODO: định nghĩa shape cụ thể khi biết rõ payload.
  loadId?: string | null;
  truckId?: string | null;
  tripId?: string | null;
  createdAt: string;
  executedAt?: string | null;
  approvedByUserId?: string | null;
  rejectionReason?: string | null;
}

/** Phiên điều phối AI kèm các quyết định được sinh ra. */
export interface AiDispatchSessionWithRelations extends AiDispatchSession {
  decisions?: AiDispatchDecision[];
}

/** Quyết định AI kèm các entity vận hành mà nó tham chiếu. */
export interface AiDispatchDecisionWithRelations extends AiDispatchDecision {
  load?: Load | null;
  truck?: Truck | null;
  trip?: Trip | null;
}
