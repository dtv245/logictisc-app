/**
 * PageHeader
 *
 * Tiêu đề + mô tả + hành động cho một trang, dùng chung cho cả trang Refine lẫn
 * trang tự viết (dashboard, diagnostics).
 *
 * `id` là prop chứ không phải state nội bộ: trang cha cần biết id để đặt
 * `aria-labelledby` lên `<main>`, và đó là thứ khiến tiêu đề trở thành tên của
 * vùng nội dung với trình đọc màn hình. Tự sinh id bên trong thì cha không có
 * cách nào trỏ tới. Khi cha không cần (không có `<main aria-labelledby>`),
 * component tự sinh một id bằng `useId()` để tiêu đề vẫn có id ổn định.
 *
 * Cấp tiêu đề cố định `level={2}`: `<h1>` thuộc về tên ứng dụng trong layout,
 * nên mỗi trang bắt đầu ở `<h2>` để không có hai `<h1>` trên một trang.
 */
import { Flex, Typography } from "antd";
import { useId, type ReactNode } from "react";

export interface PageHeaderProps {
  description?: ReactNode;
  /** Hành động bên phải tiêu đề, ví dụ nút "Tạo mới". */
  extra?: ReactNode;
  /** Đặt trùng với `aria-labelledby` của `<main>` bao ngoài. */
  id?: string;
  title: ReactNode;
}

export function PageHeader({ description, extra, id, title }: PageHeaderProps) {
  const generatedId = useId();
  const titleId = id ?? generatedId;

  return (
    <Flex align="start" gap="middle" justify="space-between" wrap>
      <div>
        <Typography.Title id={titleId} level={2}>
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Paragraph type="secondary">
            {description}
          </Typography.Paragraph>
        ) : null}
      </div>
      {extra}
    </Flex>
  );
}
