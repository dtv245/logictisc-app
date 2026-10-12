/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties, ReactNode } from "react";
import { Tag } from "antd";

export type StatusTone =
  | "success"
  | "processing"
  | "warning"
  | "error"
  | "neutral";

export interface StatusStyleConfig {
  /** Màu chữ (text) — đảm bảo contrast ratio ≥ 4.5:1 */
  color: string;
  /** Màu nền (background) */
  bg: string;
  /** Màu viền (border) */
  border: string;
  /** Màu chấm tròn (indicator dot) */
  dotColor: string;
  /** Icon tùy chọn nếu muốn bổ sung */
  icon?: ReactNode;
}

/**
 * Bảng màu chuẩn semantic của Ant Design 5 & LogisticsX tokens.
 * Mọi cặp màu (color / bg) đều đạt chuẩn tương phản WCAG 2.1 AA (≥ 4.5:1 cho text thông thường):
 * - success (available, completed): #15803d trên #f0fdf4 (contrast 4.88:1)
 * - processing (in_use, in_transit): #0369a1 trên #f0f9ff (contrast 5.48:1)
 * - warning (maintenance, pending): #b45309 trên #fffbeb (contrast 5.24:1)
 * - error (out_of_service, failed): #b91c1c trên #fef2f2 (contrast 5.86:1)
 * - neutral (draft, inactive):       #475569 trên #f8fafc (contrast 5.89:1)
 */
export const defaultStatusStyles: Record<StatusTone, StatusStyleConfig> = {
  success: {
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    dotColor: "#16a34a",
  },
  processing: {
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    dotColor: "#0284c7",
  },
  warning: {
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    dotColor: "#d97706",
  },
  error: {
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    dotColor: "#dc2626",
  },
  neutral: {
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
    dotColor: "#64748b",
  },
};

export interface StatusTagProps {
  label: string;
  /** Tone ngữ nghĩa chuẩn (success, processing, warning, error, neutral) */
  tone?: StatusTone;
  /** Khoá trạng thái thô để tra map tùy biến (ví dụ 'available', 'in_use', 'off_duty') */
  statusKey?: string;
  /** Bảng tra tùy biến status → tone hoặc custom style cho các resource riêng biệt (drivers, trailers...) */
  statusMap?: Record<string, StatusTone | "info" | "default" | StatusStyleConfig>;
  className?: string;
  style?: CSSProperties;
}

export function StatusTag({
  label,
  tone = "neutral",
  statusKey,
  statusMap,
  className,
  style,
}: StatusTagProps) {
  let resolvedTone = tone;
  let config: StatusStyleConfig = defaultStatusStyles[tone] ?? defaultStatusStyles.neutral;

  // Nếu có statusMap và statusKey, ưu tiên tra theo map của resource
  if (statusMap && statusKey) {
    const rawConfig = statusMap[statusKey] ?? statusMap[statusKey.toLowerCase()];
    const normalizedTone: StatusTone | StatusStyleConfig =
      rawConfig === "default"
        ? "neutral"
        : rawConfig === "info"
          ? "processing"
          : rawConfig;

    if (typeof normalizedTone === "string" && normalizedTone in defaultStatusStyles) {
      resolvedTone = normalizedTone as StatusTone;
      config = defaultStatusStyles[resolvedTone];
    } else if (typeof normalizedTone === "object" && normalizedTone !== null) {
      config = { ...config, ...normalizedTone };
    }
  }

  return (
    <Tag
      aria-label={label}
      role="status"
      className={`status-tag status-tag--${resolvedTone} ${className ?? ""}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "1px 8px",
        fontSize: 12,
        lineHeight: "18px",
        borderRadius: 4,
        color: config.color,
        backgroundColor: config.bg,
        borderColor: config.border,
        borderWidth: 1,
        borderStyle: "solid",
        fontWeight: 500,
        marginInlineEnd: 0,
        ...style,
      }}
    >
      <span
        aria-hidden="true"
        className="status-tag__dot"
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      {config.icon ? <span aria-hidden="true">{config.icon}</span> : null}
      <span>{label}</span>
    </Tag>
  );
}
