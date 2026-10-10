/** Persists the confirmed tenant-wide mark-read command with exact existing guards and scoped invalidation. */
import { useCan, useCustomMutation, useInvalidate, useNotification } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { ApiHttpError } from "@/providers/api/httpError";
export function useNotificationActions() {
  const { tenant } = useCurrentTenant(); const { t } = useTranslation(); const { open } = useNotification();
  const access = useCan({ resource: "notifications", action: "markAllRead" }); // The command returns an integer; Refine constrains result types to BaseRecord.
  // We intentionally never read its payload instead of declaring a fictitious entity DTO.
  const mutation = useCustomMutation<never, ApiHttpError>();
  const invalidate = useInvalidate(); const client = useQueryClient(); const flight = useRef(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState<Error | null>(null);
  const canMarkAllRead = Boolean(tenant?.tenantKey && access.data?.can);
  const markAllRead = async () => {
    if (flight.current) return;
    if (!canMarkAllRead) throw new Error(t("forbidden.description"));
    flight.current = true; setPending(true); setError(null);
    try {
      await mutation.mutateAsync({ url: "/api/notifications/mark-all-read", method: "post", values: {}, errorNotification: false, successNotification: false });
      await Promise.all([
        invalidate({ resource: "notifications", invalidates: ["list", "detail"] }),
        client.invalidateQueries({ queryKey: ["notification-header", tenant?.tenantKey], refetchType: "active" }),
      ]);
      open?.({ type: "success", message: t("notifications.markSuccess") });
    } catch (cause) { const failure = cause instanceof Error ? cause : new Error(t("notifications.markError")); setError(failure); open?.({ type: "error", message: t("notifications.markError"), description: failure instanceof ApiHttpError ? `${failure.message} (${failure.code}${failure.requestId ? ` / ${failure.requestId}` : ""})` : failure.message }); throw failure; }
    finally { flight.current = false; setPending(false); }
  };
  return { markAllRead, canMarkAllRead, pending, error };
}
