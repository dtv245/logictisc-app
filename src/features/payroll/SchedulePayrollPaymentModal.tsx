/** Schedules a server-owned net amount using explicit configured provider references. */
import { Alert, Button, Form, Input, Modal, Select } from "antd";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { ApiHttpError } from "@/providers/api/httpError";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PayrollItem, SchedulePayrollPaymentPayload } from "@/types/payroll.dto";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { PayrollActionError } from "./PayrollActions";
import type { PayrollPaymentActionsResult } from "./usePayrollPaymentActions";
type PaymentForm = Omit<SchedulePayrollPaymentPayload, "idempotencyKey">;
const isFormField = (name: unknown): name is keyof PaymentForm => typeof name === "string" && ["paymentMethod", "providerKey", "destinationReference"].includes(name);
export function SchedulePayrollPaymentModal({ item, actions, retry }: { item: PayrollItem; actions: PayrollPaymentActionsResult; retry: boolean }) {
  const { t, i18n } = useTranslation(); const [open, setOpen] = useState(false); const [form] = Form.useForm<PaymentForm>();
  const [key, setKey] = useState(() => crypto.randomUUID()); const method = Form.useWatch("paymentMethod", form);
  if (!actions.canSchedule) return null;
  return <><Button disabled={actions.pending} onClick={() => setOpen(true)}>{t(retry ? "payroll.retryPayment" : "payroll.schedulePayment")}</Button>
    <Modal open={open} title={t(retry ? "payroll.retryPayment" : "payroll.schedulePayment")} okText={t("actions.confirm")} confirmLoading={actions.pending}
      cancelButtonProps={{ disabled: actions.pending }} maskClosable={!actions.pending} keyboard={!actions.pending} onCancel={() => { if (!actions.pending) setOpen(false); }} onOk={async () => {
        try { const values = await form.validateFields(); const result = await actions.execute({ action: "schedule", itemId: item.id, payload: { idempotencyKey: key, paymentMethod: values.paymentMethod,
          providerKey: values.providerKey.trim(), ...(values.destinationReference?.trim() ? { destinationReference: values.destinationReference.trim() } : {}) } });
          if (result) { setOpen(false); form.resetFields(); setKey(crypto.randomUUID()); }
        } catch (error) {
          if (error instanceof ApiHttpError && error.errors) applyBackendFieldErrors({
            setFields: (fields) => form.setFields(fields.flatMap(({ name, errors }) => isFormField(name) ? [{ name, errors }] : [])),
            scrollToField: (name, options) => { if (isFormField(name)) form.scrollToField(name, options); },
          }, error.errors);
          /* Server error remains visible; retain exact replay identity and user input. */
        }
      }}>
      <Alert type="info" showIcon message={financialAmount(item.netAmount, item.currency, i18n.language)} description={t("payroll.paymentConfirm")} />
      <PayrollActionError error={actions.error} />
      <Form form={form} layout="vertical">
        <Form.Item name="paymentMethod" label={t("payroll.paymentMethod")} rules={[{ required: true }]}><Select options={[{ value: "BANK_TRANSFER", label: t("payroll.bankTransfer") }, { value: "STRIPE", label: t("payroll.stripe") }]} /></Form.Item>
        <Form.Item name="providerKey" label={t("payroll.provider")} rules={[{ required: true, whitespace: true, max: 100 }]}><Input maxLength={100} /></Form.Item>
        <Form.Item name="destinationReference" label={t("payroll.destination")} rules={[{ required: method === "BANK_TRANSFER", whitespace: true, max: 200 }]}><Input.Password autoComplete="off" maxLength={200} /></Form.Item>
      </Form>
    </Modal></>;
}
