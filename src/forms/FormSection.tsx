import { Card, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";

export interface FormSectionProps {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * FormSection — Khung phân nhóm trường nhập liệu dạng Card.
 * Giúp chia form dài thành các khối nhận thức nhỏ (5–7 ô), có tiêu đề rõ ràng,
 * hỗ trợ id neo mục lục (Anchor).
 */
export const FormSection = ({
  id,
  title,
  description,
  extra,
  children,
  style,
  className,
}: FormSectionProps) => {
  return (
    <div id={id} style={{ scrollMarginTop: 80 }}>
      <Card
        className={`form-section-card ${className ?? ""}`}
        extra={extra}
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          border: "1px solid #f0f0f0",
          ...style,
        }}
        title={
          <div>
            <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              {title}
            </Typography.Title>
            {description && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: 13, fontWeight: "normal", display: "block", marginTop: 4 }}
              >
                {description}
              </Typography.Text>
            )}
          </div>
        }
      >
        {children}
      </Card>
    </div>
  );
};
