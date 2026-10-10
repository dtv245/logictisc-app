import { pickupBusinessDateApi, PICKUP_BUSINESS_DATE_RUNTIME_VERIFIED } from "./pickupBusinessDate.api";
/** Audited LocalDate correction is independent of appointment instants and generic PUT versioning. */
import { useCan, useCustomMutation, useDataProvider, useInvalidate } from "@refinedev/core";
import { Alert, Button, Form, Input, Space } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { applyBackendFieldErrors, type FormFieldName } from "@/forms/backendFieldErrors";
import { normalizeHttpError, type ApiHttpError } from "@/providers/api/httpError";
import type { Load } from "@/types/load.types";

type Values = { requestedPickupBusinessDate: string; reasonCode: string; reason: string; source: string };
const isField = (name: FormFieldName): name is keyof Values => typeof name === "string" && ["requestedPickupBusinessDate", "reasonCode", "reason", "source"].includes(name);
export function PickupBusinessDateForm({ load, runtimeVerified = PICKUP_BUSINESS_DATE_RUNTIME_VERIFIED }: { load: Load; runtimeVerified?: boolean }) {
  const { t } = useTranslation(); const user = useCurrentUser(); const access = useCan({ resource: "loads", action: "PICKUP_BUSINESS_DATE" });
  const invalidate = useInvalidate(); const provider = useDataProvider(); const mutation = useCustomMutation<Load, ApiHttpError>();
  const [form] = Form.useForm<Values>(); const original = useRef(load.pickupBusinessDateChangeId ?? null); const flight = useRef(false);
  const [error, setError] = useState<ApiHttpError | null>(null); const [server, setServer] = useState<Load | null>(null);
  if (!runtimeVerified || !access.data?.can || !user.data?.employeeId) return null;
  const submit = async (values: Values) => {
    if (flight.current) return;
    flight.current = true; setError(null);
    try {
      const result = await mutation.mutateAsync({ url: pickupBusinessDateApi(load.id), method: "post", values: {
        requestedPickupBusinessDate: values.requestedPickupBusinessDate,
        expectedChangeId: original.current,
        provenance: { reasonCode: values.reasonCode, reason: values.reason, source: values.source },
      }, errorNotification: false });
      original.current = result.data.pickupBusinessDateChangeId ?? null;
      form.resetFields(); await invalidate({ resource: "loads", id: load.id, invalidates: ["detail", "list"] });
    } catch (cause) { const failure = normalizeHttpError(cause); setError(failure); applyBackendFieldErrors({ setFields: (fields) => form.setFields(fields.flatMap(({ name, errors }) => isField(name) ? [{ name, errors }] : [])), scrollToField: (name, options) => { if (isField(name)) form.scrollToField(name, options); } }, failure.errors ?? {}, { "provenance.reasonCode": "reasonCode", "provenance.reason": "reason", "provenance.source": "source" }); }
    finally { flight.current = false; }
  };
  const compare = async () => {
    try { setServer((await provider().getOne<Load>({ resource: "loads", id: load.id })).data); }
    catch (cause) { setError(normalizeHttpError(cause)); }
  };
  return <Space direction="vertical" style={{ width: "100%" }}>
    {error && <Alert type="error" message={t(`contractErrors.${error.code}`, { defaultValue: error.message })} />}
    {error?.statusCode === 409 && <Button onClick={() => void compare()}>{t("contractAlignment.compareServer")}</Button>}
    {server && <Alert type="info" message={server.requestedPickupBusinessDate ?? "—"} action={<Button onClick={() => {
      original.current = server.pickupBusinessDateChangeId ?? null; form.resetFields(); form.setFieldValue("requestedPickupBusinessDate", server.requestedPickupBusinessDate); setError(null); setServer(null);
    }}>{t("contractAlignment.useServer")}</Button>} />}
    <Form form={form} layout="vertical" disabled={mutation.isLoading} initialValues={{ requestedPickupBusinessDate: load.requestedPickupBusinessDate }} onFinish={(values) => void submit(values)}>
      <Form.Item name="requestedPickupBusinessDate" label={t("pickupBusinessDate.date")} rules={[{ required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ }]}><Input type="date" /></Form.Item>
      {(["reasonCode", "reason", "source"] as const).map((name) => <Form.Item key={name} name={name} label={t(name === "source" ? "pickupBusinessDate.source" : `billingCommands.${name}`)} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>)}
      <Button htmlType="submit" type="primary" loading={mutation.isLoading} disabled={mutation.isLoading}>{t("pickupBusinessDate.save")}</Button>
    </Form>
  </Space>;
}
