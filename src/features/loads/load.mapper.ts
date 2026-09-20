import { toDate, toDateOrNull } from "@formatters/dateTime";
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
    dispatchedAt: toDateOrNull(response.dispatchedAt),
    pickedUpAt: toDateOrNull(response.pickedUpAt),
    deliveredAt: toDateOrNull(response.deliveredAt),
    cancelledAt: toDateOrNull(response.cancelledAt),
    requestedPickupDate: toDateOrNull(response.requestedPickupDate),
    requestedDeliveryDate: toDateOrNull(response.requestedDeliveryDate),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}

export function mapLoadExceptionResponse(response: LoadExceptionResponse): LoadException {
  return {
    ...response,
    occurredAt: toDate(response.occurredAt),
    resolvedAt: toDateOrNull(response.resolvedAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}

export function mapLoadConditionReportResponse(response: LoadConditionReportResponse): LoadConditionReport {
  return {
    ...response,
    inspectedAt: toDate(response.inspectedAt),
    createdAt: toDate(response.createdAt),
    lastModifiedAt: toDateOrNull(response.lastModifiedAt),
  };
}
