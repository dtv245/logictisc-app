/** Immutable self/finance payslip view with authorized single-flight PDF download. */
import { RAW_RESPONSE_META } from "@/types/apiClient.types";
import { useCan, useCustom } from "@refinedev/core";
import { Alert, Button, Space, Spin } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { isUuid } from "@/utils/uuid";
import { ApiHttpError } from "@/providers/api/httpError";
import { payslipApi, payslipKeys, downloadPayslipPdf, savePayslipPdf, type PayslipDownloader } from "@/features/payslips/payslip.api";
import { readPayslipSnapshot } from "@/features/payslips/payslip.snapshot";
import { PayslipSummary } from "@/features/payslips/PayslipSummary";
import type { PayslipDto } from "@/types/payslip.dto";
export function PayslipShow({ download }: { download?: PayslipDownloader }) {
  const { id } = useParams<{ id: string }>(); const { t } = useTranslation(); const { tenant } = useCurrentTenant(); const user = useCurrentUser();
  const access = useCan({ resource: "payslips", action: "PAYSLIP_VIEW" }); const [pending, setPending] = useState(false); const [error, setError] = useState<Error>(); const flight = useRef(false);
  const query = useCustom<PayslipDto, ApiHttpError>({ url: payslipApi.get(id ?? ""), method: "get", meta: RAW_RESPONSE_META, errorNotification: false,
    queryOptions: { enabled: Boolean(tenant?.tenantKey && user.data?.employeeId && isUuid(id) && access.data?.can), queryKey: payslipKeys.detail(tenant?.tenantKey, user.data?.employeeId, id ?? "") } });
  if (!isUuid(id)) return <NotFoundState />;
  if (access.isLoading) return <Spin />;
  if (access.data?.can !== true || query.error?.statusCode === 403) return <ForbiddenState />;
  if (query.isError) return <QueryErrorState description={query.error.message} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin />;
  if (!query.data?.data) return <EmptyState />;
  const snapshot = readPayslipSnapshot(query.data.data.snapshotJson);
  if (!snapshot) return <QueryErrorState description={t("payslips.snapshotUnavailable")} />;
  const onDownload = async () => {
    if (flight.current || !download || !tenant?.tenantKey || access.data?.can !== true || !isUuid(id)) return;
    flight.current = true; setPending(true); setError(undefined);
    try { const blob = await downloadPayslipPdf(id, download); savePayslipPdf(id, blob); }
    catch (cause) { setError(cause instanceof Error ? cause : new Error(t("payslips.pdfError"))); }
    finally { flight.current = false; setPending(false); }
  };
  return <Space direction="vertical" size="large" style={{ width: "100%" }}><PageHeader title={t("payslips.title")} extra={<Button disabled={pending || !download} loading={pending} onClick={() => void onDownload()}>{t("payslips.downloadPdf")}</Button>} />
    {error && <Alert type="error" message={error instanceof ApiHttpError ? t(`payslips.errors.${error.code}`, { defaultValue: error.message }) : t("payslips.pdfError")} description={error instanceof ApiHttpError ? `${error.code}${error.requestId ? ` / ${error.requestId}` : ""}` : undefined} />}
    <PayslipSummary payslip={query.data.data} snapshot={snapshot} />
  </Space>;
}
