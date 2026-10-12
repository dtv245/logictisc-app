import { useCan } from "@refinedev/core";
import { Button, Card, Col, Form, Input, Row, Skeleton, Space, theme } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";
import { ForbiddenState } from "@/components/ErrorStates";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { isUuid } from "@/utils/uuid";
import { routes } from "@/constants/routes";
import { useOptimizationActions } from "@/features/optimization/useOptimizationActions";
import { OptimizationRunForm } from "@/features/optimization/OptimizationRunForm";

export function OptimizationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenant } = useCurrentTenant();
  const access = useCan({ resource: "optimization", action: "OPTIMIZATION_VIEW" });
  const actions = useOptimizationActions();
  const { token } = theme.useToken();

  if (access.isLoading) {
    return (
      <div aria-label={t("asyncState.loading")} role="status" style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }
  if (!tenant?.tenantKey || access.data?.can !== true) return <ForbiddenState />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader title={t("optimization.title")} />
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card
            title={t("optimization.openRun")}
            style={{ borderRadius: token.borderRadiusLG }}
            className="optimization-open-card"
          >
            <Form
              layout="vertical"
              scrollToFirstError={{ behavior: "smooth", block: "center" }}
              onFinish={(values: { runId: string }) =>
                navigate(routes.optimizationRun.replace(":id", values.runId.trim()))
              }
            >
              <Form.Item
                name="runId"
                label={t("optimization.runId")}
                rules={[
                  { required: true },
                  {
                    validator: async (_, value: string | undefined) => {
                      if (!isUuid(value?.trim())) throw new Error(t("optimization.invalidUuid"));
                    },
                  },
                ]}
              >
                <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ width: "100%" }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" aria-label={t("common.view")}>
                {t("common.view")}
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={t("optimization.run")} style={{ borderRadius: token.borderRadiusLG }}>
            <OptimizationRunForm
              actions={actions}
              onCreated={(outcome) => navigate(routes.optimizationRun.replace(":id", outcome.run.id))}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
