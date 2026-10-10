/** Explicit calculate/open workflow entry while the backend has no run collection API. */
import { Button, Card, Col, DatePicker, Divider, Form, Input, Modal, Row, Space, Spin, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { FormGrid } from "@/forms/FormGrid";
import { ApiHttpError } from "@/providers/api/httpError";
import { useState } from "react";
import { useCan } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { routes } from "@/constants/routes";
import { UUID_PATTERN, isUuid } from "@/utils/uuid";
import { PageHeader } from "@/components/PageHeader";
import { ForbiddenState } from "@/components/ErrorStates";
import { PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED } from "@/features/payroll/payroll.api";
import { usePayrollActions } from "@/features/payroll/usePayrollActions";
import { PayrollActionError } from "@/features/payroll/PayrollActions";
import type { CalculatePayrollPayload } from "@/types/payroll.dto";

interface CalculateForm {
  payPeriodId: string;
  currency: string;
  effectiveDate: Dayjs;
  settlementIds: string;
}

const isFormField = (name: unknown): name is keyof CalculateForm =>
  typeof name === "string" && ["payPeriodId", "currency", "effectiveDate", "settlementIds"].includes(name);

export function PayrollEntryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const access = useCan({ resource: "payroll", action: "PAYROLL_VIEW" });
  const actions = usePayrollActions();
  const [form] = Form.useForm<CalculateForm>();
  const [payload, setPayload] = useState<CalculatePayrollPayload>();
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const go = (id: string) => navigate(routes.payrollShow.replace(":id", encodeURIComponent(id)));

  if (access.isLoading) return <Spin aria-label={t("asyncState.loading")} />;
  if (access.data?.can !== true) return <ForbiddenState />;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <PageHeader
        title={t("payroll.title")}
        extra={
          PAYROLL_RECONCILIATION_CONTRACT_CONFIRMED ? (
            <Button onClick={() => navigate(routes.payrollReconciliation)}>
              {t("payroll.reconciliation")}
            </Button>
          ) : undefined
        }
      />

      <PayrollActionError error={actions.error} />

      <Row gutter={[24, 24]}>
        {/* Open Run Card (1 input <= 7) */}
        <Col xs={24} lg={8}>
          <Card title={t("payroll.openRun")}>
            <Form<{ id: string }>
              layout="vertical"
              scrollToFirstError={{ behavior: "smooth", block: "center" }}
              onFinish={({ id }) => go(id.trim())}
            >
              <Form.Item
                name="id"
                label={t("payroll.runId")}
                rules={[{ required: true }, { pattern: UUID_PATTERN, message: t("payroll.invalidId") }]}
              >
                <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                {t("common.view")}
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Calculate Payroll Card */}
        {actions.canExecute("calculate") && (
          <Col xs={24} lg={16}>
            <Card title={t("payroll.actions.calculate")}>
              <Form
                form={form}
                layout="vertical"
                scrollToFirstError={{ behavior: "smooth", block: "center" }}
                disabled={actions.pending}
                onFinish={(values) =>
                  setPayload({
                    idempotencyKey,
                    payPeriodId: values.payPeriodId.trim(),
                    currency: values.currency.trim().toUpperCase(),
                    effectiveDate: values.effectiveDate.format("YYYY-MM-DD"),
                    settlementIds: values.settlementIds.split(/[\s,]+/).filter(Boolean),
                  })
                }
              >
                {/* Section 1: Pay Period & Currency (3 inputs <= 7) */}
                <div style={{ marginBottom: 20 }}>
                  <Typography.Title level={5} style={{ marginBottom: 4 }}>
                    {t("payroll.periodScope")}
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {t("payroll.periodScopeHelp")}
                  </Typography.Paragraph>

                  <FormGrid
                    columns={2}
                    items={[
                      {
                        key: "payPeriodId",
                        fullWidth: true,
                        node: (
                          <Form.Item
                            name="payPeriodId"
                            label={t("payroll.periodId")}
                            rules={[{ required: true }, { pattern: UUID_PATTERN, message: t("payroll.invalidId") }]}
                          >
                            <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                          </Form.Item>
                        ),
                      },
                      {
                        key: "currency",
                        node: (
                          <Form.Item
                            name="currency"
                            label={t("finance.currency")}
                            rules={[{ required: true }, { pattern: /^[A-Za-z]{3}$/, message: t("payroll.invalidCurrency") }]}
                          >
                            <Input maxLength={3} placeholder="EUR, USD, VND..." />
                          </Form.Item>
                        ),
                      },
                      {
                        key: "effectiveDate",
                        node: (
                          <Form.Item
                            name="effectiveDate"
                            label={t("payroll.effectiveDate")}
                            rules={[{ required: true }]}
                          >
                            <DatePicker style={{ width: "100%" }} />
                          </Form.Item>
                        ),
                      },
                    ]}
                  />
                </div>

                <Divider style={{ margin: "16px 0 20px" }} />

                {/* Section 2: Source Settlements (1 input <= 7) */}
                <div style={{ marginBottom: 20 }}>
                  <Typography.Title level={5} style={{ marginBottom: 4 }}>
                    {t("payroll.settlementsScope")}
                  </Typography.Title>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {t("payroll.settlementsScopeHelp")}
                  </Typography.Paragraph>

                  <Form.Item
                    name="settlementIds"
                    label={t("payroll.sourceSettlements")}
                    rules={[
                      { required: true },
                      {
                        validator: (_, value: string | undefined) => {
                          const ids = value?.trim().split(/[\s,]+/).filter(Boolean) ?? [];
                          return ids.length > 0 && ids.every(isUuid)
                            ? Promise.resolve()
                            : Promise.reject(new Error(t("payroll.invalidIds")));
                        },
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="UUID 1, UUID 2, UUID 3..."
                    />
                  </Form.Item>
                </div>

                {/* Footer: Exactly 1 primary button, separate reset button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <Button onClick={() => form.resetFields()} disabled={actions.pending}>
                    {t("common.reset")}
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={actions.pending}
                    disabled={actions.pending}
                  >
                    {t("payroll.actions.calculate")}
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        open={Boolean(payload)}
        title={t("payroll.actions.calculate")}
        okText={t("actions.confirm")}
        cancelText={t("actions.cancel")}
        confirmLoading={actions.pending}
        cancelButtonProps={{ disabled: actions.pending }}
        maskClosable={!actions.pending}
        keyboard={!actions.pending}
        onCancel={() => {
          if (!actions.pending) setPayload(undefined);
        }}
        onOk={async () => {
          if (!payload) return;
          try {
            const run = await actions.execute({ action: "calculate", payload });
            if (run) {
              setPayload(undefined);
              form.resetFields();
              setIdempotencyKey(crypto.randomUUID());
              go(run.id);
            }
          } catch (error) {
            if (error instanceof ApiHttpError && error.errors) {
              applyBackendFieldErrors(
                {
                  setFields: (fields) =>
                    form.setFields(
                      fields.flatMap(({ name, errors }) =>
                        isFormField(name) ? [{ name, errors }] : []
                      )
                    ),
                  scrollToField: (name, options) => {
                    if (isFormField(name))
                      form.scrollToField(name, { behavior: "smooth", block: "center", ...options });
                  },
                },
                error.errors
              );
            }
            /* Preserve exact request and retry key; domain error stays visible. */
          }
        }}
      >
        <PayrollActionError error={actions.error} />
        <p>{t("payroll.confirmAction")}</p>
        <p>
          {payload?.currency} / {payload?.effectiveDate}
        </p>
      </Modal>
    </Space>
  );
}
