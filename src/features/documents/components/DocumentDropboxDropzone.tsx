import React, { useState, useRef } from "react";
import { Alert, Button, message, Space, Typography } from "antd";
import {
  CloudUploadOutlined,
  FileAddOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { DOCUMENT_UPLOAD_CONTRACT_CONFIRMED } from "../api/documents.api";

const { Text, Title } = Typography;

export interface DocumentDropboxDropzoneProps {
  onFileSelect?: (file: File) => void;
  onOpenUploadModal?: () => void;
}

export const DocumentDropboxDropzone: React.FC<DocumentDropboxDropzoneProps> = ({
  onFileSelect,
  onOpenUploadModal,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvailable = DOCUMENT_UPLOAD_CONTRACT_CONFIRMED && Boolean(onOpenUploadModal);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleProcessedFile(file);
    }
  };

  const handleProcessedFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      message.error(t("documents.upload.draggerHint"));
      return;
    }

    if (DOCUMENT_UPLOAD_CONTRACT_CONFIRMED) {
      onFileSelect?.(file);
      onOpenUploadModal?.();
    } else {
      message.info(t("documents.dropbox.dropzonePendingNote"));
      onFileSelect?.(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessedFile(files[0]);
    }
    // Reset file input để có thể chọn lại cùng 1 file nếu cần
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!uploadAvailable) {
    return (
      <Alert
        type="info"
        showIcon
        message={t("documents.dropbox.dropzoneUnavailableTitle")}
        description={t("documents.dropbox.dropzonePendingNote")}
        style={{ marginBottom: 20 }}
      />
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (uploadAvailable) {
            onOpenUploadModal?.();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={t("documents.dropbox.dropzoneTitle")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          border: isDragOver ? "2px dashed #2563eb" : "2px dashed #cbd5e1",
          borderRadius: 14,
          padding: "24px 20px",
          textAlign: "center",
          background: isDragOver ? "#eff6ff" : "#f8fafc",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          boxShadow: isDragOver ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
          accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.xlsx,.xls,.csv"
        />

        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: isDragOver ? "#dbeafe" : "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              transition: "transform 0.2s ease",
              transform: isDragOver ? "scale(1.1)" : "scale(1)",
            }}
          >
            <CloudUploadOutlined style={{ fontSize: 26 }} />
          </div>

          <div>
            <Title
              level={5}
              style={{
                margin: "0 0 4px",
                color: isDragOver ? "#1d4ed8" : "#1e293b",
                fontWeight: 600,
              }}
            >
              {t("documents.dropbox.dropzoneTitle")}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t("documents.dropbox.dropzoneHint")}
            </Text>
          </div>

          <div>
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              size="middle"
              style={{
                borderRadius: 8,
                background: "#2563eb",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
              }}
              onClick={(e) => {
                e.stopPropagation();
          if (uploadAvailable) {
                  onOpenUploadModal?.();
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              {t("documents.upload.button")}
            </Button>
          </div>
        </Space>
      </div>

      {!DOCUMENT_UPLOAD_CONTRACT_CONFIRMED && (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{
            marginTop: 10,
            borderRadius: 8,
            fontSize: 12,
            background: "#f0f9ff",
            borderColor: "#bae6fd",
          }}
          message={
            <Text style={{ fontSize: 12 }}>
              {t("documents.dropbox.dropzonePendingNote")}
            </Text>
          }
        />
      )}
    </div>
  );
};
