/**
 * Owns the application gate and mounts runtime providers/router only when the
 * validated API and database are ready.
 */

import { AppRouter } from "@app/router";
import { RuntimeConfigProvider } from "@core/config";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BootstrapStateView } from "./BootstrapStateView";
import {
  useAppBootstrap,
  type UseAppBootstrapOptions,
} from "./useAppBootstrap";

export interface AppBootstrapProps {
  loadConfig?: UseAppBootstrapOptions["loadConfig"];
  probeApiHealth?: UseAppBootstrapOptions["probeApiHealth"];
}

export function AppBootstrap({
  loadConfig,
  probeApiHealth,
}: AppBootstrapProps) {
  const { i18n } = useTranslation();
  const applyLocale = useCallback(
    async (locale: "en" | "vi") => {
      await i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
    },
    [i18n],
  );
  const { isRetrying, retry, state } = useAppBootstrap({
    applyLocale,
    ...(loadConfig ? { loadConfig } : {}),
    ...(probeApiHealth ? { probeApiHealth } : {}),
  });

  if (state.kind !== "ready") {
    return (
      <BootstrapStateView
        isRetrying={isRetrying}
        onRetry={retry}
        state={state}
      />
    );
  }

  return (
    <RuntimeConfigProvider config={state.config}>
      <AppRouter state={state} />
    </RuntimeConfigProvider>
  );
}
