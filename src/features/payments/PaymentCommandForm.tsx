/** Pending Payment create/metadata/cancel UI, dormant until runtime authorization is verified. */
import { useCan, useDataProvider, useInvalidate, useOne } from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Space, Spin } from "antd";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResourceFormFields } from "@/components/resources/ResourceFormFields";
import { resourceFormDefinitions } from "@/components/resources/resourceForms";
import { ForbiddenState } from "@/components/ErrorStates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { normalizeHttpError, type ApiHttpError } from "@/providers/api/httpError";
import type { PaymentResponse } from "@/types/payment.dto";
import { createPaymentCommands, PAYMENT_COMMANDS_RUNTIME_VERIFIED, type PaymentCreateValues } from "./paymentCommands";

export function PaymentCommandForm({ action, id, runtimeVerified = PAYMENT_COMMANDS_RUNTIME_VERIFIED }: { action: "create" | "edit" | "cancel"; id?: string; runtimeVerified?: boolean }) {
  const { t } = useTranslation(); const provider = useDataProvider(); const invalidate = useInvalidate(); const client = useQueryClient();
  const { tenant } = useCurrentTenant(); const user = useCurrentUser();
  const access = useCan({ resource: "payments", action: action === "cancel" ? "PAYMENT_CANCEL" : action });
  const commands = useMemo(() => ({ scope: [tenant?.tenantKey, user.data?.id], command: createPaymentCommands(provider().custom!) }), [provider, tenant?.tenantKey, user.data?.id]).command;
  const [form] = Form.useForm<Record<string, unknown>>(); const flight = useRef(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState<ApiHttpError | null>(null); const [created, setCreated] = useState<PaymentResponse | null>(null);
  const allowed = runtimeVerified && Boolean(tenant?.tenantKey && user.data?.employeeId && access.data?.can);
  const query = useOne<PaymentResponse, ApiHttpError>({ resource: "payments", id: id ?? "", queryOptions: { enabled: allowed && action !== "create" && Boolean(id) } });
  if (!runtimeVerified) return <Alert type="warning" showIcon message={t("contractAlignment.runtimePending")} />;
  if (access.isLoading || user.isLoading) return <Spin />;
  if (!user.data?.employeeId) return <Alert type="warning" message={t("contractAlignment.employeeRequired")} />;
  if (!allowed) return <ForbiddenState />;
  if (action !== "create" && query.isLoading) return <Spin />;
  if (query.isError) return <Alert type="error" message={query.error.message} />;
  const payment = query.data?.data;
  if (action !== "create" && payment?.status?.toUpperCase() !== "PENDING") return <Alert type="warning" message={t("paymentCommands.pendingOnly")} />;
  const refreshEvidence = async (result?: PaymentResponse) => {
    await Promise.all([
      invalidate({ resource: "payments", invalidates: ["list", "detail"], ...(result?.id ? { id: result.id } : {}) }),
      ...(result?.invoiceId ? [invalidate({ resource: "invoices", invalidates: ["detail", "list"], id: result.invoiceId })] : []),
      client.invalidateQueries({ predicate: ({ queryKey }) => queryKey[1] === tenant?.tenantKey && ["customer-balance", "load-finance", "profitability"].includes(String(queryKey[0])), refetchType: "active" }),
    ]);
  };
  const submit = async () => {
    if (flight.current) return;
    flight.current = true; setPending(true); setError(null);
    try {
      const values = await form.validateFields();
      const result = action === "create" ? commands.hasCreateIntent() ? await commands.retryCreate() : await commands.create(values as PaymentCreateValues)
        : action === "edit" ? await commands.update(id!, values) : await commands.cancel(id!, String(values.reason ?? ""));
      setCreated(result); await refreshEvidence(result);
    } catch (cause) {
      const failure = normalizeHttpError(cause); setError(failure); applyBackendFieldErrors(form, failure.errors ?? {});
      if ([409, 422].includes(failure.statusCode)) await refreshEvidence(payment);
    } finally { flight.current = false; setPending(false); }
  };
  const frozen = action === "create" && commands.hasCreateIntent() && !commands.isCreateResolved();
  return <Space direction="vertical" style={{ width: "100%" }}>
    <Alert type="info" message={t("paymentCommands.pendingHelp")} />
    {error && <Alert type="error" showIcon message={t(`contractErrors.${error.code}`, { defaultValue: error.message })} description={error.requestId ?? undefined} />}
    {commands.canReviseCreate() && <Button onClick={() => { commands.reviseRejectedCreate(); setError(null); }}>{t("paymentCommands.correctRejected")}</Button>}
    {frozen && <Alert type="warning" message={t("paymentCommands.frozenRetry")} />}
    {created ? <Alert type="success" message={t("paymentCommands.saved")} description={`${created.id} / ${t(`forms.options.${created.status}`, { defaultValue: created.status })}`} /> :
      <Form form={form} layout="vertical" disabled={pending || frozen} initialValues={action === "edit" ? { description: payment?.description, referenceNumber: payment?.referenceNumber } : undefined}>
        {action === "create" ? <ResourceFormFields columns={2} definition={resourceFormDefinitions.payments} /> : action === "edit" ? <>
          <Form.Item name="description" label={t("forms.fields.description")}><Input.TextArea /></Form.Item>
          <Form.Item name="referenceNumber" label={t("forms.fields.referenceNumber")}><Input /></Form.Item>
          <Button onClick={() => form.setFieldValue("description", null)}>{t("paymentCommands.clearDescription")}</Button>
        </> : <Form.Item name="reason" label={t("finance.reason")} rules={[{ required: true, whitespace: true, max: 1000 }]}><Input.TextArea maxLength={1000} /></Form.Item>}
      </Form>}
    {!created && <Button type="primary" loading={pending} disabled={pending} onClick={() => void submit()}>{t(frozen ? "actions.retry" : action === "cancel" ? "actions.confirm" : "actions.save")}</Button>}
  </Space>;
}
