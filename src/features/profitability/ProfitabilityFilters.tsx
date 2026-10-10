/** Sends only the supported loadId filter after UUID validation; no speculative server parameters. */
import { Button, Form, Input, Space } from "antd";
import { useTranslation } from "react-i18next";
import { UUID_PATTERN } from "@/utils/uuid";

export interface ProfitabilityFilterValues { loadId?: string; }

export function ProfitabilityFilters({ onApply }: { onApply: (values: ProfitabilityFilterValues) => void }) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProfitabilityFilterValues>();
  return <Form form={form} layout="vertical" onFinish={(values) => onApply({ loadId: values.loadId?.trim() || undefined })}>
    <Space wrap align="start">
      <Form.Item name="loadId" label={t("finance.loadId")} rules={[{ pattern: UUID_PATTERN, message: t("finance.invalidLoadId"), whitespace: false }]}>
        <Input placeholder={t("finance.loadIdPlaceholder")} allowClear />
      </Form.Item>
      <Form.Item label=" "><Space wrap>
        <Button htmlType="submit" type="primary">{t("finance.apply")}</Button>
        <Button onClick={() => { form.resetFields(); onApply({}); }}>{t("finance.reset")}</Button>
      </Space></Form.Item>
    </Space>
  </Form>;
}
