import type { DataProvider } from "@refinedev/core";
import type { LarkSyncView } from "@/types/handoff.generated";
import { RAW_RESPONSE_META } from "@/types/apiClient.types";

export const larkBaseApi = {
  async status(provider: DataProvider, loadId: string): Promise<LarkSyncView> {
    if (!provider.custom) throw new Error("Lark Base transport unavailable");
    const response = await provider.custom<LarkSyncView>({
      url: `/api/lark/base/loads/${encodeURIComponent(loadId)}/sync`,
      method: "get", meta: RAW_RESPONSE_META,
    });
    return response.data;
  },
  async sync(provider: DataProvider, loadId: string, recreateMissing: boolean): Promise<LarkSyncView> {
    if (!provider.custom) throw new Error("Lark Base transport unavailable");
    const response = await provider.custom<LarkSyncView>({
      url: `/api/lark/base/loads/${encodeURIComponent(loadId)}/sync?recreateMissing=${recreateMissing}`,
      method: "post", payload: {}, meta: RAW_RESPONSE_META,
    });
    return response.data;
  },
};
