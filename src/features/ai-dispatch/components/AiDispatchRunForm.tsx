/**
 * Form khởi chạy AI Dispatch với đúng các trường được gửi tới API hiện tại.
 */
import { Alert, Button, Card, Form, Input, Select, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { FormGrid } from "@/forms/FormGrid";
import { useTmsLoads } from "@/hooks/tms-flow/useTmsQueries";
import type {
  AiMovementPlan,
  CreateAiDispatchParams,
} from "@/types/ai-dispatch/ai-dispatch.types";
import type { AiDispatchActionsResult } from "../hooks/useAiDispatchActions";

interface RunFormValues {
  mode: "assisted" | "automatic";
  instructions?: string;
  loadId: string;
}

export function AiDispatchRunForm({
  actions,
  onPlanCreated,
}: {
  actions: AiDispatchActionsResult;
  onPlanCreated?: (plan: AiMovementPlan) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<RunFormValues>();
  const loads = useTmsLoads();
  const availableLoads = (loads.data?.shipments ?? []).filter(
    (load) => load.status !== "delivered" && load.status !== "cancelled",
  );

  const onFinish = async (values: RunFormValues) => {
    const params: CreateAiDispatchParams = {
      mode: values.mode,
      instructions: values.instructions?.trim(),
      loadId: values.loadId.trim(),
    };

    try {
      const plan = await actions.runAiDispatch(params);
      if (plan) onPlanCreated?.(plan);
    } catch {
      // Keep the form values in place; the action hook reports the API error.
    }
  };

  return (
    <Card bordered className="ai-run-form-card" style={{ width: "100%", maxWidth: "100%" }}>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ block: "center" }}
        initialValues={{ mode: "assisted" }}
        onFinish={onFinish}
        disabled={actions.pending}
      >
        {loads.isError && (
          <Alert
            type="error"
            showIcon
            message={t("queryError.title")}
            description={loads.error instanceof Error ? loads.error.message : t("queryError.description")}
            style={{ marginBottom: 20 }}
          />
        )}
        {!actions.canRun && (
          <Alert
            type="warning"
            showIcon
            message={t("forbidden.title")}
            description={t("forbidden.description")}
            style={{ marginBottom: 20 }}
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("aiDispatch.requestSection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("aiDispatch.requestSectionHelp")}
          </Typography.Paragraph>

          <FormGrid
            columns={2}
            items={[
              {
                key: "mode",
                node: (
                  <Form.Item
                    name="mode"
                    label={t("aiDispatch.mode")}
                    rules={[{ required: true }]}
                    extra={t("aiDispatch.modeAutomaticUnavailable")}
                  >
                    <Select
                      options={[
                        { value: "assisted", label: t("aiDispatch.modeAssisted") },
                        {
                          value: "automatic",
                          label: t("aiDispatch.modeAutomatic"),
                          disabled: true,
                        },
                      ]}
                    />
                  </Form.Item>
                ),
              },
              {
                key: "loadId",
                node: (
                  <Form.Item
                    name="loadId"
                    label={t("aiDispatch.loadId")}
                    rules={[{ required: true }]}
                    extra={loads.isLoading ? t("aiDispatch.loadsLoading") : undefined}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      loading={loads.isLoading}
                      disabled={loads.isError || availableLoads.length === 0}
                      placeholder={t("aiDispatch.loadIdPlaceholder")}
                      options={availableLoads.map((load) => ({
                        value: load.id,
                        label: `#${load.number} · ${load.name} · ${load.originCity} → ${load.destinationCity}`,
                      }))}
                      notFoundContent={loads.isLoading ? undefined : t("aiDispatch.noAvailableLoads")}
                    />
                  </Form.Item>
                ),
              },
              {
                key: "instructions",
                fullWidth: true,
                node: (
                  <Form.Item name="instructions" label={t("aiDispatch.instructions")}>
                    <Input.TextArea
                      rows={3}
                      placeholder={t("aiDispatch.instructionsPlaceholder")}
                    />
                  </Form.Item>
                ),
              },
            ]}
          />
        </div>

        <div className="ai-run-form__footer">
          <Button
            className="ai-run-form__btn"
            onClick={() => form.resetFields()}
            disabled={actions.pending}
          >
            {t("common.reset")}
          </Button>
          <Button
            className="ai-run-form__btn"
            type="primary"
            htmlType="submit"
            loading={actions.pending}
            disabled={!actions.canRun}
          >
            {t("aiDispatch.generatePlan")}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
