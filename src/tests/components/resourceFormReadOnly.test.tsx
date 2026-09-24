/**
 * Cơ chế trường `readOnly` (server sở hữu).
 *
 * Lý do tồn tại: repo chưa có `UpdateLoadRequest`/`UpdatePaymentRequest`, nên không
 * xác minh được PUT của backend là full-replace hay partial. Nếu UI **xoá** field
 * khỏi payload thì gặp PUT full-replace sẽ null mất giá trị đó; nếu UI **gửi lại**
 * giá trị cũ thì đúng trong cả hai trường hợp.
 *
 * Vì vậy field `readOnly` được render `disabled` (không sửa được) nhưng **vẫn nằm
 * trong form store**. Test này chốt đúng hành vi đó — nếu antd đổi cách giữ giá trị
 * của field `disabled`, hoặc renderer quên `disabled` cho một control mới, test đỏ.
 *
 * Assertion bám vào **payload `onFinish` thật** chứ không đọc form store, để kiểm
 * đúng thứ được gửi lên server.
 *
 * Chỉ render từng field tách rời: control `relation` cần Refine context (`useSelect`),
 * còn các field `readOnly` hiện có đều là `boolean`/`text`.
 */

import type { i18n as I18nInstance } from "i18next";

import {
  createResourceFormInitialValues,
  resourceFormDefinitions,
} from "@components/resources/resourceForms";
import type { ResourceFormField } from "@components/resources/resourceForms";
import { ResourceFormFields } from "@components/resources/ResourceFormFields";
import { initializeAppI18n } from "@locales";
import { Button, Form } from "antd";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

let i18n: I18nInstance;

const Harness = ({
  field,
  initialValues,
  onFinish,
}: {
  field: ResourceFormField;
  initialValues: Record<string, unknown>;
  onFinish: (values: Record<string, unknown>) => void;
}) => (
  <I18nextProvider i18n={i18n}>
    <Form initialValues={initialValues} layout="vertical" onFinish={onFinish}>
      <ResourceFormFields definition={{ fields: [field] }} />
      <Button htmlType="submit">submit</Button>
    </Form>
  </I18nextProvider>
);

/** Field `readOnly` thật trong descriptor, kèm tên resource để báo lỗi rõ ràng. */
const readOnlyFields = (): Array<{
  field: ResourceFormField;
  key: string;
  resource: string;
}> =>
  Object.entries(resourceFormDefinitions).flatMap(([resource, definition]) =>
    definition.fields
      .filter((field) => field.readOnly === true && field.control !== "relation")
      .map((field) => ({ field, key: `${resource}.${field.name}`, resource })),
  );

const labelOf = (field: ResourceFormField) =>
  i18n.t(`forms.fields.${field.name}`);

/** Render một field rồi submit form; trả về control và payload đã gửi. */
const submitField = async (
  field: ResourceFormField,
  initialValues: Record<string, unknown> = {},
) => {
  const submitted: Array<Record<string, unknown>> = [];
  render(
    <Harness
      field={field}
      initialValues={initialValues}
      onFinish={(values) => submitted.push(values)}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "submit" }));
  await waitFor(() => expect(submitted).toHaveLength(1));

  return {
    control: screen.getByLabelText(labelOf(field)),
    payload: submitted[0],
  };
};

beforeEach(async () => {
  i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "vi" });
});

describe("trường readOnly (server sở hữu)", () => {
  it("giữ nguyên giá trị server trả về trong payload khi update", async () => {
    const field: ResourceFormField = {
      control: "boolean",
      name: "isInProximity",
      readOnly: true,
    };

    const { control, payload } = await submitField(field, { isInProximity: true });

    // Không sửa được…
    expect(control).toBeDisabled();
    // …nhưng giá trị gốc vẫn được gửi lại nguyên vẹn.
    expect(payload.isInProximity).toBe(true);
  });

  it("field readOnly thật đều render disabled", () => {
    const unlocked = readOnlyFields()
      .filter(({ field }) => {
        render(
          <Harness
            field={field}
            initialValues={
              field.control === "boolean" ? { [field.name]: false } : {}
            }
            onFinish={() => undefined}
          />,
        );
        return screen.getByLabelText(labelOf(field)).getAttribute("disabled") === null;
      })
      .map(({ key }) => key);

    // Rỗng nghĩa là mọi field server sở hữu đều bị khoá. Có phần tử nghĩa là một
    // control mới chưa được renderer khoá — người dùng sửa được thứ không nên sửa.
    expect(unlocked).toEqual([]);
  });

  it("lúc create không khẳng định giá trị của server", async () => {
    const definition = resourceFormDefinitions.loads;
    const field = definition.fields.find((item) => item.name === "isInProximity");

    expect(field?.readOnly).toBe(true);

    const { payload } = await submitField(
      field as ResourceFormField,
      createResourceFormInitialValues(definition),
    );

    // Gửi `false` là client tự khẳng định một sự thật của server rồi khoá nó lại.
    expect(payload.isInProximity).toBeUndefined();
    // Mức dây: khoá `undefined` biến mất khỏi JSON, server tự quyết định.
    expect(JSON.stringify(payload)).not.toContain("isInProximity");
  });

  it("field thường không bị khoá", async () => {
    const { control, payload } = await submitField(
      { control: "text", name: "name" },
      { name: "L-1" },
    );

    expect(control).not.toBeDisabled();
    expect(payload.name).toBe("L-1");
  });
});
