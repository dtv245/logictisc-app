/** Audited date correction uses expectedChangeId, independently of generic expectedVersion. */
export const PICKUP_BUSINESS_DATE_RUNTIME_VERIFIED = false;
export const pickupBusinessDateApi = (id: string) => `/api/loads/${encodeURIComponent(id)}/requested-pickup-business-date`;
