/**
 * Infinite cursor over the server-paginated by-load profitability report.
 * Each page is fetched on demand, so opening the screen costs one page worth of
 * per-load financial lookups instead of the whole tenant history.
 */
import { useInfiniteQuery } from "@tanstack/react-query";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { financialQueryKeys, listLoadProfitabilityPage } from "@/features/profitability/api/profitability.api";

interface UseInfiniteLoadProfitabilityOptions {
  tenantKey: string | undefined;
  loadId?: string;
  enabled: boolean;
  pageSize?: number;
}

export const useInfiniteLoadProfitability = ({
  tenantKey,
  loadId,
  enabled,
  pageSize = DEFAULT_LIST_PAGE_SIZE,
}: UseInfiniteLoadProfitabilityOptions) =>
  useInfiniteQuery({
    queryKey: [...financialQueryKeys.byLoad(tenantKey, loadId), "pages", pageSize] as const,
    queryFn: ({ pageParam, signal }) =>
      listLoadProfitabilityPage(Number(pageParam ?? 1), pageSize, loadId, signal),
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    enabled: enabled && Boolean(tenantKey),
    staleTime: 30_000,
    keepPreviousData: true,
  });
