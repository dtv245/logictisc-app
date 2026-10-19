/**
 * Form khởi chạy AI điều phối xe, chia 2 section, chuẩn hóa 8 tiêu chí kiểm tra trước khi merge.
 */
import { Button, Card, DatePicker, Form, Input, Select, Typography } from "antd";
import type { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import { FormGrid } from "@/forms/FormGrid";
import { isUuid } from "@/utils/uuid";
import type { CreateAiDispatchParams } from "@/features/ai-dispatch/types/ai-dispatch.types";
import { useAiSettings } from "../hooks/aiConfigStorage";
import type { AiDispatchActionsResult } from "../hooks/useAiDispatchActions";

interface RunFormValues {
  mode: "manual" | "assisted" | "automatic";
  objective: string;
  modelUsed: string;
  departureTime?: Dayjs;
  instructions?: string;
  truckId: string;
  loadId: string;
  businessZoneId: string;
}

export function AiDispatchRunForm({
  actions,
  onPlanCreated,
  onOpenConfig,
}: {
  actions: AiDispatchActionsResult;
  onPlanCreated?: () => void;
  onOpenConfig?: () => void;
}) {
  const { t } = useTranslation();
  const { activeProviderConfig } = useAiSettings();
  const [form] = Form.useForm<RunFormValues>();

  const onFinish = async (values: RunFormValues) => {
    const params: CreateAiDispatchParams = {
      mode: values.mode,
      objective: values.objective,
      modelUsed: values.modelUsed,
      departureTime: values.departureTime?.toISOString(),
      instructions: values.instructions?.trim(),
      truckId: values.truckId.trim(),
      loadId: values.loadId.trim(),
      businessZoneId: values.businessZoneId.trim(),
    };

    await actions.runAiDispatch(params);
    onPlanCreated?.();
  };

  return (
    <Card bordered className="ai-run-form-card" style={{ width: "100%", maxWidth: "100%" }}>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ behavior: "smooth", block: "center" }}
        initialValues={{
          mode: "assisted",
          objective: "minimize_deadhead",
          modelUsed: "LogisticsX Neural Dispatcher v2",
          businessZoneId: "Asia/Ho_Chi_Minh",
        }}
        onFinish={onFinish}
        disabled={actions.pending}
      >
        {/* Section 1: Mục tiêu tối ưu & Chỉ đạo AI (5 ô nhập <= 7) */}
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("aiDispatch.objectiveSection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("aiDispatch.objectiveSectionHelp")}
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
                  >
                    <Select
                      options={[
                        { value: "assisted", label: t("aiDispatch.modeAssisted") },
                        { value: "automatic", label: t("aiDispatch.modeAutomatic") },
                        { value: "manual", label: t("aiDispatch.modeManual") },
                      ]}
                    />
                  </Form.Item>
                ),
              },
              {
                key: "objective",
                node: (
                  <Form.Item
                    name="objective"
                    label={t("aiDispatch.objective")}
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={[
                        { value: "minimize_deadhead", label: t("aiDispatch.objectiveDeadhead") },
                        { value: "fastest_eta", label: t("aiDispatch.objectiveFastest") },
                        { value: "hos_compliance", label: t("aiDispatch.objectiveHos") },
                      ]}
                    />
                  </Form.Item>
                ),
              },
              {
                key: "modelUsed",
                node: (
                  <Form.Item
                    name="modelUsed"
                    label={t("aiDispatch.model")}
                    rules={[{ required: true }]}
                    extra={
                      onOpenConfig ? (
                        <div style={{ marginTop: 4 }}>
                          <Button
                            type="link"
                            size="small"
                            onClick={onOpenConfig}
                            style={{ padding: 0, whiteSpace: "normal", textAlign: "left", height: "auto" }}
                            data-testid="link-quick-ai-config"
                          >
                            {t("aiDispatch.quickConfigLink")} ({activeProviderConfig.name}: {activeProviderConfig.model})
                          </Button>
                        </div>
                      ) : undefined
                    }
                  >
                    <Select
                      options={[
                        { value: "LogisticsX Neural Dispatcher v2", label: t("aiDispatch.modelNeural") },
                        { value: "Gemini 2.5 Pro Logistics", label: t("aiDispatch.modelGemini") },
                        { value: "Claude 3.7 Sonnet Dispatcher", label: t("aiDispatch.modelClaude") },
                        ...(activeProviderConfig.model &&
                        !["LogisticsX Neural Dispatcher v2", "Gemini 2.5 Pro Logistics", "Claude 3.7 Sonnet Dispatcher"].includes(activeProviderConfig.model)
                          ? [
                              {
                                value: activeProviderConfig.model,
                                label: `${activeProviderConfig.name} - ${activeProviderConfig.model}`,
                              },
                            ]
                          : []),
                      ]}
                    />
                  </Form.Item>
                ),
              },
              {
                key: "departureTime",
                node: (
                  <Form.Item
                    name="departureTime"
                    label={t("aiDispatch.departureTime")}
                  >
                    <DatePicker showTime style={{ width: "100%" }} />
                  </Form.Item>
                ),
              },
              {
                key: "instructions",
                fullWidth: true,
                node: (
                  <Form.Item
                    name="instructions"
                    label={t("aiDispatch.instructions")}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder={t("aiDispatch.instructionsPlaceholder")}
                    />
                  </Form.Item>
                ),
              },
            ]}
          />
        </div>

        {/* Section 2: Phạm vi xe & Đơn hàng cần ghép (3 ô nhập <= 7) */}
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("aiDispatch.scopeSection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("aiDispatch.scopeSectionHelp")}
          </Typography.Paragraph>

          <FormGrid
            columns={2}
            items={[
              {
                key: "truckId",
                node: (
                  <Form.Item
                    name="truckId"
                    label={t("aiDispatch.truckId")}
                    rules={[
                      { required: true },
                      {
                        validator: async (_, value: string | undefined) => {
                          if (!isUuid(value?.trim())) throw new Error(t("aiDispatch.invalidUuid"));
                        },
                      },
                    ]}
                  >
                    <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </Form.Item>
                ),
              },
              {
                key: "loadId",
                node: (
                  <Form.Item
                    name="loadId"
                    label={t("aiDispatch.loadId")}
                    rules={[
                      { required: true },
                      {
                        validator: async (_, value: string | undefined) => {
                          if (!isUuid(value?.trim())) throw new Error(t("aiDispatch.invalidUuid"));
                        },
                      },
                    ]}
                  >
                    <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </Form.Item>
                ),
              },
              {
                key: "businessZoneId",
                fullWidth: true,
                node: (
                  <Form.Item
                    name="businessZoneId"
                    label={t("aiDispatch.businessZoneId")}
                    rules={[
                      { required: true, whitespace: true },
                      {
                        validator: async (_, value: string | undefined) => {
                          try {
                            if (!value?.trim()) throw new Error();
                            new Intl.DateTimeFormat("en", { timeZone: value.trim() });
                          } catch {
                            throw new Error(t("aiDispatch.invalidZone"));
                          }
                        },
                      },
                    ]}
                  >
                    <Input placeholder="Asia/Ho_Chi_Minh" />
                  </Form.Item>
                ),
              },
            ]}
          />
        </div>

        {/* Footer: Đúng 1 nút primary, nút reset nằm tách riêng */}
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
          >
            {t("aiDispatch.generatePlan")}
          </Button>
        </div>
      </Form>
    </Card>
  );
}
