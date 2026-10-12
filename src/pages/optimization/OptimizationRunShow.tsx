import { useCan, useCustom } from "@refinedev/core";
import { lazy, Suspense, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Descriptions, Row, Select, Skeleton, Space, Spin, Statistic, Tabs, Tag, Tooltip, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
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

const CandidateVisualizations = lazy(
  () => import("@/features/optimization/visualizations/CandidateVisualizations"),
);

function RunVisualizationsTab({ outcome }: { outcome: OptimizationOutcome }) {
  const { t } = useTranslation();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    outcome.candidates[0]?.id || "",
  );

  const selectedCandidate = useMemo(
    () =>
      outcome.candidates.find((c) => c.id === selectedCandidateId) ||
      outcome.candidates[0] ||
      null,
    [outcome.candidates, selectedCandidateId],
  );

  if (outcome.candidates.length === 0) {
    return (
      <Card size="small" style={{ background: "#f8fafc", textAlign: "center", padding: 24 }}>
        <Typography.Text type="secondary">
          {t("optimization.noCandidatesToVisualize", {
            defaultValue: "Không có candidate nào để hiển thị trực quan hoá.",
          })}
        </Typography.Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div className="optimization-candidate-select-container">
        <span style={{ fontWeight: 600 }}>{t("optimization.selectCandidateToVisualize")}</span>
        <Select
          className="optimization-candidate-select"
          value={selectedCandidate?.id}
          onChange={(val) => setSelectedCandidateId(val)}
          options={outcome.candidates.map((c) => ({
            value: c.id,
            label: `${c.rank ? `#${c.rank} - ` : ""}${c.id.substring(0, 8)}... (${c.feasible ? t("optimization.feasible") : t("optimization.infeasible")}, Xe: ${c.truckId.substring(0, 8)}..., Tài xế: ${c.driverId.substring(0, 8)}...)`,
          }))}
        />
      </div>
      <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
        <CandidateVisualizations candidate={selectedCandidate} />
      </Suspense>
    </Space>
  );
}

function RunContent({ outcome }: { outcome: OptimizationOutcome }) {
  const { t, i18n } = useTranslation();
  const actions = useOptimizationActions(outcome);

  const feasibleCount = outcome.candidates.filter((c) => c.feasible).length;
  const infeasibleCount = outcome.candidates.filter((c) => !c.feasible).length;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title={t("optimization.runId")}
        description={
          <span className="optimization-run-id-text">
            {outcome.run.id}
          </span>
        }
        extra={
          <Link to={routes.optimization}>
            <Button>{t("optimization.newRun")}</Button>
          </Link>
        }
      />

      {/* Tóm tắt lần chạy bằng Statistic + Tag */}
      <Card size="small">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={
                <Space size="small">
                  <span>{t("optimization.policyId")}</span>
                  <Tag color="blue">Policy</Tag>
                </Space>
              }
              value={outcome.run.policyId}
              formatter={() => (
                <Tooltip title={outcome.run.policyId}>
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: "monospace",
                      display: "inline-block",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {outcome.run.policyId}
                  </span>
                </Tooltip>
              )}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title={
                <Space size="small">
                  <span>{t("optimization.calculatedAt")}</span>
                  <Tag color="cyan">Audit</Tag>
                </Space>
              }
              formatter={() => (
                <span style={{ fontSize: 14 }}>
                  {formatDateTime(outcome.run.calculatedAt, { locale: i18n.language })}
                </span>
              )}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={
                <Space size="small">
                  <span>{t("optimization.feasibleCandidates")}</span>
                  <Tag color="success">PASS</Tag>
                </Space>
              }
              value={feasibleCount}
              valueStyle={{ color: "#3f8600", fontWeight: 700 }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title={
                <Space size="small">
                  <span>{t("optimization.infeasibleCandidates")}</span>
                  <Tag color="error">REJECT</Tag>
                </Space>
              }
              value={infeasibleCount}
              valueStyle={{ color: "#cf1322", fontWeight: 700 }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <OptimizationError error={actions.error} outcome={outcome} />

      {actions.accepted && (
        <Alert
          type="success"
          showIcon
          message={t("optimization.acceptSuccess")}
          description={
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                <span>
                  {t("optimization.candidateId")}: <strong>{actions.accepted.candidateId}</strong>
                </span>
                {" / "}
                <span>
                  {t("optimization.driverAssignmentId")}:{" "}
                  <Link
                    to={routes.resources.trips.show.replace(":id", actions.accepted.tripId)}
                    style={{ fontWeight: 600, textDecoration: "underline", wordBreak: "break-all" }}
                  >
                    {actions.accepted.driverAssignmentId}
                  </Link>
                </span>
              </div>
              <div style={{ color: "#595959", fontSize: 13 }}>
                {t("optimization.acceptedAssignmentNotice")}
              </div>
            </Space>
          }
        />
      )}

      <Alert type="info" message={t("optimization.auditNotice")} />

      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, sm: 1, md: 2 }}
        items={[
          {
            key: "policy",
            label: t("optimization.policyId"),
            children: (
              <span style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                {outcome.run.policyId}
              </span>
            ),
          },
          ...(["calculatedAt", "planningUntil"] as const).map((field) => ({
            key: field,
            label: t(`optimization.${field}`),
            children: formatDateTime(outcome.run[field], { locale: i18n.language }),
          })),
          {
            key: "request",
            label: t("rating.correlationId"),
            children: (
              <span style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}>
                {outcome.run.correlationId}
              </span>
            ),
          },
        ]}
      />

      <Tabs
        defaultActiveKey="table"
        destroyOnHidden={false}
        items={[
          {
            key: "table",
            label: t("optimization.targetsSection"),
            children: <OptimizationCandidateTable outcome={outcome} actions={actions} />,
          },
          {
            key: "visualizations",
            label: t("optimization.visualizations"),
            children: <RunVisualizationsTab outcome={outcome} />,
          },
        ]}
      />
    </Space>
  );
}

export function OptimizationRunShow() {
  const { id = "" } = useParams();
  const { tenant } = useCurrentTenant();
  const { t } = useTranslation();
  const access = useCan({ resource: "optimization", action: "OPTIMIZATION_VIEW" });
  const query = useCustom<OptimizationOutcome, ApiHttpError>({
    url: optimizationApi.run(id),
    method: "get",
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(isUuid(id) && tenant?.tenantKey && access.data?.can),
      queryKey: optimizationKeys.run(tenant?.tenantKey, id),
    },
  });

  if (access.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, width: "100%" }}>
        <Spin size="large" aria-label={t("asyncState.loading")} />
      </div>
    );
  }
  if (!tenant?.tenantKey || access.data?.can !== true) return <ForbiddenState />;
  if (!isUuid(id)) return <Alert type="error" message={t("optimization.invalidUuid")} />;
  if (query.isError)
    return (
      <QueryErrorState
        description={`${query.error.message}${query.error.requestId ? ` (${query.error.requestId})` : ""}`}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  if (query.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, width: "100%" }}>
        <Spin size="large" aria-label={t("asyncState.loading")} />
      </div>
    );
  }
  if (!query.data?.data) return <EmptyState />;
  return <RunContent key={query.data.data.run.id} outcome={query.data.data} />;
}
