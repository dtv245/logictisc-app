/** Confirmed Load-scoped rating endpoint; generic CRUD/list paths are not invented. */
export const rateRuleApi = {
  preview: (loadId: string) => `/api/loads/${encodeURIComponent(loadId)}/rating/preview`,
};
