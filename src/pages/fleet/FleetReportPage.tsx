import { useCan, useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Select,
  Space,
  Spin,
  Typography,
  theme,
} from "antd";
import type { Dayjs } from "dayjs";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, QueryErrorState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { FormGrid } from "@/forms/FormGrid";
import { formatDateTime } from "@/formatters/dateTime";
import { isUuid } from "@/utils/uuid";
import type { ApiHttpError } from "@/utils/httpError";
import type { FleetReport, FleetReportQuery } from "@/types/fleetReport.dto";
import type { Truck } from "@/types/truck.types";
import { fleetReportApi, fleetReportKey } from "@/features/fleet/api/fleetReport.api";
import { FleetKpiGrid } from "@/features/fleet/components/FleetKpiGrid";
import { FleetHealthTable } from "@/features/fleet/components/FleetHealthTable";
import {
  dayjs,
  exclusiveToInclusiveLastDate,
  formatPeriodConfirmation,
  getAllSupportedTimeZones,
  getFleetPeriodPresets,
  inclusiveToExclusiveLastDate,
  isDateDisabledAfterToday,
} from "@/features/fleet/utils/fleetDateRange";

const FleetCharts = lazy(() =>
  import("@/features/fleet/components/FleetCharts").then((module) => ({ default: module.FleetCharts })),
);

interface ScopeForm {
  policyId: string;
  truckIds: string[];
  dateRange: [Dayjs, Dayjs];
  businessZoneId: string;
}

interface FleetPolicyOption {
  id: string;
  code: string;
  version: number;
}

export interface FleetReportPageProps {
  policies?: FleetPolicyOption[];
  trucks?: Truck[];
}

export function FleetReportPage({ policies: propPolicies, trucks: propTrucks }: FleetReportPageProps = {}) {
  const { t, i18n } = useTranslation();
  const { tenant } = useCurrentTenant();
  const { token } = theme.useToken();
  const [form] = Form.useForm<ScopeForm>();
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = useMemo<FleetReportQuery | null>(() => {
    const policyId = searchParams.get("policyId");
    const truckIds = searchParams.get("truckIds");
    const firstDate = searchParams.get("firstDate");
    const exclusiveLastDate = searchParams.get("exclusiveLastDate");
    if (!policyId || !truckIds || !firstDate || !exclusiveLastDate) return null;
    return {
      policyId,
      truckIds: truckIds.split(/[\s,]+/).filter(Boolean).join(","),
      firstDate,
      exclusiveLastDate,
      businessZoneId: searchParams.get("businessZoneId") || "Asia/Ho_Chi_Minh",
    };
  }, [searchParams]);
  const access = useCan({ resource: "fleet-reports", action: "FLEET_REPORT_VIEW" });
  const [loadPolicies, setLoadPolicies] = useState(Boolean(propPolicies));
  const [loadTrucks, setLoadTrucks] = useState(Boolean(propTrucks));

  const watchedPolicyId = Form.useWatch("policyId", form);
  const watchedTruckIds = Form.useWatch("truckIds", form);
  const watchedDateRange = Form.useWatch("dateRange", form);
  const watchedZone = Form.useWatch("businessZoneId", form) || "Asia/Ho_Chi_Minh";

  const policiesQuery = useCustom<FleetPolicyOption[]>({
    url: "/api/fleet/policies",
    method: "get",
    queryOptions: {
      enabled: Boolean(!propPolicies && loadPolicies && tenant?.tenantKey && access.data?.can),
      staleTime: 60_000,
      retry: false,
    },
  });

  const trucksQuery = useCustom<Truck[]>({
    url: "/api/trucks",
    method: "get",
    queryOptions: {
      enabled: Boolean(!propTrucks && loadTrucks && tenant?.tenantKey && access.data?.can),
      staleTime: 60_000,
      retry: false,
    },
  });

  const policyOptions = useMemo(() => {
    const raw = propPolicies ?? policiesQuery.data?.data;
    const list = Array.isArray(raw) ? raw : [];
    const options = list.map((p) => ({
      value: p.id,
      label: `${p.code} (v${p.version})`,
    }));
    if (watchedPolicyId && !options.some((o) => o.value === watchedPolicyId)) {
      options.unshift({
        value: watchedPolicyId,
        label: watchedPolicyId,
      });
    }
    return options;
  }, [propPolicies, policiesQuery.data?.data, watchedPolicyId]);

  const truckOptions = useMemo(() => {
    const raw = propTrucks ?? trucksQuery.data?.data;
    const list = Array.isArray(raw) ? raw : [];
    const options = list.map((truck) => ({
      value: truck.id,
      label: `${truck.licensePlate || truck.number} (${truck.type || "N/A"})`,
      licensePlate: truck.licensePlate,
      truckNumber: truck.number,
      truckType: truck.type,
    }));
    if (Array.isArray(watchedTruckIds)) {
      for (const id of watchedTruckIds) {
        if (!options.some((o) => o.value === id)) {
          options.push({
            value: id,
            label: id,
            licensePlate: null,
            truckNumber: id,
            truckType: "N/A",
          });
        }
      }
    }
    return options;
  }, [propTrucks, trucksQuery.data?.data, watchedTruckIds]);

  const selectedCount = Array.isArray(watchedTruckIds) ? watchedTruckIds.length : 0;

  const presets = useMemo(() => {
    return getFleetPeriodPresets(watchedZone, (key, def) => t(key, def));
  }, [watchedZone, t]);

  const timeZoneOptions = useMemo(() => getAllSupportedTimeZones(), []);

  // Đồng bộ từ URL query vào Form khi tải trang
  useEffect(() => {
    const pId = searchParams.get("policyId");
    const tIds = searchParams.get("truckIds");
    const fDate = searchParams.get("firstDate");
    const eDate = searchParams.get("exclusiveLastDate");
    const zone = searchParams.get("businessZoneId") || "Asia/Ho_Chi_Minh";

    if (pId && tIds && fDate && eDate && zone) {
      const truckIdList = tIds.split(/[\s,]+/).filter(Boolean);
      const inclusiveLast = exclusiveToInclusiveLastDate(eDate, zone);
      const initialRange: [Dayjs, Dayjs] = [
        dayjs.tz(fDate, "YYYY-MM-DD", zone),
        dayjs.tz(inclusiveLast, "YYYY-MM-DD", zone),
      ];

      form.setFieldsValue({
        policyId: pId,
        truckIds: truckIdList,
        dateRange: initialRange,
        businessZoneId: zone,
      });
    } else {
      if (!form.getFieldValue("businessZoneId")) {
        form.setFieldValue("businessZoneId", zone);
      }
    }
  }, [form, searchParams]);

  // Điều kiện hợp lệ để bật nút "Xem báo cáo"
  const isFormValid = useMemo(() => {
    if (!watchedPolicyId || !isUuid(watchedPolicyId.trim())) return false;
    if (
      !Array.isArray(watchedTruckIds) ||
      watchedTruckIds.length === 0 ||
      watchedTruckIds.length > 200 ||
      watchedTruckIds.some((id) => !isUuid(id)) ||
      new Set(watchedTruckIds).size !== watchedTruckIds.length
    ) {
      return false;
    }
    if (!watchedDateRange || !watchedDateRange[0] || !watchedDateRange[1]) return false;
    if (watchedDateRange[1].isBefore(watchedDateRange[0], "day")) return false;
    if (isDateDisabledAfterToday(watchedDateRange[1], watchedZone)) return false;
    try {
      new Intl.DateTimeFormat("en", { timeZone: watchedZone.trim() });
    } catch {
      return false;
    }
    return true;
  }, [watchedPolicyId, watchedTruckIds, watchedDateRange, watchedZone]);

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

  const handleFinish = (values: ScopeForm) => {
    const zone = values.businessZoneId.trim();
    const fDate = values.dateRange[0].format("YYYY-MM-DD");
    const eDate = inclusiveToExclusiveLastDate(values.dateRange[1], zone);
    const tIds = values.truckIds.join(",");

    const newScope: FleetReportQuery = {
      policyId: values.policyId.trim(),
      truckIds: tIds,
      firstDate: fDate,
      exclusiveLastDate: eDate,
      businessZoneId: zone,
    };

    // Đồng bộ lên URL query parameters
    setSearchParams(
      {
        policyId: newScope.policyId,
        truckIds: newScope.truckIds,
        firstDate: newScope.firstDate,
        exclusiveLastDate: newScope.exclusiveLastDate,
        businessZoneId: newScope.businessZoneId,
      },
      { replace: true },
    );
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldValue("businessZoneId", "Asia/Ho_Chi_Minh");
    setSearchParams({}, { replace: true });
  };

  const handleSelectAllTrucks = () => {
    const allIds = truckOptions.map((opt) => opt.value).slice(0, 200);
    form.setFieldValue("truckIds", allIds);
    form.validateFields(["truckIds"]);
  };

  const report = query.data?.data;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: "100%" }}>
      <PageHeader title={t("fleet.title")} />
      <Alert type="info" showIcon message={t("fleet.scopeHelp")} />

      <Card bordered style={{ width: "100%", borderRadius: token.borderRadiusLG }}>
        <Form
          form={form}
          layout="vertical"
          scrollToFirstError={{ behavior: "smooth", block: "center" }}
          onFinish={handleFinish}
          initialValues={{ businessZoneId: "Asia/Ho_Chi_Minh" }}
        >
          {/* Section 1: Published Policy & Vehicle Scope */}
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
                        { required: true, message: t("fleet.errors.policyRequired") },
                        {
                          validator: async (_, value: string | undefined) => {
                            if (!value || !isUuid(value.trim())) throw new Error(t("fleet.invalidUuid"));
                          },
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        aria-label={t("fleet.policyId")}
                        placeholder={t("fleet.selectPolicyPlaceholder")}
                        options={policyOptions}
                        loading={policiesQuery.isLoading}
                        onOpenChange={(open) => {
                          if (open) setLoadPolicies(true);
                        }}
                        onSearch={() => setLoadPolicies(true)}
                        filterOption={(input, option) =>
                          (option?.label ? String(option.label).toLowerCase() : "").includes(input.toLowerCase()) ||
                          (option?.value ? String(option.value).toLowerCase() : "").includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  ),
                },
                {
                  key: "trucks",
                  node: (
                    <Form.Item
                      name="truckIds"
                      label={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <span>{t("fleet.truckIds")}</span>
                          <Button
                            type="link"
                            size="small"
                            onClick={handleSelectAllTrucks}
                            style={{ padding: 0, height: "auto" }}
                          >
                            {t("fleet.selectAllTrucks")}
                          </Button>
                        </div>
                      }
                      extra={
                        selectedCount > 0 ? (
                          <Typography.Text type="secondary" className="tabular-nums">
                            {t("fleet.selectedTruckCount", {
                              defaultValue: `Đã chọn: ${selectedCount} / 200 xe`,
                              count: selectedCount,
                            })}
                          </Typography.Text>
                        ) : undefined
                      }
                      rules={[
                        { required: true, message: t("fleet.errors.trucksRequired") },
                        {
                          validator: async (_, value: string[] | undefined) => {
                            if (!value || !value.length) {
                              throw new Error(t("fleet.errors.trucksRequired"));
                            }
                            if (value.length > 200) {
                              throw new Error(t("fleet.errors.trucksMax200"));
                            }
                            if (value.some((id) => !isUuid(id)) || new Set(value).size !== value.length) {
                              throw new Error(t("fleet.invalidTruckIds"));
                            }
                          },
                        },
                      ]}
                    >
                      <Select
                        mode="multiple"
                        showSearch
                        aria-label={t("fleet.truckIds")}
                        placeholder={t("fleet.selectTrucksPlaceholder")}
                        options={truckOptions}
                        loading={trucksQuery.isLoading}
                        maxTagCount={10}
                        onOpenChange={(open) => {
                          if (open) setLoadTrucks(true);
                        }}
                        onSearch={() => setLoadTrucks(true)}
                        filterOption={(input, option) => {
                          const queryText = input.toLowerCase();
                          const label = option?.label ? String(option.label).toLowerCase() : "";
                          const lp = option?.licensePlate?.toLowerCase() ?? "";
                          const num = option?.truckNumber?.toLowerCase() ?? "";
                          return label.includes(queryText) || lp.includes(queryText) || num.includes(queryText);
                        }}
                      />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>

          {/* Section 2: Reporting Period & Business Time Zone */}
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
                  key: "dateRange",
                  node: (
                    <Form.Item
                      name="dateRange"
                      label={t("fleet.dateRange")}
                      extra={
                        watchedDateRange && watchedDateRange[0] && watchedDateRange[1] ? (
                          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                            {formatPeriodConfirmation(
                              watchedDateRange[0],
                              watchedDateRange[1],
                              watchedZone,
                              i18n.language,
                            )}
                          </Typography.Text>
                        ) : undefined
                      }
                      rules={[
                        { required: true, message: t("fleet.errors.dateRangeRequired") },
                        {
                          validator: async (_, value: [Dayjs, Dayjs] | undefined) => {
                            if (!value || !value[0] || !value[1]) {
                              throw new Error(t("fleet.errors.dateRangeRequired"));
                            }
                            if (value[1].isBefore(value[0], "day")) {
                              throw new Error(t("fleet.invalidPeriod"));
                            }
                            if (isDateDisabledAfterToday(value[1], watchedZone)) {
                              throw new Error(t("fleet.errors.futureDateNotAllowed"));
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker.RangePicker
                        aria-label={t("fleet.dateRange")}
                        style={{ width: "100%" }}
                        presets={presets}
                        disabledDate={(current) => isDateDisabledAfterToday(current, watchedZone)}
                      />
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
                        { required: true, message: t("fleet.errors.timeZoneRequired") },
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
                      <Select
                        showSearch
                        aria-label={t("fleet.businessZoneId")}
                        options={timeZoneOptions}
                        placeholder="Asia/Ho_Chi_Minh"
                        filterOption={(input, option) =>
                          (option?.label ? String(option.label).toLowerCase() : "").includes(input.toLowerCase()) ||
                          (option?.value ? String(option.value).toLowerCase() : "").includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>

          {/* Footer: Reset and Load Report Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Button
              onClick={handleReset}
              disabled={Boolean(scope && query.isFetching)}
              aria-label={t("common.reset")}
            >
              {t("common.reset")}
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              loading={Boolean(scope && query.isFetching)}
              disabled={!isFormValid || Boolean(scope && query.isFetching)}
              aria-label={t("fleet.loadReport")}
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
                  children: <span className="tabular-nums">{`${report.policyCode} / ${report.policyVersion}`}</span>,
                },
                {
                  key: "reporting",
                  label: t("fleet.reportingPolicyVersion"),
                  children: <span className="tabular-nums">{`${report.reportingPolicyCode} / ${report.reportingPolicyVersion}`}</span>,
                },
                {
                  key: "period",
                  label: t("fleet.period"),
                  children: (
                    <span className="tabular-nums">
                      {`${formatDateTime(report.period.from, {
                        locale: i18n.language,
                        ...(report.period.businessZoneId ? { timeZone: report.period.businessZoneId } : {}),
                      })} → ${formatDateTime(report.period.to, {
                        locale: i18n.language,
                        ...(report.period.businessZoneId ? { timeZone: report.period.businessZoneId } : {}),
                      })}`}
                    </span>
                  ),
                },
                {
                  key: "zone",
                  label: t("fleet.businessZoneId"),
                  children: report.period.businessZoneId ?? "—",
                },
                {
                  key: "time",
                  label: t("fleet.calculatedAt"),
                  children: (
                    <span className="tabular-nums">
                      {formatDateTime(report.calculatedAt, { locale: i18n.language })}
                    </span>
                  ),
                },
              ]}
            />
            <FleetKpiGrid report={report} />
            <Suspense
              fallback={
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <Spin aria-label={t("asyncState.loading")} />
                </div>
              }
            >
              <FleetCharts report={report} />
            </Suspense>
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
