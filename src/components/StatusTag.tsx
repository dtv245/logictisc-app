/**
 * StatusTag
 *
 * Combines an icon and visible label with the status color so meaning never
 * depends on color alone.
 *
 * `StatusTone` là từ vựng chung cho mọi trạng thái trong app; việc ánh xạ
 * `<giá trị trạng thái> → StatusTone` nằm ở `statusTone.ts`, không nằm ở đây —
 * component này chỉ biết 5 tone, không biết `picked_up` là gì.
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

export interface StatusTagProps {
  label: string;
  tone: StatusTone;
}

export function StatusTag({ label, tone }: StatusTagProps) {
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
