/**
 * Nạp option cho dropdown chọn bản ghi quan hệ theo từng trang.
 *
 * `useSelect` của Refine chỉ trả về **một** trang (mặc định 50 bản ghi) và không có
 * cách nối thêm khi cuộn. Với những resource có thể lên tới hàng nghìn bản ghi
 * (loads), người dùng không tìm thấy bản ghi nằm ngoài trang đầu. Hook này giữ các
 * trang đã tải trong cache của TanStack Query; `EntityPicker` chỉ cần gọi
 * `fetchNextPage` khi danh sách dropdown gần chạm đáy.
 *
 * Tìm kiếm vẫn do server làm (`search` + `contains`), trùng với cách `useSelect`
 * dựng filter, nên không có hai nguồn sự thật cho cùng một truy vấn.
 */
import {
  queryKeys,
  useDataProvider,
  type BaseRecord,
  type CrudFilters,
  type GetListResponse,
  type HttpError,
} from "@refinedev/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface UseInfiniteRelationOptionsParams {
  resource: string;
  pageSize: number;
  /** Chuỗi đã debounce; rỗng nghĩa là không lọc. */
  search?: string;
  enabled?: boolean;
}

export interface UseInfiniteRelationOptionsResult {
  options: BaseRecord[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
}

export const useInfiniteRelationOptions = ({
  resource,
  pageSize,
  search = "",
  enabled = true,
}: UseInfiniteRelationOptionsParams): UseInfiniteRelationOptionsResult => {
  const getDataProvider = useDataProvider();
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const trimmedSearch = search.trim();
  // Không resource thì không có gì để nạp. Gọi `getList` với chuỗi rỗng sẽ đâm
  // vào `RESOURCE_NOT_CONFIGURED` của data provider thay vì trả về danh sách rỗng.
  const hasResource = resource.trim().length > 0;
  const filters: CrudFilters =
    trimmedSearch.length > 0
      ? [{ field: "search", operator: "contains", value: trimmedSearch }]
      : [];

  const query = useInfiniteQuery<
    GetListResponse<BaseRecord>,
    HttpError
  >({
    queryKey: [
      ...queryKeys(resource).all,
      "infinite-options",
      safePageSize,
      trimmedSearch,
    ],
    queryFn: (context) =>
      getDataProvider().getList<BaseRecord>({
        resource,
        pagination: {
          current: Number(context.pageParam ?? 1),
          pageSize: safePageSize,
        },
        filters,
        meta: { queryContext: context },
      }),
    getNextPageParam: (lastPage, allPages) =>
      (lastPage.total ?? 0) > allPages.length * safePageSize
        ? allPages.length + 1
        : undefined,
    enabled: enabled && hasResource,
    staleTime: 30_000,
  });

  const options = useMemo(() => {
    const seen = new Set<string>();
    const result: BaseRecord[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const record of page.data) {
        const id = String(record.id ?? "");
        if (id.length > 0 && !seen.has(id)) {
          seen.add(id);
          result.push(record);
        }
      }
    }
    return result;
  }, [query.data]);

  return {
    options,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
  };
};
