import type { SupportedLocale } from "@config/types";
/**
 * Owns the application gate and mounts runtime providers/router only when the
 * validated API and database are ready.
 */

import { RuntimeConfigProvider } from "./RuntimeConfigProvider";
import { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { BootstrapStateView } from "./BootstrapStateView";
import {
  useAppBootstrap,
  type UseAppBootstrapOptions,
} from "./useAppBootstrap";

export interface AppBootstrapProps {
  loadConfig?: UseAppBootstrapOptions["loadConfig"];
  probeApiHealth?: UseAppBootstrapOptions["probeApiHealth"];
  renderReady: (
    state: Extract<
      ReturnType<typeof useAppBootstrap>["state"],
      { kind: "ready" }
    >,
  ) => ReactNode;
}

/**
 * Chặn runtime cho đến khi config và health checks hoàn tất.
 * `renderReady` là seam bắt buộc cho runtime và unit test; bootstrap không sở
 * hữu router riêng để tránh tồn tại hai cây route song song.
 */
export function AppBootstrap({
  loadConfig,
  probeApiHealth,
  renderReady,
}: AppBootstrapProps) {
  const { i18n } = useTranslation();
  const applyLocale = useCallback(
    async (locale: SupportedLocale) => {
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
    // Provider chỉ nhận config đã được validate từ nhánh ready ở trên.
    <RuntimeConfigProvider config={state.config}>
      {renderReady(state)}
    </RuntimeConfigProvider>
  );
}
