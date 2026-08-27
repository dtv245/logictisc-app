/**
 * Composes application-wide UI providers around the bootstrap gate.
 */

import {
  App as AntdApp,
  ConfigProvider,
} from "antd";
import type { i18n } from "i18next";
import { I18nextProvider } from "react-i18next";

import {
  AppBootstrap,
  type AppBootstrapProps,
} from "./bootstrap";

export interface AppProps extends AppBootstrapProps {
  i18n: i18n;
}

export function App({
  i18n,
  loadConfig,
  probeApiHealth,
}: AppProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ConfigProvider>
        <AntdApp>
          <AppBootstrap
            {...(loadConfig ? { loadConfig } : {})}
            {...(probeApiHealth ? { probeApiHealth } : {})}
          />
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  );
}
