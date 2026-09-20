import type {
  LoadResponse,
  LoadExceptionResponse,
  LoadConditionReportResponse,
} from "@/types/load.dto";
import type {
  Load,
  LoadException,
  LoadConditionReport,
} from "@/types/load.types";

export function mapLoadResponse(response: LoadResponse): Load {
  return {
    ...response,
    dispatchedAt: response.dispatchedAt ? new Date(response.dispatchedAt) : null,
    pickedUpAt: response.pickedUpAt ? new Date(response.pickedUpAt) : null,
    deliveredAt: response.deliveredAt ? new Date(response.deliveredAt) : null,
    cancelledAt: response.cancelledAt ? new Date(response.cancelledAt) : null,
    requestedPickupDate: response.requestedPickupDate ? new Date(response.requestedPickupDate) : null,
    requestedDeliveryDate: response.requestedDeliveryDate ? new Date(response.requestedDeliveryDate) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}

export function mapLoadExceptionResponse(response: LoadExceptionResponse): LoadException {
  return {
    ...response,
    occurredAt: new Date(response.occurredAt),
    resolvedAt: response.resolvedAt ? new Date(response.resolvedAt) : null,
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}

export function mapLoadConditionReportResponse(response: LoadConditionReportResponse): LoadConditionReport {
  return {
    ...response,
    inspectedAt: new Date(response.inspectedAt),
    createdAt: new Date(response.createdAt),
    lastModifiedAt: response.lastModifiedAt ? new Date(response.lastModifiedAt) : null,
  };
}
