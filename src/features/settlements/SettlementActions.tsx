/** Only confirmed state transitions are available; consequential commands require confirmation. */
import { Alert, Button, Form, Input, Modal, Space } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { ApiHttpError } from "@/providers/api/httpError";
import type { UseSettlementActionsResult } from "./useSettlementActions";

export function SettlementActions({ actions }: { actions: UseSettlementActionsResult }) {
  const { t } = useTranslation();
  const [validationOpen, setValidationOpen] = useState(false);
  const [form] = Form.useForm<{ reason: string }>();
  return <Space direction="vertical" style={{ width: "100%" }}>
    {actions.error && <Alert type="error" showIcon message={actions.error instanceof ApiHttpError ? t(`settlements.workflow.errors.${actions.error.code}`, { defaultValue: actions.error.message }) : actions.error.message}
      description={actions.error instanceof ApiHttpError ? `${actions.error.code}${actions.error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${actions.error.requestId}` : ""}` : undefined} />}
    <Space wrap>
      {(["submitReview", "approve", "lock", "resolveValidation"] as const).map((action) => actions.canExecute(action) &&
        <ConfirmActionModal key={action} disabled={actions.pending} title={t(`settlements.workflow.${action}`)}
          triggerLabel={t(`settlements.workflow.${action}`)} triggerAriaLabel={t(`settlements.workflow.${action}`)}
          description={t("settlements.workflow.confirmAction")} onConfirm={async () => { await actions.execute({ action }); }} />)}
      {actions.canExecute("requireValidation") && <Button disabled={actions.pending} onClick={() => setValidationOpen(true)}>{t("settlements.workflow.requireValidation")}</Button>}
    </Space>
    {validationOpen && <Modal open title={t("settlements.workflow.requireValidation")} onCancel={() => { if (!actions.pending) setValidationOpen(false); }}
      confirmLoading={actions.pending} cancelButtonProps={{ disabled: actions.pending }} maskClosable={!actions.pending} keyboard={!actions.pending}
      okText={t("actions.confirm")} onOk={async () => {
        try { const values = await form.validateFields(); await actions.execute({ action: "requireValidation", payload: { reason: values.reason.trim() } }); form.resetFields(); setValidationOpen(false); }
        catch { /* Domain error remains visible; preserve the user's input for correction. */ }
      }}>
      <Form form={form} layout="vertical"><Form.Item label={t("finance.reason")} name="reason" rules={[{ required: true, whitespace: true, max: 1000, message: t("settlements.workflow.reasonRequired") }]}>
        <Input.TextArea maxLength={1000} /></Form.Item></Form>
    </Modal>}
  </Space>;
}
