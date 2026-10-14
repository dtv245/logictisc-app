import React from "react";
import { Card, Col, Progress, Row, Skeleton, Space, Typography } from "antd";
import {
  CloudServerOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { formatFileSize } from "../utils/documentUtils";

const { Text, Title } = Typography;

export interface DocumentStatsBarProps {
  totalDocuments: number;
  totalSizeBytes: number;
  transportCount: number;
  fleetCount: number;
  activeCount: number;
  loading?: boolean;
}

export const DocumentStatsBar: React.FC<DocumentStatsBarProps> = ({
  totalDocuments,
  totalSizeBytes,
  transportCount,
  fleetCount,
  activeCount,
  loading = false,
}) => {
  const { t } = useTranslation();

  // Giả lập hạn mức lưu trữ 100MB cho cloud container
  const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024;
  const storagePercent = Math.min(
    100,
    Math.round((totalSizeBytes / STORAGE_LIMIT_BYTES) * 100),
  );

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
      {/* Thẻ 1: Tổng số tệp tin */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            height: "100%",
          }}
          styles={{ body: { padding: 18 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t("documents.dropbox.totalFiles")}
                </Text>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  <FolderOpenOutlined style={{ fontSize: 16 }} />
                </div>
              </Space>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                {totalDocuments}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {activeCount} {t("documents.status.active").toLowerCase()}
              </Text>
            </Space>
          )}
        </Card>
      </Col>

      {/* Thẻ 2: Dung lượng lưu trữ */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            height: "100%",
          }}
          styles={{ body: { padding: 18 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t("documents.dropbox.storageUsed")}
                </Text>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16a34a",
                  }}
                >
                  <CloudServerOutlined style={{ fontSize: 16 }} />
                </div>
              </Space>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                {formatFileSize(totalSizeBytes)}
              </Title>
              <Progress
                percent={storagePercent}
                size="small"
                status="active"
                strokeColor="#16a34a"
                showInfo={false}
                style={{ margin: "2px 0 0" }}
              />
            </Space>
          )}
        </Card>
      </Col>

      {/* Thẻ 3: Chứng từ vận tải */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            height: "100%",
          }}
          styles={{ body: { padding: 18 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t("documents.dropbox.transportDocs")}
                </Text>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fdf4ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9333ea",
                  }}
                >
                  <FileDoneOutlined style={{ fontSize: 16 }} />
                </div>
              </Space>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                {transportCount}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                BOL & POD
              </Text>
            </Space>
          )}
        </Card>
      </Col>

      {/* Thẻ 4: Hồ sơ xe & Tài xế */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          variant="borderless"
          style={{
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)",
            height: "100%",
          }}
          styles={{ body: { padding: 18 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  {t("documents.dropbox.fleetDocs")}
                </Text>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#fff7ed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ea580c",
                  }}
                >
                  <SafetyCertificateOutlined style={{ fontSize: 16 }} />
                </div>
              </Space>
              <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                {fleetCount}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                License, Inspection & DVIR
              </Text>
            </Space>
          )}
        </Card>
      </Col>
    </Row>
  );
};
