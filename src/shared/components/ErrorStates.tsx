/**
 * Shared recovery states for query, configuration, authorization and routing
 * failures.
 *
 * Navigation is injected by the app layer so these components stay independent
 * from a particular router and never infer authorization behavior.
 */
import { Button, Result, Space, Typography } from "antd";
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SHARED_I18N_NAMESPACE } from "../i18n";

interface StateShellProps {
  status: "error" | "warning" | "403" | "404";
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  details?: readonly string[];
}

function StateShell({
  status,
  title,
  description,
  action,
  details = [],
}: StateShellProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      role={status === "error" ? "alert" : "region"}
    >
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
            {details.length > 0 ? (
              <ul>
                {details.map((detail, index) => (
                  <li key={`${index}:${detail}`}>
                    <Typography.Text>{detail}</Typography.Text>
                  </li>
                ))}
              </ul>
            ) : null}
          </Space>
        }
        extra={action}
      />
    </section>
  );
}

export interface QueryErrorStateProps {
  description?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
}

export function QueryErrorState({
  description,
  onRetry,
  retrying = false,
}: QueryErrorStateProps) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);

  return (
    <StateShell
      status="error"
      title={t("queryError.title")}
      description={description ?? t("queryError.description")}
      action={
        onRetry ? (
          <Button
            disabled={retrying}
            loading={retrying}
            onClick={onRetry}
            type="primary"
          >
            {t("actions.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}

export interface ConfigErrorStateProps {
  details?: readonly string[];
  onRetry?: () => void;
  retrying?: boolean;
}

export function ConfigErrorState({
  details,
  onRetry,
  retrying = false,
}: ConfigErrorStateProps) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);

  return (
    <StateShell
      status="warning"
      title={t("configError.title")}
      description={t("configError.description")}
      details={details ?? []}
      action={
        onRetry ? (
          <Button
            disabled={retrying}
            loading={retrying}
            onClick={onRetry}
            type="primary"
          >
            {t("actions.retry")}
          </Button>
        ) : undefined
      }
    />
  );
}

export interface RecoveryNavigationProps {
  onGoHome?: () => void;
}

export function ForbiddenState({ onGoHome }: RecoveryNavigationProps) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);

  return (
    <StateShell
      status="403"
      title={t("forbidden.title")}
      description={t("forbidden.description")}
      action={
        onGoHome ? (
          <Button onClick={onGoHome} type="primary">
            {t("actions.goHome")}
          </Button>
        ) : undefined
      }
    />
  );
}

export function NotFoundState({ onGoHome }: RecoveryNavigationProps) {
  const { t } = useTranslation(SHARED_I18N_NAMESPACE);

  return (
    <StateShell
      status="404"
      title={t("notFound.title")}
      description={t("notFound.description")}
      action={
        onGoHome ? (
          <Button onClick={onGoHome} type="primary">
            {t("actions.goHome")}
          </Button>
        ) : undefined
      }
    />
  );
}
