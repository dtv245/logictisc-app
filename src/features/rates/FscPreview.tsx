import { RatingAcceptance } from "./RatingAcceptance";
import type { RatingPreviewRequest as WireRatingRequest } from "@/types/handoff.generated";
/** User-requested, ephemeral backend preview. No financial write or local formula. */
import { useCan, useCustomMutation } from "@refinedev/core";
import { Alert, Button, Descriptions, Form, Input, InputNumber, Space, Spin, Table } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/ErrorStates";
import { FormGrid } from "@/forms/FormGrid";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useCurrentTenant } from "@/hooks/useCurrentTenant";
import { ApiHttpError } from "@/providers/api/httpError";
import { financialAmount } from "@/features/profitability/financialDisplay";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import { formatMoney } from "@/formatters/money";
import type { RatingPreview, RatingPreviewRequest } from "@/types/rateRule.dto";
import { isUuid } from "@/utils/uuid";
import { FscPolicyFields } from "./FscPolicyFields";
import { rateRuleApi } from "./rateRule.api";

const textFields = ["currency", "contextSource", "contractId", "lane", "equipment", "service", "tier", "linehaulMileageEvidenceId", "fscMileageEvidenceId", "accessorialIds"] as const;
type PreviewForm = Partial<Omit<RatingPreviewRequest, "accessorialIds">> & { accessorialIds?: string };
const optionalText = (value: string | null | undefined): string | undefined => value?.trim() || undefined;
const uuidFields = ["contractId", "linehaulMileageEvidenceId", "fscMileageEvidenceId"] as const;
const isField = (value: unknown): value is keyof PreviewForm => typeof value === "string" && [...textFields, "contractVersion"].includes(value);

export function RatingPreviewSummary({ preview }: { preview: RatingPreview }) {
  const { t, i18n } = useTranslation(); const rule = preview.inputs.rule; const fsc = preview.fuelSurcharge;
  const money = (value: string | number | null | undefined, currency = preview.currency) => financialAmount(value, currency, i18n.language);
  const unitRate = (value: string | number | null | undefined, currency: string) => {
    if (value == null || !currency) return "—";
    try { return formatMoney(value, { currency, locale: i18n.language, currencyDisplay: "code", minimumFractionDigits: 0, maximumFractionDigits: 4 }); }
    catch { return "—"; }
  };
  return <Space direction="vertical" size="middle" style={{ width: "100%" }} data-testid="rating-preview-result">
    <Alert type="info" showIcon message={t("rating.previewOnly")} />
    <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
      { key: "rule", label: t("rating.ruleVersion"), children: `${rule.ruleId} / ${rule.version}` },
      { key: "method", label: t("rating.linehaulMethod"), children: rule.method },
      { key: "date", label: t("rating.pricingDate"), children: formatDateOnly(preview.inputs.pricingDate.pricingDate, { locale: i18n.language }) },
      { key: "dateSource", label: t("rating.pricingDateSource"), children: preview.inputs.pricingDate.pricingDateSource },
      { key: "context", label: t("rating.contextSource"), children: preview.inputs.contextSource },
      { key: "raw", label: t("rating.rawLinehaul"), children: money(preview.rawLinehaul) },
      { key: "bounded", label: t("rating.boundedLinehaul"), children: money(preview.boundedLinehaul) },
      { key: "subtotal", label: t("rating.subtotal"), children: money(preview.subtotal) },
      { key: "tax", label: t("rating.taxAvailability"), children: t(`finance.availability.${preview.taxAvailability}`, { defaultValue: preview.taxAvailability }) },
      { key: "rounding", label: t("rating.roundingPolicy"), children: `${preview.roundingPolicyCode} / ${preview.roundingPolicyVersion}` },
      { key: "time", label: t("rating.calculatedAt"), children: formatDateTime(preview.calculatedAt, { locale: i18n.language }) },
      { key: "request", label: t("rating.correlationId"), children: preview.correlationId },
    ]} />
    {fsc ? <>
      <FscPolicyFields policy={fsc.policy} />
      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} items={[
        { key: "index", label: t("rating.indexValue"), children: money(fsc.index.value, fsc.index.currency) },
        { key: "indexUnit", label: t("rating.priceUnit"), children: fsc.index.unit },
        { key: "series", label: t("rating.indexSeries"), children: fsc.index.seriesIdentifier },
        { key: "observation", label: t("rating.observationDate"), children: formatDateOnly(fsc.index.observationDate, { locale: i18n.language }) },
        { key: "miles", label: t("rating.eligibleMiles"), children: fsc.mileage.eligibleMiles ?? "—" },
        { key: "source", label: t("rating.mileageSource"), children: `${fsc.mileage.mileageSourceType} / ${fsc.mileage.sourceReference} / ${fsc.mileage.sourceVersion}` },
        { key: "provenance", label: t("rating.mileageProvenance"), children: fsc.mileage.provenance },
        { key: "perMile", label: t("rating.perMile"), children: unitRate(fsc.perMile, fsc.currency) },
        { key: "total", label: t("rating.fscTotal"), children: money(fsc.total, fsc.currency) },
      ]} />
    </> : <Alert type="info" message={t("rating.noFscPolicy")} />}
    <Table rowKey="key" pagination={false} scroll={{ x: "max-content" }} dataSource={preview.lines.map((line, index) => ({ ...line, key: `${line.componentType}/${line.sourceId ?? ""}/${index}` }))} columns={[
      { title: t("rating.component"), dataIndex: "componentType" },
      { title: t("rating.description"), dataIndex: "description" },
      { title: t("rating.sourceId"), dataIndex: "sourceId", render: (value: string | null) => value ?? "—" },
      { title: t("loads.financial.amount"), render: (_, row) => money(row.amount, row.currency) },
    ]} />
  </Space>;
}

export function FscPreview({ loadId }: { loadId: string }) {
  const { t } = useTranslation(); const { tenant } = useCurrentTenant();
  const permission = useCan({ resource: "rates", action: "RATE_PREVIEW" });
  const [form] = Form.useForm<PreviewForm>(); const [result, setResult] = useState<RatingPreview | null>(null);
  const [previewRequest, setPreviewRequest] = useState<WireRatingRequest | null>(null);
  const [acceptanceFrozen, setAcceptanceFrozen] = useState(false);
  const [error, setError] = useState<Error | null>(null); const [pending, setPending] = useState(false); const flight = useRef(false);
  const mutation = useCustomMutation<RatingPreview, ApiHttpError>();
  if (permission.isLoading) return <Spin />;
  if (!tenant?.tenantKey || permission.data?.can !== true || !isUuid(loadId)) return <ForbiddenState />;
  const preview = async (values: PreviewForm) => {
    if (flight.current) return;
    flight.current = true; setPending(true); setError(null); setResult(null);
    const payload: RatingPreviewRequest = {
      currency: values.currency!.trim().toUpperCase(), contextSource: values.contextSource!.trim(),
      contractId: optionalText(values.contractId), contractVersion: values.contractVersion ?? undefined,
      lane: optionalText(values.lane), equipment: optionalText(values.equipment), service: optionalText(values.service), tier: optionalText(values.tier),
      linehaulMileageEvidenceId: optionalText(values.linehaulMileageEvidenceId), fscMileageEvidenceId: optionalText(values.fscMileageEvidenceId),
      accessorialIds: values.accessorialIds?.trim().split(/[\s,]+/).filter(Boolean) ?? [],
    };
    try {
      const response = await mutation.mutateAsync({ url: rateRuleApi.preview(loadId), method: "post", values: payload, errorNotification: false, successNotification: false });
      setResult(response.data);
      setPreviewRequest(JSON.parse(JSON.stringify(payload)) as WireRatingRequest);
    } catch (cause) {
      const failure = cause instanceof Error ? cause : new Error(t("rating.previewFailed")); setError(failure);
      if (failure instanceof ApiHttpError && failure.errors) applyBackendFieldErrors({
        setFields: (fields) => form.setFields(fields.flatMap(({ name, errors }) => isField(name) ? [{ name, errors }] : [])),
        scrollToField: (name, options) => { if (isField(name)) form.scrollToField(name, options); },
      }, failure.errors);
    } finally { flight.current = false; setPending(false); }
  };
  return <Space direction="vertical" size="middle" style={{ width: "100%" }}>
    <Alert type="info" showIcon message={t("rating.previewHelp")} />
    {error && <Alert type="error" showIcon message={error instanceof ApiHttpError ? t(`rating.errors.${error.code}`, { defaultValue: error.message }) : error.message}
      description={error instanceof ApiHttpError ? `${error.code}${error.requestId ? ` / ${t("bootstrap.requestId.label")}: ${error.requestId}` : ""}` : undefined} />}
    <Form form={form} layout="vertical" disabled={pending || acceptanceFrozen} onFinish={(values) => void preview(values)} onValuesChange={() => { if (!acceptanceFrozen) { setResult(null); setPreviewRequest(null); setError(null); } }}>
      <FormGrid columns={2} items={[
        ...textFields.map((name) => ({ key: name, fullWidth: name === "contextSource" || name === "accessorialIds", node:
          <Form.Item name={name} label={t(`rating.${name}`)} rules={[
            ...(name === "currency" || name === "contextSource" ? [{ required: true, whitespace: true }] : []),
            ...(name === "currency" ? [{ pattern: /^[A-Za-z]{3}$/, message: t("rating.invalidCurrency") }] : []),
            ...(name === "contextSource" ? [{ max: 2000 }] : []),
            { validator: async (_, value: string | undefined) => {
              if (uuidFields.some((field) => field === name) && value?.trim() && !isUuid(value.trim())) throw new Error(t("rating.invalidUuid"));
              if (name === "accessorialIds" && value?.trim()) {
                const ids = value.trim().split(/[\s,]+/); if (ids.some((id) => !isUuid(id)) || new Set(ids).size !== ids.length) throw new Error(t("rating.invalidAccessorialIds"));
              }
            } },
          ]}>{name === "contextSource" || name === "accessorialIds" ? <Input.TextArea rows={2} /> : <Input />}</Form.Item> })),
        { key: "contractVersion", node: <Form.Item name="contractVersion" label={t("rating.contractVersion")} dependencies={["contractId"]} rules={[
          { validator: async (_, value: number | null | undefined) => {
            if (Boolean(form.getFieldValue("contractId")?.trim()) !== (value != null) || (value != null && (!Number.isInteger(value) || value < 1))) throw new Error(t("rating.contractPairRequired"));
          } },
        ]}><InputNumber min={1} precision={0} style={{ width: "100%" }} /></Form.Item> },
      ]} />
      <Button type="primary" htmlType="submit" loading={pending} disabled={pending || acceptanceFrozen}>{t("rating.preview")}</Button>
    </Form>
    {result && <RatingPreviewSummary preview={result} />}
    {result && previewRequest && <RatingAcceptance loadId={loadId} request={previewRequest} preview={result} onFrozen={() => setAcceptanceFrozen(true)} />}
  </Space>;
}
