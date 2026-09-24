/**
 * Nhãn trạng thái của một chỉ số.
 *
 * Màu trạng thái KHÔNG bao giờ đứng một mình: luôn kèm icon và nhãn chữ, để
 * người đọc mù màu hoặc in đen trắng vẫn hiểu đúng. Đây là yêu cầu bắt buộc
 * của bảng màu trạng thái, không phải lựa chọn thẩm mỹ.
 */

import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  MinusCircleFilled,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import type { StatusLevel } from "@/types/executive.types";

interface StatusPillProps {
  status: StatusLevel;
  /** Ghi đè nhãn mặc định, ví dụ để nói rõ "Dưới mục tiêu 4%". */
  label?: string;
}

const ICONS: Record<StatusLevel, React.ReactNode> = {
  good: <CheckCircleFilled />,
  warning: <ExclamationCircleFilled />,
  critical: <CloseCircleFilled />,
  neutral: <MinusCircleFilled />,
};

export const StatusPill = ({ status, label }: StatusPillProps) => {
  const { t } = useTranslation();

  return (
    <span className={`exec-status exec-status--${status}`}>
      <span aria-hidden="true" className="exec-status__icon">
        {ICONS[status]}
      </span>
      <span>{label ?? t(`executive.status.${status}`)}</span>
    </span>
  );
};
