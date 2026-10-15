import React, { useMemo, useState } from "react";
import { CanAccess } from "@refinedev/core";
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, HistoryOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  useDriverPayPolicies,
  useDriverPayPolicy,
  useDriverPayPolicyMutations,
} from "@/features/settlements/api/driverPayPolicy.query";
import { DriverPayPolicyForm } from "@/features/settlements/components/DriverPayPolicyForm";
import { DriverPayPolicyVersionHistory } from "@/features/settlements/components/DriverPayPolicyVersionHistory";
import {
  formatPercentDisplay,
  type DriverPayPolicyRequest,
} from "@/types/driverPayPolicy.dto";
import "./Settlements.scss";

const { Text } = Typography;

export const DriverPayPolicyShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { policy, isLoading: isPolicyLoading, refetch: refetchPolicy } =
    useDriverPayPolicy(id);
  const { policies, refetch: refetchList } = useDriverPayPolicies();
  const { createNewVersion, isSubmitting } = useDriverPayPolicyMutations();

  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Find all versions for this policy code
  const relatedVersions = useMemo(() => {
    if (!policy) return [];
    return policies
      .filter((p) => p.policyCode === policy.policyCode)
      .sort((a, b) => b.policyVersion - a.policyVersion);
  }, [policies, policy]);

  const latestVersion = relatedVersions[0] ?? policy;
  const isLatest = Boolean(policy && latestVersion && policy.id === latestVersion.id);

  const handleNewVersionSubmit = async (request: DriverPayPolicyRequest) => {
    if (!latestVersion) return;
    const created = await createNewVersion(latestVersion.id, request);
    if (created) {
      setIsVersionModalOpen(false);
      refetchPolicy();
      refetchList();
      navigate(`/settlements/policies/${created.id}`);
    }
  };

  if (isPolicyLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message={t("settlements.policyNotFound", "Policy not found")}
          description={
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/settlements/policies")}
            >
              {t("settlements.backToPolicies", "Back to Policies")}
            </Button>
          }
        />
      </div>
    );
  }

  const renderRateValue = () => {
    switch (policy.payMethod) {
      case "PER_MILE":
        return `${policy.perMileRate ?? 0} ${policy.currency} / mile (Basis: ${policy.mileageBasis || "ALL"})`;
      case "PER_LOAD":
        return `${policy.perLoadRate ?? 0} ${policy.currency} / load`;
      case "PERCENT_REVENUE":
        return `${formatPercentDisplay(policy.revenuePercentage)} of ${policy.revenueBasis || "INVOICE_SUBTOTAL"}`;
      case "HOURLY":
        return `${policy.hourlyRate ?? 0} ${policy.currency} / hour`;
      case "DAILY":
        return `${policy.dailyRate ?? 0} ${policy.currency} / day`;
      case "FLAT_RATE":
        return `${policy.flatRate ?? 0} ${policy.currency} flat`;
      default:
        return "-";
    }
  };

  return (
    <div className="settlements-container">
      {/* Top action bar */}
      <Space wrap style={{ marginBottom: 16, width: "100%" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/settlements/policies")}
        >
          {t("settlements.backToPolicies", "Back to Policies")}
        </Button>
        {isLatest ? (
          <CanAccess resource="driver-pay-policies" action="POLICY_NEW_VERSION">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsVersionModalOpen(true)}
          >
            {t("settlements.newVersionAction", "Create New Version")}
          </Button>
          </CanAccess>
        ) : (
          <Button
            type="default"
            icon={<HistoryOutlined />}
            onClick={() => {
              if (latestVersion) {
                navigate(`/settlements/policies/${latestVersion.id}`);
              }
            }}
          >
            {t(
              "settlements.goToLatestVersion",
              `Go to Latest Version (v${latestVersion?.policyVersion})`
            )}
          </Button>
        )}
      </Space>

      {/* Historical version warning */}
      {!isLatest && latestVersion && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message={
            <span>
              {t(
                "settlements.historicalNotice",
                `This is an archived version (v${policy.policyVersion}). Historical policy versions are strictly immutable.`
              )}
            </span>
          }
          description={
            <span>
              {t(
                "settlements.historicalDetails",
                `The active version is v${latestVersion.policyVersion}. New versions must be created from the latest version.`
              )}
            </span>
          }
        />
      )}

      {/* Policy Details Card */}
      <Card
        title={
          <div className="policy-show__title-space">
            <span className="policy-show__title-text">{policy.name}</span>
            <Tag color="geekblue">v{policy.policyVersion}</Tag>
            {isLatest ? (
              <Badge status="success" text={t("settlements.latest", "Latest / Active")} />
            ) : (
              <Tag color="warning">{t("settlements.archived", "Archived (Read-Only)")}</Tag>
            )}
          </div>
        }
        variant="borderless"
        className="settlement-card"
        style={{ marginBottom: 24 }}
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} className="settlement-descriptions">
          <Descriptions.Item label={t("settlements.policyCode", "Policy Code")}>
            <Text strong copyable className="break-all">
              {policy.policyCode}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.scope", "Driver Scope")}>
            {policy.driverId ? (
              <Tag color="purple" className="break-all">
                {t("settlements.driverId", "Driver")}: {policy.driverId}
              </Tag>
            ) : (
              <Tag color="cyan">{t("settlements.defaultAllDrivers", "Default (All Drivers)")}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.payMethod", "Pay Method")}>
            <Tag color="blue">{policy.payMethod}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t("settlements.primaryRate", "Compensation Rate")} span={2}>
            <Text strong className="break-word" style={{ fontSize: 16 }}>
              {renderRateValue()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.currency", "Currency")}>
            {policy.currency}
          </Descriptions.Item>

          <Descriptions.Item label={t("settlements.effectiveFrom", "Effective From")}>
            <span className="tabular-nums">{policy.effectiveFrom}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.effectiveTo", "Effective To")}>
            <span className="tabular-nums">{policy.effectiveTo || t("settlements.indefinite", "Present / Indefinite")}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.status", "Active Status")}>
            {policy.active ? (
              <Tag color="success">{t("settlements.active", "Active")}</Tag>
            ) : (
              <Tag color="error">{t("settlements.inactive", "Inactive")}</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label={t("settlements.detentionRate", "Detention Rate")}>
            <span className="tabular-nums">{policy.detentionRate ? `${policy.detentionRate} ${policy.currency}/hr` : "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.detentionFreeMinutes", "Detention Free Time")}>
            <span className="tabular-nums">{policy.detentionFreeMinutes ? `${policy.detentionFreeMinutes} mins` : "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.detentionBlockMinutes", "Detention Block")}>
            <span className="tabular-nums">{policy.detentionBlockMinutes ? `${policy.detentionBlockMinutes} mins` : "-"}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t("settlements.layoverRate", "Layover Rate")}>
            <span className="tabular-nums">{policy.layoverRate ? `${policy.layoverRate} ${policy.currency}` : "-"}</span>
          </Descriptions.Item>
          <Descriptions.Item label={t("settlements.stopPayRate", "Stop Pay Rate")}>
            <span className="tabular-nums">{policy.stopPayRate ? `${policy.stopPayRate} ${policy.currency}/stop` : "-"}</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Version History Table */}
      <Card
        title={t("settlements.versionHistoryTitle", "Version History for this Policy Code")}
        variant="borderless"
        className="settlement-card"
      >
        <DriverPayPolicyVersionHistory
          policyCode={policy.policyCode}
          versions={relatedVersions}
          selectedVersionId={policy.id}
          onSelectVersion={(v) => navigate(`/settlements/policies/${v.id}`)}
          onCreateNewVersion={() => setIsVersionModalOpen(true)}
        />
      </Card>

      {/* Modal: Create New Version from latest */}
      <Modal
        title={t("settlements.newVersionTitle", "Create New Policy Version")}
        open={isVersionModalOpen}
        onCancel={() => setIsVersionModalOpen(false)}
        footer={null}
        width="min(800px, 95vw)"
        style={{ maxWidth: "calc(100vw - 32px)", top: 20 }}
        destroyOnClose
      >
        {latestVersion && (
          <DriverPayPolicyForm
            mode="new-version"
            previousPolicy={latestVersion}
            onSubmit={handleNewVersionSubmit}
            onCancel={() => setIsVersionModalOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
};
