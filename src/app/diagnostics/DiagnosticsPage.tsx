/**
 * Displays the approved public diagnostics whitelist from a ready bootstrap.
 */

import { APP_I18N_NAMESPACE } from "@app/i18n";
import type { AppBootstrapState } from "@app/bootstrap";
import { StatusIndicator } from "@shared/components";
import {
  Card,
  Descriptions,
  Flex,
  Typography,
} from "antd";
import { useId } from "react";
import { useTranslation } from "react-i18next";

export type ReadyBootstrapState = Extract<
  AppBootstrapState,
  { kind: "ready" }
>;

export interface DiagnosticsPageProps {
  state: ReadyBootstrapState;
}

export function DiagnosticsPage({
  state,
}: DiagnosticsPageProps) {
  const titleId = useId();
  const { t } = useTranslation(APP_I18N_NAMESPACE);

  return (
    <main aria-labelledby={titleId}>
      <Card>
        <Flex gap="middle" vertical>
          <div>
            <Typography.Title id={titleId} level={2}>
              {t("diagnostics.title")}
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              {t("diagnostics.description")}
            </Typography.Paragraph>
          </div>

          <Descriptions
            bordered
            column={{
              xs: 1,
              sm: 2,
              lg: 3,
            }}
            layout="vertical"
            size="small"
          >
            <Descriptions.Item
              label={t("diagnostics.fields.environment")}
            >
              {state.config.environment}
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.application")}
            >
              {state.health.application}
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.profiles")}
            >
              {state.health.profiles}
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.status")}
            >
              <StatusIndicator
                label={state.health.status}
                tone="success"
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.database")}
            >
              <StatusIndicator
                label={state.health.database}
                tone="success"
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.requestId")}
            >
              <Typography.Text
                code
                copyable={{
                  text: state.requestId,
                  tooltips: [
                    t("bootstrap.requestId.copy"),
                    t("bootstrap.requestId.copied"),
                  ],
                }}
              >
                {state.requestId}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        </Flex>
      </Card>
    </main>
  );
}
