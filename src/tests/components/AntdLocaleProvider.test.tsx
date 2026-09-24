/**
 * Chứng minh text do antd tự sinh đi theo ngôn ngữ đang chọn.
 *
 * Trước khi có provider này, `<ConfigProvider>` không nhận `locale` nên bảng luôn
 * hiện "No data" kể cả khi người dùng chọn tiếng Việt — i18next không can thiệp
 * được vào text bên trong antd.
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { initializeAppI18n } from "@locales";
import { render, screen, waitFor } from "@testing-library/react";
import { Table } from "antd";
import type { i18n as I18nInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

const Harness = () => (
  <AntdLocaleProvider>
    <Table
      columns={[{ dataIndex: "name", title: "Name" }]}
      dataSource={[]}
      pagination={false}
    />
  </AntdLocaleProvider>
);

async function renderIn(locale: "en" | "vi") {
  const i18n = await initializeAppI18n({ locale, fallbackLocale: "en" });

  return {
    i18n,
    ...render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>,
    ),
  };
}

// antd render trạng thái rỗng ở cả ô placeholder lẫn khối cuộn, nên dùng getAllByText.
const expectEmptyText = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("AntdLocaleProvider", () => {
  it("hiện text dựng sẵn của antd bằng tiếng Việt", async () => {
    await renderIn("vi");

    expectEmptyText("Trống");
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });

  it("hiện text dựng sẵn của antd bằng tiếng Anh", async () => {
    await renderIn("en");

    expectEmptyText("No data");
    expect(screen.queryByText("Trống")).not.toBeInTheDocument();
  });

  it("cập nhật text của antd khi đổi ngôn ngữ lúc đang chạy", async () => {
    const { i18n } = await renderIn("vi");
    expectEmptyText("Trống");

    await i18n.changeLanguage("en");

    await waitFor(() => {
      expectEmptyText("No data");
    });
  });

  it("lùi về tiếng Anh khi ngôn ngữ không được hỗ trợ", async () => {
    const i18n = await initializeAppI18n({ locale: "ja", fallbackLocale: "en" });
    // "fr" không có trong bảng ánh xạ — phải lùi về en, không được vỡ.
    await (i18n as I18nInstance).changeLanguage("fr");

    render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>,
    );

    expectEmptyText("No data");
  });
});
