import { PrimaryInvoiceForm } from "@/features/invoices/PrimaryInvoiceForm";
/** Internal acceptance button uses the exact frozen preview request and server fingerprints. */
import { useCan, useDataProvider, useInvalidate } from "@refinedev/core";
import { Alert, Button, Space } from "antd";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BILLING_COMMANDS_RUNTIME_VERIFIED, createRatingAcceptance, freezeRatingAcceptance } from "@/features/invoices/billingCommands";
import type { AcceptedRatingSnapshot, RatingPreviewRequest } from "@/types/handoff.generated";
import { normalizeHttpError, type ApiHttpError } from "@/providers/api/httpError";

export function RatingAcceptance({ loadId, request, preview, onFrozen, runtimeVerified = BILLING_COMMANDS_RUNTIME_VERIFIED }: { loadId: string; request: RatingPreviewRequest; preview: { inputHash: string; resultHash: string }; onFrozen?: () => void; runtimeVerified?: boolean }) {
  const { t } = useTranslation(); const provider = useDataProvider(); const { tenant } = useCurrentTenant(); const user = useCurrentUser(); const client = useQueryClient(); const invalidate = useInvalidate();
  const access = useCan({ resource: "rates", action: "RATE_ACCEPT" });
  const intent = useMemo(() => ({ scope: [tenant?.tenantKey, user.data?.id], command: createRatingAcceptance(provider().custom!, loadId) }), [provider, loadId, tenant?.tenantKey, user.data?.id]).command;
  const payload = useMemo(() => freezeRatingAcceptance(request, preview, crypto.randomUUID()), [request, preview]);
  const [pending, setPending] = useState(false); const [error, setError] = useState<ApiHttpError | null>(null); const [accepted, setAccepted] = useState<AcceptedRatingSnapshot | null>(null);
  if (!runtimeVerified) return null;
  const accept = async () => {
    if (!access.data?.can || !user.data?.employeeId || !tenant?.tenantKey) return;
    onFrozen?.(); setPending(true); setError(null);
    try { const result = await intent.execute(payload); setAccepted(result); await Promise.all([
      invalidate({ resource: "loads", id: loadId, invalidates: ["detail"] }),
      client.invalidateQueries({ predicate: ({ queryKey }) => queryKey[1] === tenant.tenantKey && ["load-finance", "profitability", "settlements"].includes(String(queryKey[0])), refetchType: "active" }),
    ]); } catch (cause) { setError(normalizeHttpError(cause)); } finally { setPending(false); }
  };
  return <Space direction="vertical">{error && <Alert type="error" message={t(`rating.errors.${error.code}`, { defaultValue: error.message })} />}
    {accepted ? <Alert type="success" message={t("billingCommands.accepted")} description={accepted.snapshotId} /> : <Button disabled={pending || !access.data?.can || !user.data?.employeeId} loading={pending} onClick={() => void accept()}>{t("billingCommands.accept")}</Button>}
    {accepted && <PrimaryInvoiceForm accepted={accepted} runtimeVerified={runtimeVerified} />}
  </Space>;
}
