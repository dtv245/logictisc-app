/**
 * `FormGrid` — lưới bố cục field.
 *
 * Điều đáng khoá ở đây không phải "có render hay không" mà là **số cột đến từ `columns`,
 * không đến từ bề rộng cửa sổ**. Đó là lý do component này tồn tại: `Col` của antd dùng
 * breakpoint của viewport, nên nếu để nó tự quyết thì một modal 520px trong cửa sổ
 * 1400px sẽ nhảy sang 2 cột và bóp mỗi ô còn ~230px.
 *
 * Test khẳng định qua class `ant-col-lg-*` — đó là cách antd mã hoá span theo breakpoint,
 * nên nó kiểm đúng thứ trình duyệt dùng, không phải một chi tiết trình bày.
 */

import { FormGrid } from "@/forms/FormGrid";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const items = [
  { key: "a", node: <span>A</span> },
  { key: "b", node: <span>B</span> },
  { fullWidth: true, key: "c", node: <span>C</span> },
];

/** `Col` bọc quanh node; class `ant-col-lg-*` là span ở màn rộng. */
const lgSpanOf = (text: string) => {
  const col = screen.getByText(text).closest(".ant-col");
  if (!col) throw new Error(`Không tìm thấy Col của "${text}"`);
  const match = /ant-col-lg-(\d+)/.exec(col.className);
  return match?.[1];
};

describe("FormGrid", () => {
  it("mặc định 1 cột — mọi field chiếm cả chiều ngang", () => {
    render(<FormGrid items={items} />);

    expect(lgSpanOf("A")).toBe("24");
    expect(lgSpanOf("B")).toBe("24");
    expect(lgSpanOf("C")).toBe("24");
  });

  it("`columns={2}` cho hai cột ở màn rộng", () => {
    render(<FormGrid columns={2} items={items} />);

    expect(lgSpanOf("A")).toBe("12");
    expect(lgSpanOf("B")).toBe("12");
  });

  it("`fullWidth` chiếm cả hai cột kể cả khi `columns={2}`", () => {
    render(<FormGrid columns={2} items={items} />);

    expect(lgSpanOf("C")).toBe("24");
  });

  it("màn hẹp luôn 1 cột, kể cả khi `columns={2}`", () => {
    render(<FormGrid columns={2} items={items} />);

    // `span={24}` là mặc định cho mọi breakpoint nhỏ hơn `lg`; thiếu nó thì hai ô
    // nửa cột vẫn chen nhau trên điện thoại.
    for (const text of ["A", "B", "C"]) {
      const col = screen.getByText(text).closest(".ant-col");
      expect(col?.className).toContain("ant-col-24");
    }
  });

  it("giữ đúng thứ tự field", () => {
    render(<FormGrid columns={2} items={items} />);

    const rendered = ["A", "B", "C"].map((text) => screen.getByText(text).textContent);

    expect(rendered).toEqual(["A", "B", "C"]);
  });
});
