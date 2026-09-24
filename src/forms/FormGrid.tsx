/**
 * `FormGrid` — lưới bố cục field cho form.
 *
 * Vấn đề: `ResourceFormFields` xưa nay render một danh sách `Form.Item` phẳng. Trong
 * modal (~520px) bố cục đó đọc tốt, nhưng trên **trang** route thì mọi ô nhập kéo dài
 * hết chiều ngang màn hình — mắt phải quét cả mét để đi từ nhãn sang giá trị, và form
 * trông lệch hẳn so với modal cùng nội dung.
 *
 * `columns` là **thuộc tính của nơi đặt form**, không phải của field: cùng một định
 * nghĩa `loads` hiển thị 1 cột trong modal và 2 cột trên trang. Nên nó là prop, và mặc
 * định là `1` để modal giữ nguyên hành vi cũ.
 *
 * Vì sao không tự động theo bề rộng: `Col` của antd dùng breakpoint của **viewport**,
 * không phải của container. Một modal rộng 520px nằm trong cửa sổ 1400px sẽ tự nhảy
 * sang 2 cột và bóp mỗi ô còn ~230px. Container query mới đo đúng container, nhưng antd
 * chưa hỗ trợ; ghép `columns` tường minh thì nơi gọi nói đúng điều nó muốn.
 *
 * `fullWidth` dành cho control cao hoặc rộng theo chiều ngang — `textarea`, danh sách
 * trạm dừng. Nhét chúng vào nửa cột thì ô nhập cao 3 dòng bị kẹp cạnh một ô một dòng,
 * và hai cột lệch nhau về chiều cao.
 */

import { Col, Row } from "antd";
import type { ReactNode } from "react";

/** Số cột ở màn rộng. Màn hẹp luôn 1 cột. */
export type FormGridColumns = 1 | 2;

export interface FormGridItem {
  /** Control chiếm cả hai cột, bất kể `columns`. */
  fullWidth?: boolean;
  key: string;
  node: ReactNode;
}

export interface FormGridProps {
  columns?: FormGridColumns;
  items: readonly FormGridItem[];
}

export const FormGrid = ({ columns = 1, items }: FormGridProps) => (
  <Row gutter={[16, 0]}>
    {items.map((item) => (
      <Col
        // `span` cho màn hẹp: 1 cột thì mọi field đã full width sẵn.
        key={item.key}
        lg={columns === 2 && !item.fullWidth ? 12 : 24}
        span={24}
      >
        {item.node}
      </Col>
    ))}
  </Row>
);
