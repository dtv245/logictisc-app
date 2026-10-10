/** Creates a linked correction using explicit positive amounts and a stable idempotency key. */
import { Alert, Button, Form, Input, InputNumber, Modal, Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { ApiHttpError } from "@/providers/api/httpError";
import { UUID_PATTERN } from "@/utils/uuid";
import type { SettlementAdjustmentPayload } from "@/types/settlement.dto";
import type { UseSettlementActionsResult } from "./useSettlementActions";

const isAdjustmentField = (name: unknown): name is keyof AdjustmentForm =>
  typeof name === "string" && ["reason", "lineClass", "lineType", "description", "amount", "loadId", "tripId"].includes(name);
type AdjustmentForm = { reason: string } & SettlementAdjustmentPayload["lines"][number];
export function CreateAdjustmentModal({ actions, currency, onCreated }: {
  actions: UseSettlementActionsResult; currency: string; onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<AdjustmentForm>();
  // Keep the key and form on cancel/error so transport retries cannot create a second correction.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  if (!actions.canExecute("adjustments")) return null;
  return <>
    <Button disabled={actions.pending} onClick={() => setOpen(true)}>{t("settlements.workflow.adjustments")}</Button>
    <Modal open={open} title={t("settlements.workflow.adjustments")} okText={t("actions.confirm")} confirmLoading={actions.pending}
      cancelButtonProps={{ disabled: actions.pending }} maskClosable={!actions.pending} keyboard={!actions.pending}
      onCancel={() => { if (!actions.pending) setOpen(false); }} onOk={async () => {
        try {
          const values = await form.validateFields();
          const result = await actions.execute({ action: "adjustments", payload: { idempotencyKey, reason: values.reason.trim(), lines: [{
            lineClass: values.lineClass, lineType: values.lineType.trim(), description: values.description.trim(), amount: values.amount,
            ...(values.loadId ? { loadId: values.loadId.trim() } : {}), ...(values.tripId ? { tripId: values.tripId.trim() } : {}),
          }] } });
          if (result) { setOpen(false); form.resetFields(); setIdempotencyKey(crypto.randomUUID()); onCreated(result.id); }
        } catch (error) {
          if (error instanceof ApiHttpError && error.errors) applyBackendFieldErrors({
            setFields: (fields) => form.setFields(fields.flatMap(({ name, errors }) => isAdjustmentField(name) ? [{ name, errors }] : [])),
            scrollToField: (name, options) => { if (isAdjustmentField(name)) form.scrollToField(name, options); },
          }, error.errors, {
            "lines[0].lineClass": "lineClass", "lines[0].lineType": "lineType", "lines[0].description": "description", "lines[0].amount": "amount", "lines[0].loadId": "loadId", "lines[0].tripId": "tripId",
          });
          // Field validation stays inline; domain failures stay in SettlementActions, preserving inputs/key.
        }
      }}>
      <Alert type="info" showIcon message={t("settlements.workflow.correctionNotice")} description={currency} />
      <Form form={form} layout="vertical">
        <Form.Item name="reason" label={t("finance.reason")} rules={[{ required: true, whitespace: true, max: 300, message: t("settlements.workflow.reasonRequired") }]}><Input.TextArea maxLength={300} /></Form.Item>
        <Form.Item name="lineClass" label={t("settlements.workflow.lineClass")} rules={[{ required: true }]}><Select options={(["EARNING", "DEDUCTION", "REIMBURSEMENT"] as const).map((value) => ({ value, label: t(`settlements.workflow.lineClasses.${value}`) }))} /></Form.Item>
        <Form.Item name="lineType" label={t("settlements.workflow.lineType")} rules={[{ required: true, whitespace: true, max: 50 }]}><Input maxLength={50} /></Form.Item>
        <Form.Item name="description" label={t("settlements.workflow.description")} rules={[{ required: true, whitespace: true, max: 300 }]}><Input.TextArea maxLength={300} /></Form.Item>
        <Form.Item name="amount" label={`${t("loads.financial.amount")} (${currency})`} rules={[{ required: true }, { validator: (_, value: string | undefined) =>
          value && /^\d+(\.\d+)?$/.test(value) && /[1-9]/.test(value) ? Promise.resolve() : Promise.reject(new Error(t("settlements.workflow.positiveAmount"))) }]}><InputNumber stringMode min="0" style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="loadId" label={t("finance.loadId")} rules={[{ pattern: UUID_PATTERN, message: t("finance.invalidLoadId") }]}><Input /></Form.Item>
        <Form.Item name="tripId" label={t("settlements.workflow.trip")} rules={[{ pattern: UUID_PATTERN, message: t("settlements.workflow.invalidId") }]}><Input /></Form.Item>
      </Form>
    </Modal>
  </>;
}
