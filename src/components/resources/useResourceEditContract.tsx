/** Keeps a form draft and its read version stable while allowing an explicit conflict comparison. */
import { useDataProvider } from "@refinedev/core";
import { Alert, Button, Descriptions, Space } from "antd";
import type { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ApiError } from "@/types/api.types";
import { normalizeHttpError } from "@/providers/api/httpError";
import { buildResourceMutation } from "./resourceMutation";

type Values = Record<string, unknown>;
export function useResourceEditContract(resource: string, form: FormInstance<Values>, record?: Values, active = true) {
  const provider = useDataProvider();
  const { t } = useTranslation();
  const snapshot = useRef<Values | undefined>(undefined);
  const draft = useRef<Values | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [server, setServer] = useState<Values | null>(null);
  const [reading, setReading] = useState(false);
  const [boundary, setBoundary] = useState({ resource, id: record?.id, active });
  if (boundary.resource !== resource || boundary.id !== record?.id || boundary.active !== active) {
    setBoundary({ resource, id: record?.id, active }); setError(null); setServer(null);
  }

  // Refine synchronizes asynchronous data into Form. Restore the user's draft on a
  // background refetch; only an explicit resolution below may replace its version.
  useEffect(() => {
    if (!active) { snapshot.current = undefined; draft.current = undefined; return; }
    if (!record) return;
    if (!snapshot.current || snapshot.current.id !== record.id) {
      snapshot.current = { ...record };
      draft.current = undefined;
      if (record.address && typeof record.address === "object" && !Array.isArray(record.address)) {
        const addr = record.address as Record<string, unknown>;
        const flattenedAddr: Record<string, unknown> = {};
        if (addr.line1 !== undefined) flattenedAddr.addressLine1 = addr.line1;
        if (addr.line2 !== undefined) flattenedAddr.addressLine2 = addr.line2;
        if (addr.city !== undefined) flattenedAddr.addressCity = addr.city;
        if (addr.state !== undefined) flattenedAddr.addressState = addr.state;
        if (addr.zipCode !== undefined) flattenedAddr.addressZipCode = addr.zipCode;
        if (addr.country !== undefined) flattenedAddr.addressCountry = addr.country;
        form.setFieldsValue(flattenedAddr as Parameters<typeof form.setFieldsValue>[0]);
      }
    } else if (draft.current) {
      Object.entries(draft.current).forEach(([name, value]) => form.setFieldValue(name, value));
    }
  }, [record, form, active]);

  const onValuesChange = (_: Values, values: Values) => { draft.current = { ...values }; };
  const prepare = (values: Values) => buildResourceMutation(resource, values, snapshot.current ?? record);
  const readServer = async () => {
    const id = snapshot.current?.id;
    if (typeof id !== "string" && typeof id !== "number") return;
    setReading(true);
    try { setServer((await provider().getOne({ resource, id })).data); }
    catch (cause) { setError(normalizeHttpError(cause)); }
    finally { setReading(false); }
  };
  const useServer = () => {
    if (!server) return;
    snapshot.current = { ...server }; draft.current = undefined;
    form.resetFields(); Object.entries(server).forEach(([name, value]) => form.setFieldValue(name, value)); setError(null); setServer(null);
  };
  const code = error?.code ?? "";
  const isConflict = error?.statusCode === 409;
  const changed = server ? Object.keys(server).filter((key) => key !== "version" && JSON.stringify(server[key]) !== JSON.stringify(form.getFieldValue(key))) : [];
  const feedback = error && <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
    <Alert type="error" showIcon message={t(`contractErrors.${code}`, { defaultValue: error.message })}
      description={isConflict ? t("contractAlignment.draftKept") : error.message}
      action={isConflict ? <Button loading={reading} onClick={() => void readServer()}>{t("contractAlignment.compareServer")}</Button> : undefined} />
    {server && <><Descriptions bordered size="small" column={1} items={changed.map((key) => ({ key, label: t(`forms.fields.${key}`, { defaultValue: key }),
      children: `${t("contractAlignment.draft")}: ${String(form.getFieldValue(key) ?? "—")} / ${t("contractAlignment.server")}: ${String(server[key] ?? "—")}` }))} />
      <Button onClick={useServer}>{t("contractAlignment.useServer")}</Button></>}
  </Space>;
  return { prepare, onValuesChange, reportError: setError, feedback };
}
