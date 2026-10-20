import React from "react";
import {
  Button,
  Card,
  Dropdown,
  Modal,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  MoreOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { Document } from "@/types/document.types";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateTime } from "@/formatters/dateTime";
import { formatFileSize, getFileVisual } from "./documentUtils";

const { Text } = Typography;

export interface DocumentDropboxCardProps {
  document: Document;
  deleting?: boolean;
  downloading?: boolean;
  onPreview: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export const DocumentDropboxCard: React.FC<DocumentDropboxCardProps> = ({
  document: doc,
  deleting = false,
  downloading = false,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const visual = getFileVisual(doc.fileName, doc.contentType, doc.type);

  const menuItems: MenuProps["items"] = [
    {
      key: "preview",
      icon: <EyeOutlined />,
      label: t("documents.dropbox.viewDetails"),
      onClick: () => onPreview(doc),
    },
    {
      key: "download",
      icon: <DownloadOutlined />,
      label: t("documents.dropbox.download"),
      disabled: downloading,
      onClick: () => onDownload(doc),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      danger: true,
      disabled: deleting,
      label: t("documents.dropbox.delete"),
      onClick: () => {
        Modal.confirm({
          title: t("documents.dropbox.deleteConfirm"),
          okText: t("actions.confirm"),
          cancelText: t("actions.cancel"),
          okButtonProps: { danger: true, loading: deleting, disabled: deleting },
          onOk: () => onDelete(doc),
        });
      },
    },
  ];

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        borderColor: "#e2e8f0",
        background: "#ffffff",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{
        body: {
          padding: 16,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        },
      }}
    >
      {/* Top Header: Badge định dạng & Dropdown hành động */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: visual.color,
            background: visual.bgColor,
            padding: "2px 8px",
            borderRadius: 6,
            letterSpacing: "0.5px",
          }}
        >
          {visual.badgeLabel}
        </span>

        <div>
          <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
            <button
              type="button"
              aria-label={t("documents.dropbox.moreActions")}
              onClick={(event) => event.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                border: 0,
                borderRadius: "50%",
                color: "#64748b",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <MoreOutlined aria-hidden="true" style={{ fontSize: 16 }} />
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Biểu tượng file trung tâm */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 80,
          background: visual.bgColor,
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        {visual.icon}
      </div>

      {/* Thông tin tên file */}
      <Tooltip title={doc.fileName} placement="topLeft">
        <Button
          type="link"
          onClick={() => onPreview(doc)}
          style={{
            padding: 0,
            textAlign: "left",
            whiteSpace: "normal",
            height: "auto",
            fontSize: 14,
            lineHeight: "20px",
            fontWeight: 600,
            overflowWrap: "anywhere",
            marginBottom: 6,
          }}
        >
          {doc.fileName}
        </Button>
      </Tooltip>

      {/* Phân loại và trạng thái */}
      <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
        <Tag
          color="blue"
          style={{
            margin: 0,
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 500,
            border: "none",
          }}
        >
          {t(`documents.upload.types.${doc.type}`, { defaultValue: doc.type })}
        </Tag>
        <StatusTag
          label={t(`documents.status.${doc.status}`, { defaultValue: doc.status })}
          tone={statusTone(doc.status)}
        />
      </div>

      {/* Liên kết nghiệp vụ nếu có (Load, Truck, Employee) */}
      {(doc.loadId || doc.truckId || doc.employeeId) && (
        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {doc.loadId && (
            <Tag icon={<LinkOutlined />} color="cyan" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
              Load: {doc.loadId.slice(0, 8)}
            </Tag>
          )}
          {doc.truckId && (
            <Tag color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
              Truck: {doc.truckId.slice(0, 8)}
            </Tag>
          )}
        </div>
      )}

      {/* Chân thẻ: Dung lượng và Thời gian */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
          {formatFileSize(doc.fileSizeBytes)}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {formatDateTime(doc.capturedAt ?? doc.createdAt, { locale: i18n.language })}
        </Text>
      </div>
    </Card>
  );
};
