import { toWireDecimal } from "@/providers/api/decimal";
/** Accounting supplies an explicit tax decision for a server-accepted snapshot; no local financial calculation. */
import { useCan, useDataProvider } from "@refinedev/core";
import { Alert, Button, Form, Input, InputNumber, Select, Space } from "antd";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { normalizeHttpError, type ApiHttpError } from "@/providers/api/httpError";
import type { AcceptedRatingSnapshot, BillingInvoice, GenerateInvoiceRequest, LineTax } from "@/types/handoff.generated";
import { createInvoiceCommand, createPrimaryInvoice, BILLING_COMMANDS_RUNTIME_VERIFIED } from "./billingCommands";

type Values = Record<string, unknown> & { requirement: string; reasonCode: string; reason: string; sourceReference: string; assessmentId?: string; lineTaxes: { componentType: string; sourceId: string; taxAmount: string | number }[] };
function readLineTaxes(rows: Values["lineTaxes"]): LineTax[] {
  if (!Array.isArray(rows)) throw new Error("INVOICE_LINE_TAX_INVALID");
  return rows.map((row) => ({ componentType: row.componentType, sourceId: row.sourceId, taxAmount: toWireDecimal(row.taxAmount) }));
}
export function PrimaryInvoiceForm({ accepted, runtimeVerified = BILLING_COMMANDS_RUNTIME_VERIFIED }: { accepted: AcceptedRatingSnapshot; runtimeVerified?: boolean }) {
  const { t } = useTranslation(); const provider = useDataProvider(); const user = useCurrentUser(); const { tenant } = useCurrentTenant(); const client = useQueryClient();
  const generateAccess = useCan({ resource: "invoices", action: "BILLING_GENERATE" }); const issueAccess = useCan({ resource: "invoices", action: "BILLING_ISSUE" });
  const intent = useMemo(() => ({ scope: [tenant?.tenantKey, user.data?.id], command: createPrimaryInvoice(provider().custom!, accepted) }), [provider, accepted, tenant?.tenantKey, user.data?.id]).command;
  const [key] = useState(() => crypto.randomUUID()); const [issueKey] = useState(() => crypto.randomUUID()); const [invoice, setInvoice] = useState<BillingInvoice | null>(null);
  const issueIntent = useMemo(() => ({ scope: [tenant?.tenantKey, user.data?.id], command: createInvoiceCommand(provider().custom!, invoice?.invoiceId ?? "") }), [provider, invoice?.invoiceId, tenant?.tenantKey, user.data?.id]).command;
  const [form] = Form.useForm<Values>(); const requirement = Form.useWatch("requirement", form);
  const [pending, setPending] = useState(false); const [frozen, setFrozen] = useState<GenerateInvoiceRequest | null>(null); const [error, setError] = useState<ApiHttpError | null>(null);
  if (!runtimeVerified) return null;
  const refresh = () => client.invalidateQueries({ predicate: ({ queryKey }) => queryKey[1] === tenant?.tenantKey && ["billing", "load-finance", "profitability", "settlements", "customer-balance"].includes(String(queryKey[0])), refetchType: "active" });
  const generate = async () => {
    if (!generateAccess.data?.can || !user.data?.employeeId) return;
    setPending(true); setError(null);
    try {
      const values = frozen ? null : await form.validateFields();
      const payload = frozen ?? { idempotencyKey: key, snapshotId: accepted.snapshotId!, taxDecision: { requirement: values!.requirement, reasonCode: values!.reasonCode, reason: values!.reason, sourceReference: values!.sourceReference, ...(values!.assessmentId ? { assessmentId: values!.assessmentId } : {}) }, lineTaxes: readLineTaxes(values!.lineTaxes) };
      setFrozen(payload); setInvoice(await intent.execute(payload)); await refresh();
    } catch (cause) {
      const failure = normalizeHttpError(cause); setError(failure);
      const mapped = Object.fromEntries(Object.entries(failure.errors ?? {}).map(([field, messages]) => [field.replace(/^taxDecision\./, ""), messages]));
      applyBackendFieldErrors(form, mapped);
    } finally { setPending(false); }
  };
  const issue = async () => {
    if (!issueAccess.data?.can || !user.data?.employeeId || invoice?.status !== "DRAFT") return;
    setPending(true); setError(null);
    try { setInvoice(await issueIntent.execute({ action: "issue", payload: { idempotencyKey: issueKey } })); await refresh(); }
    catch (cause) { setError(normalizeHttpError(cause)); } finally { setPending(false); }
  };
  return <Space direction="vertical" style={{ width: "100%" }}>{error && <Alert type="error" message={error.message} description={error.requestId ?? undefined} />}
    {intent.canRevise() && <Button onClick={() => { intent.reviseRejected(); setFrozen(null); setError(null); }}>{t("paymentCommands.correctRejected")}</Button>}
    {invoice ? <><Alert type="success" message={invoice.invoiceId} description={invoice.status} /><Button loading={pending} disabled={pending || invoice.status !== "DRAFT" || !issueAccess.data?.can} onClick={() => void issue()}>{t("billingCommands.issue")}</Button></> : <>
      <Form form={form} disabled={pending || Boolean(frozen)} layout="vertical" initialValues={{ lineTaxes: [] }}>
        <Form.Item name="requirement" label={t("billingCommands.taxRequirement")} rules={[{ required: true }]}><Select options={["REQUIRED", "NOT_REQUIRED"].map((value) => ({ value, label: t(`finance.availability.${value}`, { defaultValue: value }) }))} /></Form.Item>
        {(["reasonCode", "reason", "sourceReference", "assessmentId"] as const).map((name) => <Form.Item key={name} name={name} label={t(`billingCommands.${name}`)} rules={[{ required: name !== "assessmentId" || requirement === "REQUIRED", whitespace: true }]}><Input.TextArea /></Form.Item>)}
        <Form.List name="lineTaxes">{(fields, { add, remove }) => <Space direction="vertical">
          {fields.map(({ key, name }) => <Space key={key} align="start">
            <Form.Item name={[name, "componentType"]} label={t("billingCommands.componentType")} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name={[name, "sourceId"]} label={t("billingCommands.sourceId")} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name={[name, "taxAmount"]} label={t("billingCommands.taxAmount")} rules={[{ required: true }]}><InputNumber stringMode min="0" /></Form.Item>
            <Button onClick={() => remove(name)}>{t("billingCommands.removeTaxLine")}</Button>
          </Space>)}
          <Button onClick={() => add()}>{t("billingCommands.addTaxLine")}</Button>
        </Space>}</Form.List>
      </Form><Button disabled={pending || !generateAccess.data?.can || !user.data?.employeeId} loading={pending} onClick={() => void generate()}>{t(frozen ? "actions.retry" : "billingCommands.generate")}</Button>
    </>}
  </Space>;
}
