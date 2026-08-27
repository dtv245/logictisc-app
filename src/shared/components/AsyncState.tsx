/**
 * AsyncStateView
 *
 * Renders the four required query states through a discriminated union so a
 * populated view cannot accidentally render while loading or after an error.
 */
import { Empty, Flex, Space, Spin, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SHARED_I18N_NAMESPACE } from "../i18n";
import { AccessibleAnnouncement } from "./AccessibleAnnouncement";
import type { AsyncState } from "./asyncStateModel";
import { QueryErrorState } from "./ErrorStates";

export interface AsyncStateViewProps<T> {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  errorDescription?: ReactNode;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
}

export function AsyncStateView<T>({
  state,
  children,
  onRetry,
  retrying,
  errorDescription,
  emptyTitle,
  emptyDescription,
}: AsyncStateViewProps<T>) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);

  switch (state.status) {
    case "loading":
      return (
        <Flex
          align="center"
          aria-busy="true"
          justify="center"
          role="region"
          vertical
        >
          <Spin size="large" />
          <Typography.Text>{t("asyncState.loading")}</Typography.Text>
          <AccessibleAnnouncement message={t("asyncState.loading")} />
        </Flex>
      );
    case "error":
      return (
        <QueryErrorState
          description={errorDescription}
          {...(onRetry ? { onRetry } : {})}
          {...(retrying === undefined ? {} : { retrying })}
        />
      );
    case "empty":
      return (
        <section aria-live="polite">
          <Empty
            description={
              <Space direction="vertical">
                <Typography.Text strong>
                  {emptyTitle ?? t("asyncState.emptyTitle")}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {emptyDescription ?? t("asyncState.emptyDescription")}
                </Typography.Text>
              </Space>
            }
          />
        </section>
      );
    case "populated":
      return children(state.data);
  }
}
