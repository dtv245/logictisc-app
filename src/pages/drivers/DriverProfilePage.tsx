import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Card, Col, Descriptions, Row, Space, Spin, Statistic, Tabs, Tag, Typography } from "antd";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import { driverProfileApi } from "@/api/drivers/driver-profile.api";
import { driverProfileSections, type DriverProfileSectionDefinition } from "@/components/drivers/profile/driverProfileSections";
import { DriverProfileSection } from "@/components/drivers/profile/DriverProfileSection";
import { PageHeader } from "@/components/PageHeader";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { formatDateOnly } from "@/formatters/dateTime";
import type { DriverComplianceStatusView, DriverDirectoryItem, DriverProfileCounts, DriverProfileSummaryView } from "@/types/drivers/driver-profile.types";
import { ApiHttpError } from "@/utils/httpError";

type WorkspaceMode = "operations" | "payroll" | "self";

const isRole = (roles: readonly string[] | undefined, accepted: readonly string[]): boolean =>
  Boolean(roles?.some((role) => accepted.includes(role)));

const getErrorStatus = (error: unknown): number | undefined => error instanceof ApiHttpError ? error.statusCode : undefined;
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : "";

const COUNT_KEYS: readonly (keyof DriverProfileCounts)[] = [
  "personalProfiles", "licenses", "healthChecks", "certifications", "emergencyContacts", "contracts", "insurances",
  "dependents", "bankAccounts", "operationalStatuses", "violations", "accidents", "documents",
];

const ComplianceCard = ({ titleKey, status }: { titleKey: string; status: DriverComplianceStatusView }) => {
  const { t } = useTranslation();
  const expiry = status.expiryStatus;
  const color = expiry === "EXPIRED" ? "red" : expiry === "EXPIRING_SOON" ? "orange" : expiry === "VALID" ? "green" : "default";
  return (
    <Card size="small">
      <Typography.Text type="secondary">{t(titleKey)}</Typography.Text>
      <div style={{ marginTop: 8 }}>
        {status.hasActiveRecord ? (
          <Tag color={color}>{expiry ? t(`driverProfile.expiryStatuses.${expiry}`) : t("driverProfile.values.noExpiryDate")}</Tag>
        ) : <Tag>{t("driverProfile.values.noActiveRecord")}</Tag>}
      </div>
    </Card>
  );
};

function ProfileSummary({ summary }: { summary: DriverProfileSummaryView }) {
  const { t, i18n } = useTranslation();
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Title level={5} style={{ margin: 0 }}>{t("driverProfile.summary.title")}</Typography.Title>
      <Row gutter={[12, 12]}>
        {COUNT_KEYS.map((key) => (
          <Col key={key} xs={12} sm={8} md={6} lg={4}>
            <Card size="small"><Statistic title={t(`driverProfile.counts.${key}`)} value={summary.counts[key]} /></Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}><ComplianceCard titleKey="driverProfile.summary.license" status={summary.license} /></Col>
        <Col xs={24} sm={12} lg={6}><ComplianceCard titleKey="driverProfile.summary.healthCheck" status={summary.healthCheck} /></Col>
        <Col xs={24} sm={12} lg={6}><ComplianceCard titleKey="driverProfile.summary.contract" status={summary.contract} /></Col>
        <Col xs={24} sm={12} lg={6}><ComplianceCard titleKey="driverProfile.summary.healthInsurance" status={summary.healthInsurance} /></Col>
      </Row>
      {summary.upcomingExpirations.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={t("driverProfile.summary.upcoming", { count: summary.upcomingExpirations.length })}
          description={summary.upcomingExpirations.slice(0, 5).map((item) => `${item.itemName}: ${formatDateOnly(item.expiryDate, { locale: i18n.language, timeZone: "Asia/Ho_Chi_Minh" })}`).join(" · ")}
        />
      ) : null}
      {summary.upcomingExpirationsTruncated ? <Typography.Text type="secondary">{t("driverProfile.summary.truncated")}</Typography.Text> : null}
    </Space>
  );
}

const displaySections = (mode: WorkspaceMode, roleList: readonly string[] | undefined): DriverProfileSectionDefinition[] => {
  if (mode === "self") {
    return driverProfileSections.filter((section) => section.key !== "violations" && section.key !== "accidents");
  }
  if (mode === "payroll") return driverProfileSections.filter((section) => section.group === "hr");
  if (isRole(roleList, ["ADMIN"])) return [...driverProfileSections];
  return driverProfileSections.filter((section) => section.group !== "hr");
};

function DriverProfileWorkspace({ driverId, mode, roles }: { driverId?: string; mode: WorkspaceMode; roles: readonly string[] | undefined }) {
  const { t, i18n } = useTranslation();
  const sections = displaySections(mode, roles);
  const [activeTab, setActiveTab] = useState(sections[0]?.key ?? "");
  const admin = isRole(roles, ["ADMIN"]);
  const canEditRecords = mode === "payroll"
    ? isRole(roles, ["ADMIN", "PAYROLL", "PAYROLL_MANAGER"])
    : mode === "operations" && isRole(roles, ["ADMIN", "DISPATCHER"]);
  const canReadDirectory = mode === "operations";

  const loadDriver = useCallback((signal: AbortSignal) =>
    driverId ? driverProfileApi.getDriver(driverId, signal) : Promise.reject(new Error("DRIVER_ID_REQUIRED")), [driverId]);
  const loadSummary = useCallback((signal: AbortSignal) =>
    driverId ? driverProfileApi.getSummary(driverId, signal) : Promise.reject(new Error("DRIVER_ID_REQUIRED")), [driverId]);
  const driver = useDriverProfileRequest<DriverDirectoryItem>(loadDriver, canReadDirectory && Boolean(driverId));
  const summary = useDriverProfileRequest<DriverProfileSummaryView>(loadSummary, canReadDirectory && Boolean(driverId));

  if (mode !== "self" && !driverId) return <NotFoundState />;
  if (canReadDirectory && driver.loading) return <Spin aria-label={t("asyncState.loading")} />;
  if (canReadDirectory && driver.error) {
    if (getErrorStatus(driver.error) === 403) return <ForbiddenState />;
    if (getErrorStatus(driver.error) === 404) return <NotFoundState />;
    return <QueryErrorState description={errorMessage(driver.error)} onRetry={driver.reload} retrying={driver.loading} />;
  }

  const heading = mode === "self"
    ? t("driverProfile.mine.title")
    : mode === "payroll"
      ? t("driverProfile.payroll.title")
      : `${driver.data?.firstName ?? ""} ${driver.data?.lastName ?? ""}`.trim();

  const tabItems = sections.map((section) => ({
    key: section.key,
    label: t(section.labelKey),
    children: activeTab === section.key ? (
      <DriverProfileSection
        key={`${driverId ?? "self"}-${section.key}`}
        definition={section}
        {...(driverId ? { driverId } : {})}
        self={mode === "self"}
        canEdit={canEditRecords}
        isAdmin={admin && mode !== "self"}
      />
    ) : null,
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader title={heading || t("driverProfile.title")} />
      {mode === "operations" && driver.data ? (
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 4 }} items={[
          { key: "email", label: t("driverProfile.fields.email"), children: driver.data.email },
          { key: "phone", label: t("driverProfile.fields.phoneNumber"), children: driver.data.phoneNumber || "—" },
          { key: "status", label: t("driverProfile.fields.employeeStatus"), children: <Tag>{driver.data.status}</Tag> },
          { key: "joined", label: t("driverProfile.fields.joinedDate"), children: formatDateOnly(driver.data.joinedDate, { locale: i18n.language, timeZone: "Asia/Ho_Chi_Minh" }) },
        ]} />
      ) : mode === "payroll" ? (
        <Alert type="info" showIcon message={t("driverProfile.payroll.idLabel", { id: driverId })} description={t("driverProfile.payroll.restrictedFields" )} />
      ) : null}
      {canReadDirectory && summary.error ? (
        getErrorStatus(summary.error) === 403
          ? <Alert type="warning" showIcon message={t("driverProfile.errors.summaryForbidden")} />
          : getErrorStatus(summary.error) === 404
            ? <Alert
                type="info"
                showIcon
                message={t("driverProfile.errors.summaryNotFound")}
                description={t("driverProfile.errors.summaryNotFoundDescription")}
                action={<Button size="small" onClick={summary.reload}>{t("actions.retry")}</Button>}
              />
            : <Alert
                type="error"
                showIcon
                message={t("driverProfile.errors.summaryUnavailable")}
                description={errorMessage(summary.error)}
                action={<Button size="small" onClick={summary.reload}>{t("actions.retry")}</Button>}
              />
      ) : null}
      {canReadDirectory && summary.data ? <ProfileSummary summary={summary.data} /> : null}
      <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarGutter={16} items={tabItems} />
    </Space>
  );
}

export function DriverProfilePage() {
  const { id, driverId } = useParams<{ id?: string; driverId?: string }>();
  const currentUser = useCurrentUser();
  const roles = currentUser.data?.roles;
  if (currentUser.isLoading) return <Spin />;
  if (isRole(roles, ["ADMIN", "DISPATCHER"])) {
    return <DriverProfileWorkspace driverId={id ?? driverId} mode="operations" roles={roles} />;
  }
  if (isRole(roles, ["PAYROLL", "PAYROLL_MANAGER"])) {
    return <DriverProfileWorkspace driverId={driverId ?? id} mode="payroll" roles={roles} />;
  }
  return <ForbiddenState />;
}

export function DriverPayrollProfilePage() {
  return <DriverProfilePage />;
}

export function DriverSelfProfilePage() {
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  if (currentUser.isLoading) return <Spin aria-label={t("asyncState.loading")} />;
  if (!isRole(currentUser.data?.roles, ["DRIVER"])) return <ForbiddenState />;
  return <DriverProfileWorkspace mode="self" roles={currentUser.data?.roles} />;
}
