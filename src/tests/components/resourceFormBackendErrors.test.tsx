/**
 * Lỗi field từ backend phải hiện **tại field**, không chỉ một toast chung.
 *
 * `src/forms/backendFieldErrors.ts` đã có sẵn từ lâu nhưng **không nơi nào gọi**
 * (spec §7 bước 1f, lỗi #12): backend trả 400 kèm `errors[].field` thì người dùng chỉ
 * thấy một thông báo chung và không biết phải sửa ô nào.
 *
 * Có **bốn** form dùng chung `resourceFormDefinitions` và chúng không chia sẻ abstraction
 * nào ở tầng gọi — mỗi nơi tự truyền `onMutationError`. Nên test phải phủ cả bốn: sửa
 * một nơi rồi quên ba nơi còn lại là đúng kiểu hỏng mà file này tồn tại để chặn.
 *
 * Test đi qua đường thật: render form, bắt lấy `onMutationError` mà component truyền cho
 * Refine, gọi nó bằng một `ApiError` giống lỗi Spring trả về, rồi khẳng định antd hiện
 * message ở field tương ứng. Mock chỉ thay Refine runtime — form instance là antd thật,
 * nên `setFields` chạy thật.
 *
 * Việc tách `originAddress.line1` thành name path là hành vi của chính helper, đã có
 * test riêng ở `src/tests/forms/backendFieldErrors.test.ts`; ở đây chỉ kiểm việc nối dây.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceCreateModal } from "@components/ResourceCreateModal";
import { ResourceCreatePage } from "@components/ResourceCreatePage";
import { ResourceEditModal } from "@components/ResourceEditModal";
import { ResourceEditPage } from "@components/ResourceEditPage";
import { initializeAppI18n } from "@locales";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiError } from "@/types/api.types";

/** `onMutationError` mà component truyền xuống hook của Refine. */
const captured = vi.hoisted(() => ({
  onMutationError: undefined as
    | ((error: unknown, variables: unknown, context: unknown) => void)
    | undefined,
}));

vi.mock("@refinedev/antd", async () => {
  const { Form: AntdForm } = await import("antd");

  // Form instance thật của antd để `setFields` có tác dụng thật.
  // Tên bắt đầu bằng `use` vì thân hàm gọi `useForm` — đây là hook, không phải hàm thường.
  const useFormInstance = (onMutationError: typeof captured.onMutationError) => {
    captured.onMutationError = onMutationError;
    const [form] = AntdForm.useForm();
    return form;
  };

  return {
    Create: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Edit: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    // `ResourceFormFields` chỉ cần `useSelect` trả props rỗng để `Select` render trơn.
    useSelect: () => ({ selectProps: {} }),
    useForm: (props: { onMutationError?: typeof captured.onMutationError }) => {
      const form = useFormInstance(props.onMutationError);
      return {
        form,
        formProps: { form },
        queryResult: { isLoading: false },
        saveButtonProps: {},
      };
    },
    useModalForm: (props: { onMutationError?: typeof captured.onMutationError }) => {
      const form = useFormInstance(props.onMutationError);
      return {
        form,
        formLoading: false,
        formProps: { form },
        modalProps: { open: true },
        show: vi.fn(),
      };
    },
  };
});

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

beforeEach(() => {
  captured.onMutationError = undefined;
});

/** Lỗi 400 đúng hình dạng `ApiHttpError` mà tầng transport dựng ra. */
const validationError = (errors: Record<string, string[]>): ApiError =>
  ({
    errors,
    message: "Dữ liệu không hợp lệ",
    statusCode: 400,
  }) as ApiError;

const renderInApp = async (node: ReactNode) => {
  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>{node}</AntdLocaleProvider>
    </I18nextProvider>,
  );

  // Form phải render xong trước khi `setFields` có field để gắn lỗi vào.
  await screen.findByLabelText("Tên");
};

const fireMutationError = (error: ApiError) => {
  act(() => {
    captured.onMutationError?.(error, {}, {});
  });
};

/**
 * Một ca cho mỗi form. `render` phải chờ form hiện ra rồi mới bắn lỗi, nên mỗi ca tự
 * gọi `renderInApp` với component của mình.
 */
const forms: ReadonlyArray<{
  name: string;
  render: () => Promise<void>;
}> = [
  {
    name: "ResourceCreateModal",
    render: () =>
      renderInApp(<ResourceCreateModal resource="loads" trigger={() => null} />),
  },
  {
    name: "ResourceEditModal",
    render: () =>
      renderInApp(
        <ResourceEditModal
          id="1"
          onClose={vi.fn()}
          resource="loads"
          visible
        />,
      ),
  },
  {
    name: "ResourceCreatePage",
    render: () => renderInApp(<ResourceCreatePage resource="loads" />),
  },
  {
    name: "ResourceEditPage",
    render: () => renderInApp(<ResourceEditPage resource="loads" />),
  },
];

describe.each(forms)("$name — lỗi field từ backend", ({ render: renderForm }) => {
  it("truyền `onMutationError` cho Refine", async () => {
    await renderForm();

    // Không có dòng này thì mọi khẳng định bên dưới đều vô nghĩa.
    expect(captured.onMutationError).toBeTypeOf("function");
  });

  it("hiện message của backend ngay tại field lỗi", async () => {
    await renderForm();

    fireMutationError(validationError({ name: ["Tên không được để trống"] }));

    expect(
      await screen.findByText("Tên không được để trống"),
    ).toBeInTheDocument();
  });

  it("gắn được nhiều field cùng lúc", async () => {
    await renderForm();

    fireMutationError(
      validationError({
        distance: ["Khoảng cách phải lớn hơn 0"],
        name: ["Tên không được để trống"],
      }),
    );

    expect(
      await screen.findByText("Tên không được để trống"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Khoảng cách phải lớn hơn 0"),
    ).toBeInTheDocument();
  });

  it("không làm gì khi lỗi không kèm `errors[]`", async () => {
    await renderForm();

    // Lỗi 500 hoặc lỗi mạng: `errors` là undefined, không được để `setFields` ném ra.
    expect(() =>
      fireMutationError({
        message: "Lỗi hệ thống",
        statusCode: 500,
      } as ApiError),
    ).not.toThrow();

    expect(screen.getByLabelText("Tên")).toBeInTheDocument();
  });
});
