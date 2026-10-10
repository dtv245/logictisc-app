/** Explicit date-only + business zone reporting scope. No fleet enumeration, prefetch or history synthesis. */
import { useCan, useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { FormGrid } from "@/forms/FormGrid";
import { formatDateTime } from "@/formatters/dateTime";
import { isUuid } from "@/utils/uuid";
import type { ApiHttpError } from "@/providers/api/httpError";
import type { FleetReport, FleetReportQuery } from "@/types/fleetReport.dto";
import { fleetReportApi, fleetReportKey } from "@/features/fleet/fleetReport.api";
import { FleetKpiGrid } from "@/features/fleet/FleetKpiGrid";
import { FleetHealthTable } from "@/features/fleet/FleetHealthTable";

interface ScopeForm {
  policyId: string;
  truckIds: string;
  firstDate: Dayjs;
  exclusiveLastDate: Dayjs;
  businessZoneId: string;
}

export function FleetReportPage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const [form] = Form.useForm<ScopeForm>();
  const [scope, setScope] = useState<FleetReportQuery | null>(null);
  const access = useCan({ resource: "fleet-reports", action: "FLEET_REPORT_VIEW" });

  const query = useCustom<FleetReport, ApiHttpError>({
    url: fleetReportApi.health,
    method: "get",
    config: { query: scope ?? {} },
    errorNotification: false,
    queryOptions: {
      enabled: Boolean(scope && tenant?.tenantKey && access.data?.can),
      queryKey: fleetReportKey(tenant?.tenantKey, scope),
    },
  });

  if (access.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin aria-label={t("asyncState.loading")} />
      </div>
    );
  }

  if (!tenant?.tenantKey || access.data?.can !== true) {
    return <ForbiddenState />;
  }

  const report = query.data?.data;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: "100%" }}>
      <PageHeader title={t("fleet.title")} />
      <Alert type="info" showIcon message={t("fleet.scopeHelp")} />

      <Card bordered style={{ width: "100%" }}>
        <Form
          form={form}
          layout="vertical"
          scrollToFirstError={{ behavior: "smooth", block: "center" }}
          onFinish={(values) =>
            setScope({
              policyId: values.policyId.trim(),
              truckIds: values.truckIds
                .trim()
                .split(/[\s,]+/)
                .filter(Boolean)
                .join(","),
              firstDate: values.firstDate.format("YYYY-MM-DD"),
              exclusiveLastDate: values.exclusiveLastDate.format("YYYY-MM-DD"),
              businessZoneId: values.businessZoneId.trim(),
            })
          }
        >
          {/* Section 1: Published Policy & Vehicle Scope (2 inputs <= 7) */}
          <div style={{ marginBottom: 24 }}>
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              {t("fleet.policyScope")}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t("fleet.policyScopeHelp")}
            </Typography.Paragraph>

            <FormGrid
              columns={2}
              items={[
                {
                  key: "policyId",
                  node: (
                    <Form.Item
                      name="policyId"
                      label={t("fleet.policyId")}
                      rules={[
                        { required: true },
                        {
                          validator: async (_, value: string | undefined) => {
                            if (!isUuid(value?.trim())) throw new Error(t("fleet.invalidUuid"));
                          },
                        },
                      ]}
                    >
                      <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                    </Form.Item>
                  ),
                },
                {
                  key: "trucks",
                  node: (
                    <Form.Item
                      name="truckIds"
                      label={t("fleet.truckIds")}
                      rules={[
                        { required: true },
                        {
                          validator: async (_, value: string | undefined) => {
                            const ids = value?.trim().split(/[\s,]+/).filter(Boolean) ?? [];
                            if (
                              !ids.length ||
                              ids.length > 200 ||
                              ids.some((id) => !isUuid(id)) ||
                              new Set(ids).size !== ids.length
                            ) {
                              throw new Error(t("fleet.invalidTruckIds"));
                            }
                          },
                        },
                      ]}
                    >
                      <Input.TextArea rows={2} placeholder="UUID 1, UUID 2..." />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>

          {/* Section 2: Reporting Period & Business Time Zone (3 inputs <= 7) */}
          <div style={{ marginBottom: 24 }}>
            <Typography.Title level={5} style={{ marginBottom: 4 }}>
              {t("fleet.periodScope")}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {t("fleet.periodScopeHelp")}
            </Typography.Paragraph>

            <FormGrid
              columns={2}
              items={[
                {
                  key: "firstDate",
                  node: (
                    <Form.Item
                      name="firstDate"
                      label={t("fleet.firstDate")}
                      rules={[{ required: true }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  ),
                },
                {
                  key: "lastDate",
                  node: (
                    <Form.Item
                      name="exclusiveLastDate"
                      label={t("fleet.exclusiveLastDate")}
                      dependencies={["firstDate"]}
                      rules={[
                        { required: true },
                        {
                          validator: async (_, value: Dayjs | null) => {
                            const first: Dayjs | undefined = form.getFieldValue("firstDate");
                            if (first && value && !value.isAfter(first, "day")) {
                              throw new Error(t("fleet.invalidPeriod"));
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  ),
                },
                {
                  key: "zone",
                  node: (
                    <Form.Item
                      name="businessZoneId"
                      label={t("fleet.businessZoneId")}
                      rules={[
                        { required: true, whitespace: true },
                        {
                          validator: async (_, value: string | undefined) => {
                            try {
                              if (!value?.trim()) throw new Error();
                              new Intl.DateTimeFormat("en", { timeZone: value.trim() });
                            } catch {
                              throw new Error(t("fleet.invalidZone"));
                            }
                          },
                        },
                      ]}
                    >
                      <Input placeholder="Asia/Ho_Chi_Minh" />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>

          {/* Footer: Exactly 1 primary button, separate reset button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Button
              onClick={() => {
                form.resetFields();
                setScope(null);
              }}
              disabled={Boolean(scope && query.isFetching)}
            >
              {t("common.reset")}
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={Boolean(scope && query.isFetching)}
            >
              {t("fleet.loadReport")}
            </Button>
          </div>
        </Form>
      </Card>

      {scope && (
        query.isError ? (
          query.error.statusCode === 403 ? (
            <ForbiddenState />
          ) : (
            <QueryErrorState
              description={
                query.error.statusCode === 409 || query.error.code === "CONFLICT"
                  ? t("fleet.errors.CONFLICT_409")
                  : `${t(`fleet.errors.${query.error.code}`, { defaultValue: query.error.message })}${query.error.requestId ? ` (${query.error.requestId})` : ""}`
              }
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          )
        ) : query.isLoading || query.isFetching ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <Spin aria-label={t("asyncState.loading")} />
          </div>
        ) : !report ? (
          <EmptyState />
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, md: 2 }}
              items={[
                {
                  key: "policy",
                  label: t("fleet.policyVersion"),
                  children: `${report.policyCode} / ${report.policyVersion}`,
                },
                {
                  key: "reporting",
                  label: t("fleet.reportingPolicyVersion"),
                  children: `${report.reportingPolicyCode} / ${report.reportingPolicyVersion}`,
                },
                {
                  key: "period",
                  label: t("fleet.period"),
                  children: `${formatDateTime(report.period.from, {
                    locale: i18n.language,
                    ...(report.period.businessZoneId ? { timeZone: report.period.businessZoneId } : {}),
                  })} → ${formatDateTime(report.period.to, {
                    locale: i18n.language,
                    ...(report.period.businessZoneId ? { timeZone: report.period.businessZoneId } : {}),
                  })}`,
                },
                {
                  key: "zone",
                  label: t("fleet.businessZoneId"),
                  children: report.period.businessZoneId ?? "—",
                },
                {
                  key: "time",
                  label: t("fleet.calculatedAt"),
                  children: formatDateTime(report.calculatedAt, { locale: i18n.language }),
                },
              ]}
            />
            <FleetKpiGrid report={report} />
            <div>
              <Typography.Title level={3} style={{ marginBottom: 16 }}>
                {t("fleet.coverage")}
              </Typography.Title>
              <FleetHealthTable coverage={report.coverage} />
            </div>
          </Space>
        )
      )}
    </Space>
  );
}
