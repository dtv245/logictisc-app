import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import type { ErrorParams } from "./api.types";

/** Nhận diện loại thao tác CRUD / Auth */
export type OperationType = "create" | "update" | "delete" | "read" | "auth" | "unknown";

export interface NotificationError {
  message: string;
  statusCode: number;
  code?: string;
  cause?: unknown;
  params?: ErrorParams;
  hasMachineParams?: boolean;
}

export interface ErrorNotificationContext {
  key?: string;
  operation?: "create" | "update" | "delete";
  resourceLabel?: string;
}

/** Text-only Refine notifications retain their historical presentation at this boundary. */
export interface CompatibilityNotificationError {
  kind: "compatibility";
  statusCode: number | undefined;
  rawMessage: string;
  rawDescription: string;
  operation: OperationType;
  resourceLabel: string | undefined;
  message: ReactNode;
  description: ReactNode;
}

export interface StructuredNotificationError {
  kind: "structured";
  cause: unknown;
  t: TFunction;
  context: ErrorNotificationContext;
}

export interface NotificationContent {
  message: ReactNode;
  description?: ReactNode;
  duration?: number;
}
