/**
 * Khung chung cho một khu vực của dashboard.
 *
 * Mỗi khu vực bắt buộc trả lời được "câu hỏi kinh doanh" mà nó phục vụ. Câu
 * hỏi đó nằm ngay dưới tiêu đề chứ không giấu trong tooltip — nếu người đọc
 * phải tự đoán biểu đồ này để làm gì thì biểu đồ đó đang chiếm chỗ vô ích.
 */

import { Card, Typography } from "antd";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  /** Câu hỏi kinh doanh mà khu vực này trả lời. */
  question: string;
  /** Locale key hoặc chuỗi mô tả nguồn dữ liệu của cả khu vực. */
  sourceNote?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SectionCard = ({
  title,
  question,
  sourceNote,
  extra,
  children,
  className,
}: SectionCardProps) => (
  <Card
    className={`exec-card${className ? ` ${className}` : ""}`}
    extra={extra}
    title={
      <div className="exec-card__heading">
        <span className="exec-card__title">{title}</span>
        <span className="exec-card__question">{question}</span>
      </div>
    }
  >
    {sourceNote ? (
      <Typography.Text className="exec-card__source" type="secondary">
        {sourceNote}
      </Typography.Text>
    ) : null}
    {children}
  </Card>
);
