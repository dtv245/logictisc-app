export const optimizationApi = {
  create: "/api/optimization/runs",
  run: (id: string) => `/api/optimization/runs/${encodeURIComponent(id)}`,
  accept: (runId: string, candidateId: string) => `/api/optimization/runs/${encodeURIComponent(runId)}/assignments/${encodeURIComponent(candidateId)}/accept`,
};
export const optimizationKeys = {
  run: (tenant: string | undefined, id: string) => ["optimization", tenant, "run", id] as const,
  accepted: (tenant: string | undefined, id: string) => ["optimization", tenant, "accepted-response", id] as const,
};
