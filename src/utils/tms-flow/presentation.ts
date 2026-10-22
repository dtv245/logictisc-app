/** Presentation metadata for the TMS flow (literal demo copy, no locale keys). */

import type {
  ApprovalState,
  ShipmentPriority,
  ShipmentStatus,
} from "@/types/tms-flow/tmsFlow.types";

type PresentationTone = "success" | "processing" | "warning" | "error" | "neutral";

export const shipmentStatusMeta: Record<ShipmentStatus, { label: string; tone: PresentationTone }> = {
  booked: { label: "Booked", tone: "neutral" },
  assigned: { label: "Assigned", tone: "processing" },
  in_transit: { label: "In transit", tone: "processing" },
  at_risk: { label: "At risk", tone: "error" },
  delayed: { label: "Delayed", tone: "warning" },
  delivered: { label: "Delivered", tone: "success" },
};

export const priorityMeta: Record<ShipmentPriority, { label: string; tone: PresentationTone }> = {
  standard: { label: "Standard", tone: "neutral" },
  priority: { label: "Priority", tone: "warning" },
  critical: { label: "Critical", tone: "error" },
};

export const approvalStateMeta: Record<ApprovalState, { label: string; tone: PresentationTone }> = {
  pending_approval: { label: "Pending approval", tone: "warning" },
  under_review: { label: "Under review", tone: "processing" },
  approved: { label: "Approved", tone: "success" },
  applied: { label: "Applied", tone: "success" },
  rejected: { label: "Rejected", tone: "neutral" },
};

export const isApprovalOpen = (state: ApprovalState): boolean =>
  state === "pending_approval" || state === "under_review";
