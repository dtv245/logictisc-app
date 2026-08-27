/**
 * Test-only renderer for shared components that require Ant Design App and
 * i18next providers.
 */
import { App as AntdApp, ConfigProvider } from "antd";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";

import {
  createAppI18n,
  type SupportedLocale,
} from "../i18n";

export async function renderWithSharedProviders(
  ui: ReactElement,
  locale: SupportedLocale = "en",
  options?: RenderOptions,
): Promise<RenderResult> {
  const i18n = await createAppI18n({ locale });

  return render(
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>{ui}</AntdApp>
      </ConfigProvider>
    </I18nextProvider>,
    options,
  );
}
