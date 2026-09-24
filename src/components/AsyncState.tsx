/**
 * AsyncStateView
 *
 * Renders the four required query states through a discriminated union so a
 * populated view cannot accidentally render while loading or after an error.
 */
import { Flex, Spin, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AccessibleAnnouncement } from "./AccessibleAnnouncement";
import { EmptyState } from "./EmptyState";
import type { AsyncState } from "@utils/asyncStateModel";
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
  const { t } = useTranslation();

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
    case "error": {
      // Mặc định lấy message từ chính lỗi, nếu không thì mọi consumer phải tự nhớ
      // truyền `errorDescription` — quên một chỗ là thông báo lỗi biến mất, chỉ còn
      // câu chung chung, và không có gì báo cho người viết biết là đã quên.
      //
      // `state.error` là `unknown`, nên chỉ đọc message khi chắc chắn là `Error`
      // (`ApiHttpError` cũng là `Error`). Lỗi không rõ hình dạng thì rơi về mô tả
      // của locale, thay vì hiện "[object Object]".
      const fallbackMessage =
        state.error instanceof Error ? state.error.message : undefined;

      return (
        <QueryErrorState
          description={errorDescription ?? fallbackMessage}
          {...(onRetry ? { onRetry } : {})}
          {...(retrying === undefined ? {} : { retrying })}
        />
      );
    }
    case "empty":
      return <EmptyState description={emptyDescription} title={emptyTitle} />;
    case "populated":
      return children(state.data);
  }
}
