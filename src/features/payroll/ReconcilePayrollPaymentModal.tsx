/** Resolves an explicit backend case using attested bank evidence, never a mark-paid toggle. */
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import type { Dayjs } from "dayjs";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { ApiHttpError } from "@/providers/api/httpError";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PayrollReconciliationCase, ReconcileBankPayload } from "@/types/payroll.dto";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { PayrollActionError } from "./PayrollActions";
import type { PayrollPaymentActionsResult } from "./usePayrollPaymentActions";
type EvidenceForm = Omit<ReconcileBankPayload, "idempotencyKey" | "caseEventId" | "occurredAt"> & { occurredAt: Dayjs };
const isFormField = (name: unknown): name is keyof EvidenceForm => typeof name === "string" && ["bankSource", "transactionReference", "amount", "currency", "outcome", "counterpartyReference", "evidenceReference", "reason", "occurredAt"].includes(name);
export function ReconcilePayrollPaymentModal({ evidenceCase, actions }: { evidenceCase: PayrollReconciliationCase; actions: PayrollPaymentActionsResult }) {
  const { t, i18n } = useTranslation(); const [open, setOpen] = useState(false); const [form] = Form.useForm<EvidenceForm>(); const [key, setKey] = useState(() => crypto.randomUUID());
  if (!actions.canReconcile) return null;
  return <><Button disabled={actions.pending} onClick={() => setOpen(true)}>{t("payroll.reconcileEvidence")}</Button>
    <Modal open={open} title={t("payroll.reconcileEvidence")} okText={t("actions.confirm")} confirmLoading={actions.pending} width={640}
      cancelButtonProps={{ disabled: actions.pending }} maskClosable={!actions.pending} keyboard={!actions.pending} onCancel={() => { if (!actions.pending) setOpen(false); }} onOk={async () => {
        try { const values = await form.validateFields(); const result = await actions.execute({ action: "reconcile", paymentId: evidenceCase.paymentId, payload: {
          idempotencyKey: key, caseEventId: evidenceCase.caseEventId, bankSource: values.bankSource.trim(), transactionReference: values.transactionReference.trim(),
          amount: values.amount, currency: values.currency.trim().toUpperCase(), outcome: values.outcome, counterpartyReference: values.counterpartyReference.trim(),
          evidenceReference: values.evidenceReference.trim(), reason: values.reason.trim(), occurredAt: values.occurredAt.toISOString(),
        } }); if (result) { setOpen(false); form.resetFields(); setKey(crypto.randomUUID()); } } catch (error) {
          if (error instanceof ApiHttpError && error.errors) applyBackendFieldErrors({
            setFields: (fields) => form.setFields(fields.flatMap(({ name, errors }) => isFormField(name) ? [{ name, errors }] : [])),
            scrollToField: (name, options) => { if (isFormField(name)) form.scrollToField(name, options); },
          }, error.errors);
          /* Preserve evidence/replay key; show normalized workflow error. */
        }
      }}>
      <Alert type="warning" showIcon message={t("payroll.reconcileConfirm")} description={financialAmount(evidenceCase.amount, evidenceCase.currency, i18n.language)} />
      <PayrollActionError error={actions.error} />
      <Form form={form} layout="vertical">
        {(["bankSource", "transactionReference", "counterpartyReference", "evidenceReference", "reason"] as const).map((name) => <Form.Item key={name} name={name} label={t(`payroll.${name}`)} rules={[{ required: true, whitespace: true, max: name === "bankSource" ? 100 : ["evidenceReference", "reason"].includes(name) ? 500 : 200 }]}>
          {name === "counterpartyReference" ? <Input.Password autoComplete="off" /> : <Input />}
        </Form.Item>)}
        <Form.Item name="amount" label={t("loads.financial.amount")} rules={[{ required: true }]}><InputNumber min="0" stringMode style={{ width: "100%" }} /></Form.Item>
        <Form.Item name="currency" label={t("finance.currency")} rules={[{ required: true }, { pattern: /^[A-Za-z]{3}$/, message: t("payroll.invalidCurrency") }]}><Input maxLength={3} /></Form.Item>
        <Form.Item name="outcome" label={t("payroll.bankOutcome")} rules={[{ required: true }]}><Select options={["SUCCEEDED", "FAILED"].map((value) => ({ value, label: t(`payroll.paymentStates.${value}`) }))} /></Form.Item>
        <Form.Item name="occurredAt" label={t("payroll.occurredAt")} rules={[{ required: true }]}><DatePicker showTime style={{ width: "100%" }} /></Form.Item>
      </Form>
    </Modal></>;
}
