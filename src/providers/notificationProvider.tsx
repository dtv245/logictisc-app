import { useMemo } from "react";
import type { NotificationProvider, OpenNotificationParams } from "@refinedev/core";
import { App, Button } from "antd";

const getNotificationKey = (params: OpenNotificationParams): string =>
  params.key ?? `${params.type}-${params.message}`;

export const useAntdNotificationProvider = (): NotificationProvider => {
  const { notification } = App.useApp();

  return useMemo(
    () => ({
      open: (params: OpenNotificationParams) => {
        const config = {
          key: getNotificationKey(params),
          message: params.message,
          description: params.description,
          duration:
            params.type === "progress"
              ? (params.undoableTimeout ?? 5000) / 1000
              : 4.5,
          btn: params.cancelMutation ? (
            <Button size="small" onClick={params.cancelMutation}>
              Hoàn tác
            </Button>
          ) : undefined,
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
    [notification],
  );
};
