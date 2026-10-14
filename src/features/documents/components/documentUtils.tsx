import React from "react";
import {
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileTextOutlined,
  EditOutlined,
  FolderOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  TransactionOutlined,
  PictureOutlined,
} from "@ant-design/icons";

/**
 * Format kích thước tệp tin theo chuẩn B / KB / MB / GB.
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return "—";
  }
  if (bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Lấy đuôi tệp tin in hoa (PDF, PNG, JPG, v.v.).
 */
export function getFileExtension(fileName?: string | null): string {
  if (!fileName) return "FILE";
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fileName.length - 1) return "FILE";
  return fileName.slice(lastDot + 1).toUpperCase();
}

export interface FileVisualInfo {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badgeLabel: string;
}

/**
 * Trả về thông tin hiển thị trực quan (icon, màu sắc, nhãn) dựa theo tên tệp và loại tài liệu.
 */
export function getFileVisual(
  fileName?: string | null,
  contentType?: string | null,
  type?: string | null,
): FileVisualInfo {
  const ext = getFileExtension(fileName).toLowerCase();
  const mime = (contentType ?? "").toLowerCase();
  const docType = (type ?? "").toLowerCase();

  if (ext === "pdf" || mime.includes("pdf")) {
    return {
      icon: <FilePdfOutlined style={{ fontSize: 32, color: "#e11d48" }} />,
      color: "#e11d48",
      bgColor: "#fff1f2",
      badgeLabel: "PDF",
    };
  }

  if (
    ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ||
    mime.startsWith("image/") ||
    docType === "photo"
  ) {
    return {
      icon: <FileImageOutlined style={{ fontSize: 32, color: "#0284c7" }} />,
      color: "#0284c7",
      bgColor: "#f0f9ff",
      badgeLabel: ext.toUpperCase() === "FILE" ? "IMG" : ext.toUpperCase(),
    };
  }

  if (
    ["xls", "xlsx", "csv"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime.includes("csv")
  ) {
    return {
      icon: <FileExcelOutlined style={{ fontSize: 32, color: "#16a34a" }} />,
      color: "#16a34a",
      bgColor: "#f0fdf4",
      badgeLabel: ext.toUpperCase(),
    };
  }

  if (["doc", "docx"].includes(ext) || mime.includes("word") || mime.includes("officedocument")) {
    return {
      icon: <FileWordOutlined style={{ fontSize: 32, color: "#2563eb" }} />,
      color: "#2563eb",
      bgColor: "#eff6ff",
      badgeLabel: "DOC",
    };
  }

  if (docType === "signature") {
    return {
      icon: <EditOutlined style={{ fontSize: 32, color: "#7c3aed" }} />,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
      badgeLabel: "SIGN",
    };
  }

  return {
    icon: <FileTextOutlined style={{ fontSize: 32, color: "#475569" }} />,
    color: "#475569",
    bgColor: "#f8fafc",
    badgeLabel: ext,
  };
}

export interface DocumentCategoryOption {
  key: string;
  value: string;
  labelKey: string;
  icon: React.ReactNode;
}

export const DOCUMENT_CATEGORY_OPTIONS: DocumentCategoryOption[] = [
  {
    key: "all",
    value: "all",
    labelKey: "documents.dropbox.allCategories",
    icon: <FolderOutlined />,
  },
  {
    key: "bill_of_lading",
    value: "bill_of_lading",
    labelKey: "documents.upload.types.bill_of_lading",
    icon: <FileDoneOutlined />,
  },
  {
    key: "proof_of_delivery",
    value: "proof_of_delivery",
    labelKey: "documents.upload.types.proof_of_delivery",
    icon: <FileDoneOutlined />,
  },
  {
    key: "driver_license",
    value: "driver_license",
    labelKey: "documents.upload.types.driver_license",
    icon: <SafetyCertificateOutlined />,
  },
  {
    key: "inspection",
    value: "inspection",
    labelKey: "documents.upload.types.inspection",
    icon: <CarOutlined />,
  },
  {
    key: "receipt",
    value: "receipt",
    labelKey: "documents.upload.types.receipt",
    icon: <TransactionOutlined />,
  },
  {
    key: "photo",
    value: "photo",
    labelKey: "documents.upload.types.photo",
    icon: <PictureOutlined />,
  },
  {
    key: "signature",
    value: "signature",
    labelKey: "documents.upload.types.signature",
    icon: <EditOutlined />,
  },
  {
    key: "other",
    value: "other",
    labelKey: "documents.upload.types.other",
    icon: <FileTextOutlined />,
  },
];
