import { useCan, useDataProvider } from "@refinedev/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { larkBaseApi } from "@/api/lark-base/lark-base.api";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export function useLoadLarkSync(loadId: string) {
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "loads", action: "LARK_BASE_SYNC" });
  const provider = useDataProvider();
  const client = useQueryClient();
  const flight = useRef(false);
  const tenantKey = tenant?.tenantKey;
  const canSync = access.data?.can === true && Boolean(tenantKey && loadId);
  const queryKey = ["lark-base", tenantKey, "load", loadId] as const;
  const query = useQuery({
    queryKey, enabled: canSync, retry: false,
    queryFn: () => larkBaseApi.status(provider(), loadId),
  });
  const mutation = useMutation({
    mutationFn: async (input: { id: string; tenant: string; recreate: boolean }) =>
      larkBaseApi.sync(provider(), input.id, input.recreate),
    onSuccess: async (_result, input) => {
      await client.invalidateQueries({ queryKey: ["lark-base", input.tenant, "load", input.id] });
    },
  });
  const sync = async (recreate = false): Promise<void> => {
    if (!canSync || !tenantKey) throw new Error("Forbidden");
    if (flight.current) return;
    flight.current = true;
    try { await mutation.mutateAsync({ id: loadId, tenant: tenantKey, recreate }); }
    finally { flight.current = false; }
  };
  return { access, canSync, query, mutation, sync };
}
