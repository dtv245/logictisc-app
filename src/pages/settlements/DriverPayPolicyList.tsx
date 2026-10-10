import React, { useMemo, useState } from "react";
import { CanAccess } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FilterBar } from "@components";

import {
  useDriverPayPolicies,
  useDriverPayPolicyMutations,
} from "@/features/settlements/driverPayPolicy.query";
import { DriverPayPolicyForm } from "@/features/settlements/DriverPayPolicyForm";
import { DriverPayPolicyVersionHistory } from "@/features/settlements/DriverPayPolicyVersionHistory";
import {
  formatPercentDisplay,
  PAY_METHODS,
  type DriverPayPolicyRequest,
  type DriverPayPolicyView,
} from "@/types/driverPayPolicy.dto";

const { Title, Text } = Typography;

export const DriverPayPolicyList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { policies, isLoading, refetch } = useDriverPayPolicies();
  const { createPolicy, createNewVersion, isSubmitting } =
    useDriverPayPolicyMutations();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [versionTargetPolicy, setVersionTargetPolicy] =
    useState<DriverPayPolicyView | null>(null);
  const [historyTargetCode, setHistoryTargetCode] = useState<string | null>(
    null
  );

  // Group policies by policyCode to identify the latest version for each code
  const { groupedPolicies, latestPolicies } = useMemo(() => {
    const groups = new Map<string, DriverPayPolicyView[]>();

    for (const policy of policies) {
      const list = groups.get(policy.policyCode) || [];
      list.push(policy);
      groups.set(policy.policyCode, list);
    }

    // Sort each group descending by version
    const latestList: DriverPayPolicyView[] = [];
    for (const [, list] of groups.entries()) {
      list.sort((a, b) => b.policyVersion - a.policyVersion);
      if (list.length > 0) {
        latestList.push(list[0]);
      }
    }

    return { groupedPolicies: groups, latestPolicies: latestList };
  }, [policies]);

  // Filtered rows (showing latest versions on top-level table)
  const filteredData = useMemo(() => {
    return latestPolicies.filter((policy) => {
      const matchSearch =
        !searchTerm ||
        policy.policyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod =
        methodFilter === "ALL" || policy.payMethod === methodFilter;

      const matchScope =
        scopeFilter === "ALL" ||
        (scopeFilter === "DEFAULT" && policy.driverId === null) ||
        (scopeFilter === "SPECIFIC" && policy.driverId !== null);

      return matchSearch && matchMethod && matchScope;
    });
  }, [latestPolicies, searchTerm, methodFilter, scopeFilter]);

  const handleCreateSubmit = async (request: DriverPayPolicyRequest) => {
    const created = await createPolicy(request);
    if (created) {
      setIsCreateModalOpen(false);
      refetch();
    }
  };

  const handleNewVersionSubmit = async (request: DriverPayPolicyRequest) => {
    if (!versionTargetPolicy) return;
    const created = await createNewVersion(versionTargetPolicy.id, request);
    if (created) {
      setVersionTargetPolicy(null);
      refetch();
    }
  };

  const renderRateSummary = (record: DriverPayPolicyView) => {
    switch (record.payMethod) {
      case "PER_MILE":
        return `${record.perMileRate ?? 0} ${record.currency}/mi`;
      case "PER_LOAD":
        return `${record.perLoadRate ?? 0} ${record.currency}/load`;
      case "PERCENT_REVENUE":
        return `${formatPercentDisplay(record.revenuePercentage)} of ${record.revenueBasis || "INVOICE"}`;
      case "HOURLY":
        return `${record.hourlyRate ?? 0} ${record.currency}/hr`;
      case "DAILY":
        return `${record.dailyRate ?? 0} ${record.currency}/day`;
      case "FLAT_RATE":
        return `${record.flatRate ?? 0} ${record.currency} flat`;
      default:
        return "-";
    }
  };

  const columns: ColumnsType<DriverPayPolicyView> = [
    {
      title: t("settlements.policyCode", "Policy Code"),
      dataIndex: "policyCode",
      key: "policyCode",
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: t("settlements.policyName", "Policy Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("settlements.scope", "Driver Scope"),
      key: "scope",
      render: (_, record) =>
        record.driverId ? (
          <Tag color="purple">{t("settlements.specificDriver", "Specific Driver")}</Tag>
        ) : (
          <Tag color="cyan">{t("settlements.defaultAllDrivers", "Default (All Drivers)")}</Tag>
        ),
    },
    {
      title: t("settlements.payMethod", "Pay Method"),
      dataIndex: "payMethod",
      key: "payMethod",
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: t("settlements.rate", "Current Rate"),
      key: "rate",
      render: (_, record) => <Text>{renderRateSummary(record)}</Text>,
    },
    {
      title: t("settlements.latestVersion", "Latest Version"),
      dataIndex: "policyVersion",
      key: "policyVersion",
      width: 130,
      render: (version: number, record) => {
        const totalVersions = groupedPolicies.get(record.policyCode)?.length ?? 1;
        return (
          <Space size={4}>
            <Tag color="geekblue">v{version}</Tag>
            {totalVersions > 1 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({totalVersions} {t("settlements.versionsCount", "versions")})
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: t("settlements.effectiveFrom", "Effective From"),
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
    },
    {
      title: t("settlements.actions", "Actions"),
      key: "actions",
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/settlements/policies/${record.id}`)}
          >
            {t("settlements.viewDetails", "View")}
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryTargetCode(record.policyCode)}
          >
            {t("settlements.historyAction", "History")}
          </Button>
          <CanAccess resource="driver-pay-policies" action="POLICY_NEW_VERSION">
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlusOutlined />}
            onClick={() => setVersionTargetPolicy(record)}
          >
            {t("settlements.newVersionAction", "New Version")}
          </Button>
          </CanAccess>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {t("settlements.driverPayPoliciesTitle", "Driver Pay Policies")}
            </Title>
            <Text type="secondary">
              {t(
                "settlements.policiesSubtitle",
                "Manage driver compensation rules with immutable version history and audit compliance."
              )}
            </Text>
          </Col>
          <Col>
            <CanAccess resource="driver-pay-policies" action="POLICY_CREATE">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t("settlements.createPolicyBtn", "Create Pay Policy")}
            </Button>
            </CanAccess>
          </Col>
        </Row>

        {/* Filters */}
        <FilterBar
          hasActiveFilter={Boolean(searchTerm || methodFilter !== "ALL" || scopeFilter !== "ALL")}
          onReset={() => {
            setSearchTerm("");
            setMethodFilter("ALL");
            setScopeFilter("ALL");
          }}
        >
          <Input
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("settlements.searchPolicies", "Search by code or name")}
            prefix={<SearchOutlined />}
            style={{ width: "100%" }}
            value={searchTerm}
          />
          <Select
            onChange={setMethodFilter}
            options={[
              { value: "ALL", label: t("settlements.allMethods", "All Pay Methods") },
              ...PAY_METHODS.map((m) => ({ value: m, label: m })),
            ]}
            style={{ width: "100%" }}
            value={methodFilter}
          />
          <Select
            onChange={setScopeFilter}
            options={[
              { value: "ALL", label: t("settlements.allScopes", "All Scopes") },
              { value: "DEFAULT", label: t("settlements.defaultOnly", "Default Only (All Drivers)") },
              { value: "SPECIFIC", label: t("settlements.specificOnly", "Specific Driver Only") },
            ]}
            style={{ width: "100%" }}
            value={scopeFilter}
          />
        </FilterBar>

        <Table<DriverPayPolicyView>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          pagination={{ pageSize: 15 }}
          size="middle"
        />
      </Card>

      {/* Modal: Create Policy */}
      <Modal
        title={t("settlements.createPolicyTitle", "Create Driver Pay Policy")}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <DriverPayPolicyForm
          mode="create"
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal: Create New Version */}
      <Modal
        title={t("settlements.newVersionTitle", "Create New Policy Version")}
        open={Boolean(versionTargetPolicy)}
        onCancel={() => setVersionTargetPolicy(null)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {versionTargetPolicy && (
          <DriverPayPolicyForm
            mode="new-version"
            previousPolicy={versionTargetPolicy}
            onSubmit={handleNewVersionSubmit}
            onCancel={() => setVersionTargetPolicy(null)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>

      {/* Modal: Version History */}
      <Modal
        title={
          <span>
            {t("settlements.versionHistoryTitle", "Version History")}:{" "}
            <Text code>{historyTargetCode}</Text>
          </span>
        }
        open={Boolean(historyTargetCode)}
        onCancel={() => setHistoryTargetCode(null)}
        footer={[
          <Button key="close" onClick={() => setHistoryTargetCode(null)}>
            {t("settlements.closeBtn", "Close")}
          </Button>,
        ]}
        width={950}
        destroyOnClose
      >
        {historyTargetCode && (
          <DriverPayPolicyVersionHistory
            policyCode={historyTargetCode}
            versions={groupedPolicies.get(historyTargetCode) || []}
            onCreateNewVersion={(latest) => {
              setHistoryTargetCode(null);
              setVersionTargetPolicy(latest);
            }}
            onSelectVersion={(version) => {
              setHistoryTargetCode(null);
              navigate(`/settlements/policies/${version.id}`);
            }}
          />
        )}
      </Modal>
    </div>
  );
};
