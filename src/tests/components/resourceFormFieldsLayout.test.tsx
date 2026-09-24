/**
 * `ResourceFormFields` — số cột và field chiếm cả chiều ngang.
 *
 * Form page và form modal dùng **cùng** một định nghĩa field, nên nếu số cột không đến
 * từ prop thì hai nơi không thể khác nhau. Test khoá đúng ranh giới đó: cùng một định
 * nghĩa, `columns={2}` xếp 2 cột còn mặc định thì không.
 *
 * Khoá luôn `isFullWidthControl`: `notes` (textarea, trong `loads`) và `stops` (danh
 * sách trạm dừng, trong `trips`) phải chiếm cả hai cột. Đây là loại lỗi chỉ hiện ra khi
 * nhìn — một ô nhập 3 dòng bị kẹp trong nửa cột, cạnh một ô một dòng — nên không có test
 * thì nó quay lại lúc nào cũng được.
 *
 * `EntityPicker` được mock vì nó gọi `useSelect` của Refine; ở đây chỉ quan tâm bố cục.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceFormFields } from "@components/resources/ResourceFormFields";
import { resourceFormDefinitions } from "@components/resources/resourceForms";
import type { EditableResourceName } from "@components/resources/resourceForms";
import { initializeAppI18n } from "@locales";
import { render, screen } from "@testing-library/react";
import { Form } from "antd";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/antd", () => ({
  useSelect: () => ({ selectProps: {} }),
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderFields = (resource: EditableResourceName, columns?: 1 | 2) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <Form layout="vertical">
          <ResourceFormFields
            {...(columns === undefined ? {} : { columns })}
            definition={resourceFormDefinitions[resource]}
          />
        </Form>
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

/**
 * `Form.Item` của antd cũng render `.ant-col` cho nhãn và cho phần control, nằm *bên
 * trong* `Form.Item`. Nên phải loại hai lớp đó ra mới chạm tới `Col` của lưới.
 */
const GRID_COL = ".ant-col:not(.ant-form-item-label):not(.ant-form-item-control)";

/** Span ở màn rộng của `Col` lưới bọc quanh một phần tử. */
const lgSpanOf = (element: HTMLElement | null) => {
  const col = element?.closest(GRID_COL);
  if (!col) throw new Error("Không tìm thấy Col của lưới");
  return /ant-col-lg-(\d+)/.exec(col.className)?.[1];
};

describe("ResourceFormFields — bố cục nhiều cột", () => {
  it("mặc định 1 cột, để modal giữ nguyên hành vi cũ", () => {
    renderFields("loads");

    expect(lgSpanOf(screen.getByLabelText("Tên"))).toBe("24");
    expect(lgSpanOf(screen.getByLabelText("Ghi chú"))).toBe("24");
  });

  it("`columns={2}` xếp field thường thành hai cột", () => {
    renderFields("loads", 2);

    expect(lgSpanOf(screen.getByLabelText("Tên"))).toBe("12");
  });

  it("`textarea` chiếm cả hai cột dù `columns={2}`", () => {
    renderFields("loads", 2);

    // Ô 3 dòng nằm nửa cột sẽ kéo lệch chiều cao so với ô bên cạnh.
    expect(lgSpanOf(screen.getByLabelText("Ghi chú"))).toBe("24");
  });

  it("danh sách trạm dừng chiếm cả hai cột dù `columns={2}`", () => {
    renderFields("trips", 2);

    // `tripStops` không có nhãn `Form.Item` nên nhận diện qua nút thêm trạm. Khớp theo
    // regex vì antd chèn icon `PlusOutlined` có `aria-label` vào tên trợ năng của nút.
    expect(
      lgSpanOf(screen.getByRole("button", { name: /Thêm điểm dừng/ })),
    ).toBe("24");
  });

  it("không bọc thêm Col nào ngoài số field của định nghĩa", () => {
    // Sai sót ở đây làm mất hoặc nhân đôi field. `stops` cũng là một field, chỉ khác
    // là nó render `Form.List` chứ không phải `Form.Item`.
    renderFields("loads", 2);

    expect(
      document.querySelectorAll(`form > .ant-row > ${GRID_COL}`),
    ).toHaveLength(resourceFormDefinitions.loads.fields.length);
  });
});
