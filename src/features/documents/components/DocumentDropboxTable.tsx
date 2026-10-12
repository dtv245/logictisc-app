import React from "react";
import {
  Button,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Document } from "@/types/document.types";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateTime } from "@/formatters/dateTime";
import { formatFileSize, getFileVisual } from "../utils/documentUtils";

const { Text } = Typography;

export interface DocumentDropboxTableProps {
  documents: Document[];
  loading?: boolean;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export const DocumentDropboxTable: React.FC<DocumentDropboxTableProps> = ({
  documents,
  loading = false,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();

  const columns: ColumnsType<Document> = [
    {
      title: t("columns.documents.fileName"),
      dataIndex: "fileName",
      key: "fileName",
      render: (fileName: string, record: Document) => {
        const visual = getFileVisual(fileName, record.contentType, record.type);
        return (
          <Space size={12} align="center">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: visual.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {React.cloneElement(visual.icon as React.ReactElement, {
                style: { fontSize: 20, color: visual.color },
              })}
            </div>
            <div>
              <Text
                strong
                style={{
                  display: "block",
                  color: "#0f172a",
                  cursor: "pointer",
                }}
                onClick={() => onPreview(record)}
              >
                {fileName}
              </Text>
              {record.originalFileName && record.originalFileName !== fileName && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {record.originalFileName}
                </Text>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: t("columns.documents.type"),
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color="blue" style={{ borderRadius: 4, fontWeight: 500, margin: 0 }}>
          {t(`documents.upload.types.${type}`, { defaultValue: type })}
        </Tag>
      ),
    },
    {
      title: t("documents.dropbox.fileSize"),
      dataIndex: "fileSizeBytes",
      key: "fileSizeBytes",
      render: (size: number | null) => (
        <Text style={{ fontSize: 13, color: "#475569" }}>
          {formatFileSize(size)}
        </Text>
      ),
    },
    {
      title: t("documents.dropbox.entityRelations"),
      key: "relations",
      render: (_: unknown, record: Document) => (
        <Space size={4} wrap>
          {record.loadId && (
            <Tooltip title={`Chuyến hàng: ${record.loadId}`}>
              <Tag icon={<LinkOutlined />} color="cyan" style={{ borderRadius: 4, margin: 0 }}>
                Load: {record.loadId.slice(0, 8)}
              </Tag>
            </Tooltip>
          )}
          {record.truckId && (
            <Tooltip title={`Xe: ${record.truckId}`}>
              <Tag color="purple" style={{ borderRadius: 4, margin: 0 }}>
                Truck: {record.truckId.slice(0, 8)}
              </Tag>
            </Tooltip>
          )}
          {record.employeeId && (
            <Tooltip title={`Nhân viên: ${record.employeeId}`}>
              <Tag color="geekblue" style={{ borderRadius: 4, margin: 0 }}>
                NV: {record.employeeId.slice(0, 8)}
              </Tag>
            </Tooltip>
          )}
          {!record.loadId && !record.truckId && !record.employeeId && (
            <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          )}
        </Space>
      ),
    },
    {
      title: t("documents.dropbox.createdAt"),
      key: "date",
      render: (_: unknown, record: Document) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDateTime(record.capturedAt ?? record.createdAt, { locale: i18n.language })}
        </Text>
      ),
    },
    {
      title: t("columns.documents.status"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <StatusTag
          label={t(`documents.status.${status}`, { defaultValue: status })}
          tone={statusTone(status)}
        />
      ),
    },
    {
      title: t("actions.title", { defaultValue: "Thao tác" }),
      key: "actions",
      align: "right",
      render: (_: unknown, record: Document) => (
        <Space size={4}>
          <Tooltip title={t("documents.dropbox.viewDetails")}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onPreview(record)}
              aria-label={t("documents.dropbox.viewDetails")}
            />
          </Tooltip>
          <Tooltip title={t("documents.dropbox.download")}>
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(record)}
              aria-label={t("documents.dropbox.download")}
            />
          </Tooltip>
          <Tooltip title={t("documents.dropbox.delete")}>
            <Popconfirm
              title={t("documents.dropbox.deleteConfirm")}
              onConfirm={() => onDelete(record)}
              okText={t("actions.confirm")}
              cancelText={t("actions.cancel")}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                aria-label={t("documents.dropbox.delete")}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table<Document>
      columns={columns}
      dataSource={documents}
      rowKey="id"
      loading={loading}
      pagination={false}
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    />
  );
};
