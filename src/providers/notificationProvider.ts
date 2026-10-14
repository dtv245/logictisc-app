/** Connects Refine notifications to Ant Design; content uses the shared notification resolver. */
import { createElement, useMemo } from "react";
import type { NotificationProvider, OpenNotificationParams } from "@refinedev/core";
import { App, Button } from "antd";
import { useTranslation } from "react-i18next";

import { resolveNotificationContent } from "./notificationCompatibility";

// Keep the existing provider/barrel API while the compatibility boundary owns text input.
export {
  RESOURCE_LABELS,
  ERROR_CODE_TRANSLATIONS,
  detectResourceName,
  detectOperation,
  extractStatusCode,
  formatDescriptionContent,
  resolveNotificationContent,
} from "./notificationCompatibility";
export type { OperationType } from "./notificationCompatibility";

const getNotificationKey = (params: OpenNotificationParams): string =>
  params.key ?? `${params.type}-${typeof params.message === "string" ? params.message : "notification"}`;

export const useAntdNotificationProvider = (): NotificationProvider => {
  const { notification } = App.useApp();
  const { t } = useTranslation();

  return useMemo(
    () => ({
      open: (params: OpenNotificationParams) => {
        const resolved = resolveNotificationContent(params);
        const config = {
          key: getNotificationKey(params),
          message: resolved.message,
          description: resolved.description,
          duration: resolved.duration,
          btn: params.cancelMutation
            ? createElement(
                Button,
                { size: "small", onClick: params.cancelMutation },
                t("common.undo"),
              )
            : undefined,
        };

        if (params.type === "success") {
          notification.success(config);
        } else if (params.type === "error") {
          notification.error(config);
        } else {
          notification.open(config);
        }
      },
      close: (key: string) => notification.destroy(key),
    }),
    [notification, t],
  );
};
