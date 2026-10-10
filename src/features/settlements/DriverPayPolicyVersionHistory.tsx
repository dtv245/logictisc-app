import React from "react";
import { Badge, Button, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, HistoryOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import {
  formatPercentDisplay,
  type DriverPayPolicyView,
} from "@/types/driverPayPolicy.dto";

const { Text } = Typography;

export interface DriverPayPolicyVersionHistoryProps {
  policyCode: string;
  versions: DriverPayPolicyView[];
  onSelectVersion?: (version: DriverPayPolicyView) => void;
  onCreateNewVersion?: (latestVersion: DriverPayPolicyView) => void;
  selectedVersionId?: string;
}

export const DriverPayPolicyVersionHistory: React.FC<DriverPayPolicyVersionHistoryProps> = ({
  policyCode,
  versions,
  onSelectVersion,
  onCreateNewVersion,
  selectedVersionId,
}) => {
  const { t } = useTranslation();

  // Sort versions descending by policyVersion (highest version first)
  const sortedVersions = [...versions].sort(
    (a, b) => b.policyVersion - a.policyVersion
  );

  const latestVersion = sortedVersions[0] ?? null;

  const renderRateSummary = (record: DriverPayPolicyView) => {
    switch (record.payMethod) {
      case "PER_MILE":
        return `${record.perMileRate ?? 0} ${record.currency}/mi (${record.mileageBasis || "ALL"})`;
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
      title: t("settlements.version", "Version"),
      dataIndex: "policyVersion",
      key: "policyVersion",
      width: 100,
      render: (version: number, record: DriverPayPolicyView) => {
        const isLatest = latestVersion?.id === record.id;
        return (
          <Space size={4}>
            <Tag color={isLatest ? "blue" : "default"}>v{version}</Tag>
            {isLatest && <Badge status="success" text={t("settlements.latest", "Latest")} />}
          </Space>
        );
      },
    },
    {
      title: t("settlements.policyName", "Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("settlements.payMethod", "Pay Method"),
      dataIndex: "payMethod",
      key: "payMethod",
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      title: t("settlements.rateSummary", "Rate & Basis"),
      key: "rateSummary",
      render: (_, record) => <Text strong>{renderRateSummary(record)}</Text>,
    },
    {
      title: t("settlements.effectiveValidity", "Effective Period"),
      key: "validity",
      render: (_, record) => (
        <span>
          {record.effectiveFrom} ~ {record.effectiveTo || t("settlements.indefinite", "Present")}
        </span>
      ),
    },
    {
      title: t("settlements.status", "Status"),
      key: "status",
      width: 120,
      render: (_, record) => {
        const isLatest = latestVersion?.id === record.id;
        if (!record.active) {
          return <Tag color="error">{t("settlements.inactive", "Inactive")}</Tag>;
        }
        return isLatest ? (
          <Tag color="success">{t("settlements.active", "Active")}</Tag>
        ) : (
          <Tag color="warning">{t("settlements.historicalArchived", "Archived (Read-Only)")}</Tag>
        );
      },
    },
    {
      title: t("settlements.actions", "Actions"),
      key: "actions",
      width: 180,
      render: (_, record) => {
        const isLatest = latestVersion?.id === record.id;
        return (
          <Space size="small">
            {onSelectVersion && (
              <Button
                size="small"
                type={selectedVersionId === record.id ? "primary" : "default"}
                onClick={() => onSelectVersion(record)}
              >
                {t("settlements.viewDetails", "View")}
              </Button>
            )}
            {isLatest ? (
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => onCreateNewVersion?.(record)}
              >
                {t("settlements.newVersionAction", "New Version")}
              </Button>
            ) : (
              <Tooltip title={t("settlements.onlyLatestCanSpawnVersion", "Historical versions cannot spawn new versions. Use the latest version.")}>
                <Button size="small" disabled icon={<HistoryOutlined />}>
                  {t("settlements.readOnly", "Read-Only")}
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table<DriverPayPolicyView>
      aria-label={`Policy version history for ${policyCode}`}
      rowKey="id"
      columns={columns}
      dataSource={sortedVersions}
      pagination={false}
      size="middle"
      rowClassName={(record) => (record.id === selectedVersionId ? "ant-table-row-selected" : "")}
    />
  );
};
