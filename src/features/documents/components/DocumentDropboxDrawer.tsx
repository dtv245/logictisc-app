import React from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CloudDownloadOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Document } from "@/types/document.types";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateTime } from "@/formatters/dateTime";
import { formatFileSize, getFileVisual } from "./documentUtils";

const { Text, Title, Paragraph } = Typography;

export interface DocumentDropboxDrawerProps {
  open: boolean;
  document: Document | null;
  onClose: () => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export const DocumentDropboxDrawer: React.FC<DocumentDropboxDrawerProps> = ({
  open,
  document: doc,
  onClose,
  onDownload,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();

  if (!doc) return null;

  const visual = getFileVisual(doc.fileName, doc.contentType, doc.type);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={t("documents.dropbox.fileDetailsTitle")}
      extra={
        <Space>
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            onClick={() => onDownload(doc)}
          >
            {t("documents.dropbox.download")}
          </Button>
          <Popconfirm
            title={t("documents.dropbox.deleteConfirm")}
            onConfirm={() => {
              onDelete(doc);
              onClose();
            }}
            okText={t("actions.confirm")}
            cancelText={t("actions.cancel")}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t("documents.dropbox.delete")}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {/* File Card Banner */}
      <div
        style={{
          background: visual.bgColor,
          borderRadius: 14,
          padding: 20,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 12 }}>{visual.icon}</div>
        <Title
          level={4}
          style={{
            margin: "0 0 6px",
            wordBreak: "break-all",
            color: "#0f172a",
          }}
        >
          {doc.fileName}
        </Title>
        <Space size={8} wrap style={{ justifyContent: "center" }}>
          <Tag color="blue" style={{ borderRadius: 4, fontWeight: 500 }}>
            {t(`documents.upload.types.${doc.type}`, { defaultValue: doc.type })}
          </Tag>
          <StatusTag
            label={t(`documents.status.${doc.status}`, { defaultValue: doc.status })}
            tone={statusTone(doc.status)}
          />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {formatFileSize(doc.fileSizeBytes)}
          </Text>
        </Space>
      </div>

      {/* Thông tin kỹ thuật file */}
      <Title level={5} style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        {t("documents.dropbox.fileInfo")}
      </Title>
      <Descriptions size="small" column={1} bordered style={{ marginBottom: 20 }}>
        <Descriptions.Item label={t("columns.documents.fileName")}>
          <Text copyable>{doc.fileName}</Text>
        </Descriptions.Item>
        {doc.originalFileName && (
          <Descriptions.Item label="Tên file gốc">
            {doc.originalFileName}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t("documents.dropbox.fileSize")}>
          {formatFileSize(doc.fileSizeBytes)}{" "}
          {doc.fileSizeBytes ? `(${doc.fileSizeBytes.toLocaleString()} bytes)` : ""}
        </Descriptions.Item>
        <Descriptions.Item label={t("documents.dropbox.fileType")}>
          {doc.contentType || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("documents.dropbox.ownerType")}>
          <Tag>{doc.ownerType}</Tag>
        </Descriptions.Item>
        {doc.blobContainer && (
          <Descriptions.Item label={t("documents.dropbox.blobContainer")}>
            {doc.blobContainer}
          </Descriptions.Item>
        )}
        {doc.blobPath && (
          <Descriptions.Item label={t("documents.dropbox.blobPath")}>
            <Text copyable ellipsis style={{ maxWidth: 240 }}>
              {doc.blobPath}
            </Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t("documents.dropbox.createdAt")}>
          {formatDateTime(doc.capturedAt ?? doc.createdAt, { locale: i18n.language })}
        </Descriptions.Item>
        {doc.uploadedByName && (
          <Descriptions.Item label={t("documents.dropbox.uploadedBy")}>
            <Space size={4}>
              <UserOutlined />
              <span>{doc.uploadedByName}</span>
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Liên kết nghiệp vụ */}
      <Title level={5} style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        {t("documents.dropbox.entityRelations")}
      </Title>
      <Descriptions size="small" column={1} bordered style={{ marginBottom: 20 }}>
        <Descriptions.Item label={t("documents.dropbox.loadRef")}>
          {doc.loadId ? (
            <Space>
              <LinkOutlined style={{ color: "#0284c7" }} />
              <Text copyable>{doc.loadId}</Text>
            </Space>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("documents.dropbox.truckRef")}>
          {doc.truckId ? (
            <Space>
              <LinkOutlined style={{ color: "#7c3aed" }} />
              <Text copyable>{doc.truckId}</Text>
            </Space>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("documents.dropbox.employeeRef")}>
          {doc.employeeId ? (
            <Space>
              <UserOutlined style={{ color: "#16a34a" }} />
              <Text copyable>{doc.employeeId}</Text>
            </Space>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        {doc.dvirReportId && (
          <Descriptions.Item label="Báo cáo DVIR">
            <Text copyable>{doc.dvirReportId}</Text>
          </Descriptions.Item>
        )}
        {doc.accidentReportId && (
          <Descriptions.Item label="Báo cáo sự cố">
            <Text copyable>{doc.accidentReportId}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Địa điểm & Vị trí ghi nhận */}
      {(doc.recipientName || doc.captureLatitude || doc.captureLongitude) && (
        <>
          <Title level={5} style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
            {t("documents.dropbox.capturedLocation")}
          </Title>
          <Descriptions size="small" column={1} bordered style={{ marginBottom: 20 }}>
            {doc.recipientName && (
              <Descriptions.Item label="Người nhận ký">
                <Text strong>{doc.recipientName}</Text>
              </Descriptions.Item>
            )}
            {(doc.captureLatitude || doc.captureLongitude) && (
              <Descriptions.Item label="Tọa độ GPS">
                <Space>
                  <EnvironmentOutlined style={{ color: "#ef4444" }} />
                  <span>
                    {doc.captureLatitude}, {doc.captureLongitude}
                  </span>
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}

      {/* Mô tả & ghi chú */}
      {(doc.description || doc.notes) && (
        <>
          <Title level={5} style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            {t("documents.upload.description")}
          </Title>
          {doc.description && (
            <Paragraph
              style={{
                background: "#f8fafc",
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              {doc.description}
            </Paragraph>
          )}
          {doc.notes && (
            <Paragraph
              style={{
                background: "#fffbeb",
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                color: "#92400e",
              }}
            >
              <Text strong>Ghi chú:</Text> {doc.notes}
            </Paragraph>
          )}
        </>
      )}
    </Drawer>
  );
};
