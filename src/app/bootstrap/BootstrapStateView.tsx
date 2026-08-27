/**
 * Presents fail-closed bootstrap states without owning network or retry logic.
 */

import {
  AccessibleAnnouncement,
  ConfigErrorState,
} from "@shared/components";
import { SHARED_I18N_NAMESPACE } from "@shared/i18n";
import {
  Button,
  Flex,
  Result,
  Space,
  Spin,
  Typography,
} from "antd";
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { APP_I18N_NAMESPACE } from "../i18n";
import type { AppBootstrapState } from "./bootstrapState";

export interface BootstrapStateViewProps {
  isRetrying?: boolean;
  onRetry?: () => void;
  state: AppBootstrapState;
}

interface BootstrapFailureProps {
  description: ReactNode;
  httpStatus?: number;
  isRetrying: boolean;
  onRetry?: () => void;
  requestId: string;
  status: "error" | "warning";
  title: ReactNode;
}

function BootstrapFailure({
  description,
  httpStatus,
  isRetrying,
  onRetry,
  requestId,
  status,
  title,
}: BootstrapFailureProps) {
  const titleId = useId();
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  const { t: tShared } = useTranslation(SHARED_I18N_NAMESPACE);

  return (
    <section aria-labelledby={titleId} role="alert">
      <Result
        status={status}
        title={
          <Typography.Title id={titleId} level={3}>
            {title}
          </Typography.Title>
        }
        subTitle={
          <Space direction="vertical">
            <Typography.Text>{description}</Typography.Text>
            {httpStatus === undefined ? null : (
              <Typography.Text>
                {t("bootstrap.httpStatus", {
                  status: httpStatus,
                })}
              </Typography.Text>
            )}
            <Space direction="vertical" size={0}>
              <Typography.Text strong>
                {t("bootstrap.requestId.label")}
              </Typography.Text>
              <Typography.Text
                code
                copyable={{
                  text: requestId,
                  tooltips: [
                    t("bootstrap.requestId.copy"),
                    t("bootstrap.requestId.copied"),
                  ],
                }}
              >
                {requestId}
              </Typography.Text>
            </Space>
          </Space>
        }
        extra={
          onRetry ? (
            <Button
              disabled={isRetrying}
              loading={isRetrying}
              onClick={onRetry}
              type="primary"
            >
              {tShared("actions.retry")}
            </Button>
          ) : undefined
        }
      />
    </section>
  );
}

function readSafeConfigDetails(
  state: Extract<AppBootstrapState, { kind: "config-error" }>,
): readonly string[] {
  const fields = state.error.details.flatMap((detail) => {
    const match = /^([A-Za-z][A-Za-z0-9.[\]_-]*):/u.exec(detail);
    return match?.[1] ? [match[1]] : [];
  });

  return [state.error.code, ...new Set(fields)];
}

export function BootstrapStateView({
  isRetrying = false,
  onRetry,
  state,
}: BootstrapStateViewProps) {
  const { t } = useTranslation(APP_I18N_NAMESPACE);

  switch (state.kind) {
    case "loading-config": {
      const message = t("bootstrap.loadingConfig");
      return (
        <Flex
          align="center"
          aria-busy="true"
          justify="center"
          role="region"
          vertical
        >
          <Spin size="large" />
          <Typography.Text>{message}</Typography.Text>
          <AccessibleAnnouncement message={message} />
        </Flex>
      );
    }
    case "probing-health": {
      const message = t("bootstrap.probingHealth");
      return (
        <Flex
          align="center"
          aria-busy="true"
          justify="center"
          role="region"
          vertical
        >
          <Spin size="large" />
          <Typography.Text>{message}</Typography.Text>
          <AccessibleAnnouncement message={message} />
        </Flex>
      );
    }
    case "config-error":
      return (
        <ConfigErrorState
          details={readSafeConfigDetails(state)}
          {...(onRetry ? { onRetry } : {})}
          retrying={isRetrying}
        />
      );
    case "api-unreachable":
      return (
        <BootstrapFailure
          description={t("bootstrap.unreachable.description")}
          isRetrying={isRetrying}
          {...(onRetry ? { onRetry } : {})}
          requestId={state.requestId}
          status="error"
          title={t("bootstrap.unreachable.title")}
        />
      );
    case "cors-blocked":
      return (
        <BootstrapFailure
          description={t("bootstrap.corsBlocked.description")}
          isRetrying={isRetrying}
          {...(onRetry ? { onRetry } : {})}
          requestId={state.requestId}
          status="warning"
          title={t("bootstrap.corsBlocked.title")}
        />
      );
    case "api-unhealthy":
      return (
        <BootstrapFailure
          description={t("bootstrap.unhealthy.description")}
          {...(state.httpStatus === undefined
            ? {}
            : { httpStatus: state.httpStatus })}
          isRetrying={isRetrying}
          {...(onRetry ? { onRetry } : {})}
          requestId={state.requestId}
          status="error"
          title={t("bootstrap.unhealthy.title")}
        />
      );
    case "database-disabled":
      return (
        <BootstrapFailure
          description={t("bootstrap.databaseDisabled.description")}
          isRetrying={isRetrying}
          {...(onRetry ? { onRetry } : {})}
          requestId={state.requestId}
          status="warning"
          title={t("bootstrap.databaseDisabled.title")}
        />
      );
    case "ready":
      return null;
  }
}
