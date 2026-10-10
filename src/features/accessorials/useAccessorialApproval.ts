/** Enforces approval permission and single-flight; invalidates only affected tenant finance reads. */
import { useCan, useCustomMutation, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AccessorialChargeView } from "@/types/accessorial.types";
import type { ApiHttpError } from "@/providers/api/httpError";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";

export const useAccessorialApproval = (loadId: string) => {
  const { t } = useTranslation();
  const { tenant } = useCurrentTenant();
  const tenantKey = tenant?.tenantKey;
  const permission = useCan({ resource: "accessorials", action: "ACCESSORIAL_APPROVE" });
  const queryClient = useQueryClient();
  const { open } = useNotification();
  const mutation = useCustomMutation<AccessorialChargeView, ApiHttpError>();
  const flight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const approve = async (id: string): Promise<void> => {
    if (flight.current) return;
    if (!tenantKey || !loadId || !id || permission.data?.can !== true) throw new Error(t("forbidden.description"));
    flight.current = true;
    setPending(true);
    setError(null);
    try {
      await mutation.mutateAsync({ url: `/api/accessorial-charges/${encodeURIComponent(id)}/approve`,
        method: "put", values: {}, errorNotification: false, successNotification: false });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["load-finance", tenantKey, loadId], refetchType: "active" }),
        queryClient.invalidateQueries({ predicate: ({ queryKey }) =>
          queryKey[0] === "profitability" && queryKey[1] === tenantKey && queryKey[2] === "by-load" &&
          (queryKey[3] === loadId || queryKey[3] === null), refetchType: "active" }),
      ]);
      open?.({ type: "success", message: t("loads.financial.approveSuccess") });
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error(t("loads.financial.approveFailed"));
      setError(failure);
      open?.({ type: "error", message: t("loads.financial.approveFailed"), description: failure.message });
      throw failure;
    } finally { flight.current = false; setPending(false); }
  };
  return { approve, pending, error };
};
