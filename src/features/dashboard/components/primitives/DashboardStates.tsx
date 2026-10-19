import React from "react";
import { Button, Skeleton } from "antd";
import {
  AlertCircle,
  Database,
  Inbox,
  RefreshCw,
} from "lucide-react";
import "./primitives.scss";

export interface CardSkeletonProps {
  lines?: number;
  variant?: "default" | "ai";
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  className = "",
}) => {
  return (
    <div className={`ops-card-skeleton ${className}`}>
      <Skeleton.Input active size="small" style={{ width: "40%", height: 20 }} />
      <Skeleton active paragraph={{ rows: lines }} title={false} />
    </div>
  );
};

export interface EmptyStateProps {
  message?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const OpsEmptyState: React.FC<EmptyStateProps> = ({
  message = "Không có dữ liệu",
  description,
  icon,
  className = "",
}) => {
  return (
    <div className={`ops-empty-state ${className}`}>
      <div style={{ marginBottom: 8, color: "#94a3b8" }}>
        {icon || <Inbox size={32} />}
      </div>
      <div className="ops-empty-state__title">{message}</div>
      {description && <div style={{ fontSize: 12 }}>{description}</div>}
    </div>
  );
};

export interface ErrorStateProps {
  message?: React.ReactNode;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const OpsErrorState: React.FC<ErrorStateProps> = ({
  message = "Dữ liệu tạm thời không khả dụng",
  description = "Vui lòng thử lại sau.",
  onRetry,
  className = "",
}) => {
  return (
    <div className={`ops-error-state ${className}`}>
      <div style={{ marginBottom: 8, color: "#ef4444" }}>
        <AlertCircle size={32} />
      </div>
      <div className="ops-error-state__title">{message}</div>
      {description && <div style={{ fontSize: 12, marginBottom: 8 }}>{description}</div>}
      {onRetry && (
        <div className="ops-error-state__action">
          <Button
            icon={<RefreshCw size={14} style={{ marginRight: 4 }} />}
            onClick={onRetry}
            size="small"
          >
            Thử lại
          </Button>
        </div>
      )}
    </div>
  );
};

export interface UnavailableStateProps {
  message?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export const OpsUnavailableState: React.FC<UnavailableStateProps> = ({
  message = "Chưa có dữ liệu nguồn",
  description = "Chức năng này sẽ tự động hiển thị khi có dữ liệu từ hệ thống.",
  className = "",
}) => {
  return (
    <div className={`ops-unavailable-state ${className}`}>
      <div style={{ marginBottom: 8, color: "#94a3b8" }}>
        <Database size={32} />
      </div>
      <div className="ops-unavailable-state__title">{message}</div>
      {description && <div style={{ fontSize: 12 }}>{description}</div>}
    </div>
  );
};
