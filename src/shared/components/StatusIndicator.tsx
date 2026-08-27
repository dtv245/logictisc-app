/**
 * StatusIndicator
 *
 * Combines an icon and visible label with the status color so meaning never
 * depends on color alone.
 */
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import type { ReactNode } from "react";

export type StatusTone =
  | "success"
  | "processing"
  | "warning"
  | "error"
  | "neutral";

const statusPresentation: Record<
  StatusTone,
  { color: string; icon: ReactNode }
> = {
  success: {
    color: "success",
    icon: <CheckCircleOutlined aria-hidden="true" />,
  },
  processing: {
    color: "processing",
    icon: <InfoCircleOutlined aria-hidden="true" />,
  },
  warning: {
    color: "warning",
    icon: <ExclamationCircleOutlined aria-hidden="true" />,
  },
  error: {
    color: "error",
    icon: <CloseCircleOutlined aria-hidden="true" />,
  },
  neutral: {
    color: "default",
    icon: <MinusCircleOutlined aria-hidden="true" />,
  },
};

export interface StatusIndicatorProps {
  label: string;
  tone: StatusTone;
}

export function StatusIndicator({ label, tone }: StatusIndicatorProps) {
  const presentation = statusPresentation[tone];

  return (
    <Tag
      aria-label={label}
      color={presentation.color}
      icon={presentation.icon}
      role="status"
    >
      {label}
    </Tag>
  );
}
