/**
 * Displays the approved public diagnostics whitelist from a ready bootstrap.
 */

import type { AppBootstrapState } from "@config/bootstrapState";
import { PageHeader } from "@components/PageHeader";
import { StatusTag } from "@components/StatusTag";
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
  const { t } = useTranslation();

  return (
    <main aria-labelledby={titleId}>
      <Card>
        <Flex gap="middle" vertical>
          <PageHeader
            description={t("diagnostics.description")}
            id={titleId}
            title={t("diagnostics.title")}
          />

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
              <StatusTag
                label={state.health.status}
                tone="success"
              />
            </Descriptions.Item>
            <Descriptions.Item
              label={t("diagnostics.fields.database")}
            >
              <StatusTag
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
