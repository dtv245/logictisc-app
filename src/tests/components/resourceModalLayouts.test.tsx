/**
 * Tests khẳng định bố cục popup trong các màn CRUD:
 * - Bố cục ngang (hình chữ nhật, width 860px).
 * - Các trường form được chia 2 cột (columns={2}).
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceCreateModal } from "@components/ResourceCreateModal";
import { ResourceEditModal } from "@components/ResourceEditModal";
import { initializeAppI18n } from "@locales";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@refinedev/antd", async () => {
  const { Form: AntdForm } = await import("antd");
  return {
    CreateButton: () => <button type="button">create</button>,
    useSelect: () => ({ selectProps: {} }),
    useModalForm: () => {
      const [form] = AntdForm.useForm();
      return {
        close: vi.fn(),
        form,
        formLoading: false,
        formProps: { form },
        modalProps: { open: true },
        show: vi.fn(),
      };
    },
  };
});

vi.mock("@refinedev/core", () => ({
  useDataProvider: () => () => ({ getOne: vi.fn() }),
  useWarnAboutChange: () => ({
    setWarnWhen: vi.fn(),
    warnWhen: false,
    warnWhenUnsavedChanges: true,
  }),
}));

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

describe("CRUD Modals — Bố cục ngang hình chữ nhật và 2 cột", () => {
  it("ResourceCreateModal áp dụng width 860px và xếp 2 cột", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <ResourceCreateModal resource="loads" trigger={() => null} />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    const modal = document.querySelector(".ant-modal");
    expect(modal).toHaveStyle({ width: "860px" });

    // Kiểm tra các trường thông thường trong form được chia thành 2 cột (ant-col-lg-12)
    const nameInput = screen.getByLabelText("Tên");
    const nameCol = nameInput.closest(".ant-col:not(.ant-form-item-label):not(.ant-form-item-control)");
    expect(nameCol?.className).toContain("ant-col-lg-12");
  });

  it("ResourceEditModal áp dụng width 860px và xếp 2 cột", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AntdLocaleProvider>
          <ResourceEditModal id="1" onClose={vi.fn()} resource="loads" visible />
        </AntdLocaleProvider>
      </I18nextProvider>,
    );

    const modal = document.querySelector(".ant-modal");
    expect(modal).toHaveStyle({ width: "860px" });

    const nameInput = screen.getByLabelText("Tên");
    const nameCol = nameInput.closest(".ant-col:not(.ant-form-item-label):not(.ant-form-item-control)");
    expect(nameCol?.className).toContain("ant-col-lg-12");
  });
});
