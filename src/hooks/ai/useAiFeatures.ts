import { useQuery } from "@tanstack/react-query";
import { fetchAiFeatures, aiQueryKeys } from "@/api/ai/ai.api";
import type { AiFeatures } from "@/api/ai/ai.types";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

/**
 * Hook to retrieve AI feature availability flags for the current tenant.
 * Because GET /api/ai/features is optional (may 404 if AI backend is unmounted),
 * retry is disabled (retry: false), refetchOnWindowFocus is disabled,
 * and errors cleanly fallback to { enabled: false, dryRun: false } without error toasts.
 */
export function useAiFeatures() {
  const { tenant } = useCurrentTenant();

  const query = useQuery<AiFeatures>({
    queryKey: aiQueryKeys.features(tenant?.tenantKey),
    queryFn: fetchAiFeatures,
    enabled: Boolean(tenant?.tenantKey),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    retry: false,
    refetchOnWindowFocus: false,
  });

  const enabled = !query.isError && (query.data?.enabled ?? false);
  const dryRun = !query.isError && (query.data?.dryRun ?? false);

  return {
    data: query.isError ? undefined : query.data,
    enabled,
    dryRun,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
