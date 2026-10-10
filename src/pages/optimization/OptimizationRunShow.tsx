import { useCan, useCustom } from "@refinedev/core";
import { Alert, Button, Descriptions, Space, Spin } from "antd";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { EmptyState } from "@/components/EmptyState";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { isUuid } from "@/utils/uuid";
import { formatDateTime } from "@/formatters/dateTime";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { OptimizationOutcome } from "@/types/optimization.dto";
import { routes } from "@/constants/routes";
import { optimizationApi, optimizationKeys } from "@/features/optimization/optimization.api";
import { useOptimizationActions } from "@/features/optimization/useOptimizationActions";
import { OptimizationCandidateTable } from "@/features/optimization/OptimizationCandidateTable";
import { OptimizationError } from "@/features/optimization/OptimizationError";
function RunContent({ outcome }: { outcome: OptimizationOutcome }) {
  const { t, i18n } = useTranslation(); const actions = useOptimizationActions(outcome);
  return <Space direction="vertical" size="large" style={{ width: "100%" }}><PageHeader title={t("optimization.runId")} description={outcome.run.id} extra={<Link to={routes.optimization}><Button>{t("optimization.newRun")}</Button></Link>} />
    <OptimizationError error={actions.error} />
    {actions.accepted && <Alert type="success" showIcon message={t("optimization.acceptSuccess")} description={`${t("optimization.candidateId")}: ${actions.accepted.candidateId} / ${t("optimization.driverAssignmentId")}: ${actions.accepted.driverAssignmentId}`} />}
    <Alert type="info" message={t("optimization.auditNotice")} />
    <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
      { key: "policy", label: t("optimization.policyId"), children: outcome.run.policyId },
      ...(["calculatedAt", "planningUntil"] as const).map((field) => ({ key: field, label: t(`optimization.${field}`), children: formatDateTime(outcome.run[field], { locale: i18n.language }) })),
      { key: "request", label: t("rating.correlationId"), children: outcome.run.correlationId },
    ]} />
    <OptimizationCandidateTable outcome={outcome} actions={actions} />
  </Space>;
}
export function OptimizationRunShow() {
  const { id = "" } = useParams(); const { tenant } = useCurrentTenant(); const { t } = useTranslation();
  const access = useCan({ resource: "optimization", action: "OPTIMIZATION_VIEW" });
  const query = useCustom<OptimizationOutcome, ApiHttpError>({ url: optimizationApi.run(id), method: "get", errorNotification: false,
    queryOptions: { enabled: Boolean(isUuid(id) && tenant?.tenantKey && access.data?.can), queryKey: optimizationKeys.run(tenant?.tenantKey, id) } });
  if (access.isLoading) return <Spin />;
  if (!tenant?.tenantKey || access.data?.can !== true) return <ForbiddenState />;
  if (!isUuid(id)) return <Alert type="error" message={t("optimization.invalidUuid")} />;
  if (query.isError) return <QueryErrorState description={`${query.error.message}${query.error.requestId ? ` (${query.error.requestId})` : ""}`} onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  if (query.isLoading) return <Spin aria-label={t("asyncState.loading")} />;
  if (!query.data?.data) return <EmptyState />;
  return <RunContent key={query.data.data.run.id} outcome={query.data.data} />;
}
