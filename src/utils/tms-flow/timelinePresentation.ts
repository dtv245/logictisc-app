const knownStatuses = new Set(["open", "assigned", "dispatched", "in_transit", "delivered", "cancelled"]);
const knownEventTypes = new Set([
  "LOAD_CREATED", "STATUS_CHANGED", "LOAD_STATUS_CHANGED", "PICKUP_COMPLETED",
  "DELIVERY_COMPLETED", "EXCEPTION_REPORTED", "EXCEPTION_RESOLVED",
  "TRIP_CREATED", "DOCUMENT_UPLOADED",
]);

export const translateTimelineStatus = (
  status: string,
  translate: (key: string) => string,
): string => {
  const normalized = status.trim().toLowerCase().replaceAll(" ", "_");
  if (knownStatuses.has(normalized)) return translate(`tmsDispatch.timeline.statuses.${normalized}`);
  return normalized.replaceAll("_", " ").slice(0, 48) || translate("tmsDispatch.timeline.recorded");
};

export const translateTimelineEventType = (
  eventType: string,
  translate: (key: string) => string,
): string => {
  const normalized = eventType.trim().toUpperCase();
  if (knownEventTypes.has(normalized)) return translate(`tmsDispatch.timeline.events.${normalized}`);
  return eventType.trim().replaceAll("_", " ").slice(0, 48) || translate("tmsDispatch.timeline.recorded");
};
