import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import dayjs, { type Dayjs } from "dayjs";
import type { TFunction } from "i18next";
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, EyeOutlined, EditOutlined, StopOutlined } from "@ant-design/icons";
import { ApiHttpError } from "@/utils/httpError";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { formatDateOnly, formatDateTime } from "@/formatters/dateTime";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { EmptyState } from "@/components/EmptyState";
import { ForbiddenState, NotFoundState, QueryErrorState } from "@/components/ErrorStates";
import { useDriverProfileRequest } from "@/hooks/drivers/useDriverProfileRequest";
import type { DriverProfileField, DriverProfileSectionDefinition, ProfileRow } from "./driverProfileSections";
import type { PagedResponse } from "@/types/drivers/driver-profile.types";

type ModalMode = "create" | "edit";

interface DriverProfileSectionProps {
  definition: DriverProfileSectionDefinition;
  driverId?: string;
  self?: boolean;
  canEdit?: boolean;
  isAdmin?: boolean;
}

const isDayjsValue = (value: unknown): value is Dayjs => dayjs.isDayjs(value);
const isPagedProfileData = (value: ProfileRow | PagedResponse<ProfileRow>): value is PagedResponse<ProfileRow> =>
  Array.isArray(value.items) && typeof value.totalItems === "number" && typeof value.currentPage === "number";
const getErrorStatus = (error: unknown): number | undefined => error instanceof ApiHttpError ? error.statusCode : undefined;
const getErrorMessage = (error: unknown): string => error instanceof Error ? error.message : "";
const stringValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const dateTimeInHoChiMinh = (value: string): Dayjs | undefined => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "00";
  const parsed = dayjs(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`);
  return parsed.isValid() ? parsed : undefined;
};

const fieldName = (field: DriverProfileField, t: TFunction): string =>
  t(`driverProfile.fields.${field.key}`, { defaultValue: field.key });

const formatFieldValue = (
  fieldKey: string,
  value: unknown,
  definition: DriverProfileSectionDefinition,
  locale: string,
  t: TFunction,
) => {
  if (value === null || value === undefined || value === "") return "—";
  if (fieldKey === "expiryStatus" || fieldKey === "medicalCertificateExpiryStatus") {
    const status = stringValue(value);
    const color = status === "EXPIRED" ? "red" : status === "EXPIRING_SOON" ? "orange" : "green";
    return <Tag color={color}>{t(`driverProfile.expiryStatuses.${status}`, { defaultValue: status })}</Tag>;
  }
  const field = definition.fields.find((item) => item.key === fieldKey);
  if (field?.kind === "date") return formatDateOnly(stringValue(value), { locale, timeZone: "Asia/Ho_Chi_Minh" });
  if (field?.kind === "datetime") return formatDateTime(stringValue(value), { locale, timeZone: "Asia/Ho_Chi_Minh" });
  if (typeof value === "boolean") return t(value ? "driverProfile.values.yes" : "driverProfile.values.no");
  if (["availability", "conclusion", "contractType", "type", "status", "resolutionStatus", "gender", "maritalStatus"].includes(fieldKey)) {
    const text = stringValue(value);
    return t(`driverProfile.values.${text}`, { defaultValue: text });
  }
  if (Array.isArray(value)) return value.map(stringValue).join(", ") || "—";
  return stringValue(value) || "—";
};

const visibleFields = (definition: DriverProfileSectionDefinition, mode: ModalMode): DriverProfileField[] =>
  definition.fields.filter((field) => !(mode === "create" && field.editOnly) && !(mode === "edit" && field.createOnly));

const normalizeInitialValues = (
  row: ProfileRow | undefined,
  fields: readonly DriverProfileField[],
): Record<string, unknown> => Object.fromEntries(fields.flatMap((field) => {
  const value = row?.[field.key];
  if (value === undefined || value === null) return [];
  if ((field.kind === "date" || field.kind === "datetime") && typeof value === "string") {
    const parsed = field.kind === "datetime" ? dateTimeInHoChiMinh(value) : dayjs(value);
    return parsed?.isValid() ? [[field.key, parsed]] : [];
  }
  return [[field.key, value]];
}));

const buildRequestBody = (
  values: Record<string, unknown>,
  fields: readonly DriverProfileField[],
): Record<string, unknown> => fields.reduce<Record<string, unknown>>((body, field) => {
  const value = values[field.key];
  if (value === undefined || value === "" || value === null) {
    body[field.key] = null;
    return body;
  }
  if ((field.kind === "date" || field.kind === "datetime") && isDayjsValue(value)) {
    body[field.key] = field.kind === "date" ? value.format("YYYY-MM-DD") : value.format("YYYY-MM-DDTHH:mm:ss[+07:00]");
    return body;
  }
  body[field.key] = value;
  return body;
}, {});

const renderFormField = (
  field: DriverProfileField,
  t: TFunction,
) => {
  const rules = [
    ...(field.required ? [{ required: true, message: t("driverProfile.validation.required", { field: fieldName(field, t) }) }] : []),
    ...(field.pattern ? [{ pattern: field.pattern, message: t("driverProfile.validation.invalid", { field: fieldName(field, t) }) }] : []),
    ...(field.kind === "number" && (field.min !== undefined || field.max !== undefined) ? [{
      type: "number" as const,
      ...(field.min !== undefined ? { min: field.min } : {}),
      ...(field.max !== undefined ? { max: field.max } : {}),
      message: t("driverProfile.validation.invalid", { field: fieldName(field, t) }),
    }] : []),
    ...(field.pastOrPresent ? [{
      validator: (_rule: unknown, value: unknown) => {
        if (!isDayjsValue(value)) return Promise.resolve();
        const now = dateTimeInHoChiMinh(new Date().toISOString());
        const candidate = field.kind === "date" ? value.startOf("day") : value;
        const latest = field.kind === "date" ? now?.startOf("day") : now;
        return latest && candidate.isAfter(latest)
          ? Promise.reject(new Error(t("driverProfile.validation.pastOrPresent", { field: fieldName(field, t) })))
          : Promise.resolve();
      },
    }] : []),
  ];
  const label = fieldName(field, t);
  const commonInputProps = field.maxLength ? { maxLength: field.maxLength } : {};
  const todayHcm = field.pastOrPresent ? dateTimeInHoChiMinh(new Date().toISOString()) : undefined;

  let input: ReactNode;
  switch (field.kind) {
    case "textarea": input = <Input.TextArea rows={3} {...commonInputProps} />; break;
    case "date": input = <DatePicker disabledDate={todayHcm ? (current) => current.isAfter(todayHcm, "day") : undefined} style={{ width: "100%" }} format="DD/MM/YYYY" />; break;
    case "datetime": input = <DatePicker showTime={{ use12Hours: false }} disabledDate={todayHcm ? (current) => current.isAfter(todayHcm, "day") : undefined} format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />; break;
    case "number": input = <InputNumber min={field.min} max={field.max} precision={field.precision} style={{ width: "100%" }} />; break;
    case "boolean": input = <Switch aria-label={label} />; break;
    case "select": input = <Select options={(field.options ?? []).map((value) => ({ value, label: t(`driverProfile.values.${value}`, { defaultValue: value }) }))} />; break;
    default: input = <Input {...commonInputProps} />;
  }

  return <Form.Item key={field.key} name={field.key} label={label} rules={rules} valuePropName={field.kind === "boolean" ? "checked" : "value"}>{input}</Form.Item>;
};

export function DriverProfileSection({ definition, driverId, self = false, canEdit = false, isAdmin = false }: DriverProfileSectionProps) {
  const { t, i18n } = useTranslation();
  const [messageApi, messageContext] = message.useMessage();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [detail, setDetail] = useState<ProfileRow>();
  const [detailError, setDetailError] = useState<unknown>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<ModalMode>("create");
  const [selected, setSelected] = useState<ProfileRow>();
  const [mutationError, setMutationError] = useState<unknown>();
  const [mutationLoading, setMutationLoading] = useState(false);
  const [sensitiveOpen, setSensitiveOpen] = useState(false);
  const [sensitiveData, setSensitiveData] = useState<Record<string, unknown>>();
  const [sensitiveError, setSensitiveError] = useState<unknown>();
  const [sensitiveLoading, setSensitiveLoading] = useState(false);
  const [form] = Form.useForm<Record<string, unknown>>();
  const detailRequest = useRef<AbortController | null>(null);
  const sensitiveRequest = useRef<AbortController | null>(null);

  useEffect(() => () => {
    detailRequest.current?.abort();
    sensitiveRequest.current?.abort();
  }, []);

  const loadData = useCallback((signal: AbortSignal) => {
    if (definition.isSingle) {
      if (self) return definition.getSingleMine?.(signal) ?? Promise.reject(new Error("SELF_PROFILE_API_UNAVAILABLE"));
      return driverId && definition.getSingle
        ? definition.getSingle(driverId, signal)
        : Promise.reject(new Error("DRIVER_ID_REQUIRED"));
    }
    if (self) {
      return definition.listMine?.(page, pageSize, signal) ?? Promise.reject(new Error("SELF_LIST_API_UNAVAILABLE"));
    }
    return driverId && definition.list
      ? definition.list(driverId, page, pageSize, signal)
      : Promise.reject(new Error("DRIVER_ID_REQUIRED"));
  }, [definition, driverId, page, pageSize, self]);

  const request = useDriverProfileRequest<ProfileRow | PagedResponse<ProfileRow>>(loadData, Boolean(self || driverId));
  const singleMissing = definition.isSingle && getErrorStatus(request.error) === 404;
  // The driver itself is loaded before its tabs render, so a 404 here means the
  // sub-resource has no data (or is not deployed) — not that the driver is missing.
  const sectionMissing = !definition.isSingle && getErrorStatus(request.error) === 404;
  const rows = useMemo(() => {
    if (!request.data) return [];
    if (definition.isSingle) return isPagedProfileData(request.data) ? [] : [request.data];
    if (isPagedProfileData(request.data)) return request.data.items;
    return [];
  }, [definition.isSingle, request.data]);
  const pageInfo = !definition.isSingle && request.data && isPagedProfileData(request.data) ? request.data : undefined;
  const fields = visibleFields(definition, formMode);

  const openCreate = () => {
    setFormMode("create");
    setSelected(undefined);
    setMutationError(undefined);
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (row?: ProfileRow) => {
    setFormMode("edit");
    setSelected(row);
    setMutationError(undefined);
    form.resetFields();
    form.setFieldsValue(normalizeInitialValues(row, visibleFields(definition, "edit")) as never);
    setFormOpen(true);
  };

  const openDetail = async (row: ProfileRow) => {
    if (definition.isSingle || self || !driverId || !definition.getOne || typeof row.id !== "string") {
      setDetail(row);
      setDetailError(undefined);
      return;
    }
    setDetail(undefined);
    setDetailError(undefined);
    setDetailLoading(true);
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    try {
      setDetail(await definition.getOne(driverId, row.id, controller.signal));
    } catch (reason) {
      if (!controller.signal.aborted) setDetailError(reason);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  };

  const submit = async (values: Record<string, unknown>) => {
    if (!driverId || !canEdit) return;
    const body = buildRequestBody(values, fields);
    setMutationLoading(true);
    setMutationError(undefined);
    try {
      if (definition.isSingle) {
        if (!definition.saveSingle) return;
        await definition.saveSingle(driverId, body);
      } else if (formMode === "create") {
        if (!definition.create) return;
        await definition.create(driverId, body);
      } else {
        if (!definition.update || typeof selected?.id !== "string") return;
        await definition.update(driverId, selected.id, body);
      }
      messageApi.success(t("driverProfile.feedback.saved"));
      setFormOpen(false);
      request.reload();
    } catch (reason) {
      setMutationError(reason);
      if (reason instanceof ApiHttpError && reason.errors) {
        applyBackendFieldErrors(form, reason.errors);
      }
    } finally {
      setMutationLoading(false);
    }
  };

  const deactivate = async (row: ProfileRow) => {
    if (!canEdit || !driverId || !definition.deactivate || typeof row.id !== "string") return;
    setMutationLoading(true);
    setMutationError(undefined);
    try {
      await definition.deactivate(driverId, row.id);
      messageApi.success(t("driverProfile.feedback.deactivated"));
      request.reload();
    } catch (reason) {
      setMutationError(reason);
    } finally {
      setMutationLoading(false);
    }
  };

  const showSensitive = async (row?: ProfileRow) => {
    if (!isAdmin || !driverId || !definition.sensitive) return;
    setSensitiveLoading(true);
    setSensitiveError(undefined);
    setSensitiveData(undefined);
    setSensitiveOpen(true);
    sensitiveRequest.current?.abort();
    const controller = new AbortController();
    sensitiveRequest.current = controller;
    try {
      const data = await definition.sensitive(driverId, typeof row?.id === "string" ? row.id : undefined, controller.signal);
      if (!controller.signal.aborted) setSensitiveData(data);
    } catch (reason) {
      if (!controller.signal.aborted) setSensitiveError(reason);
    } finally {
      if (!controller.signal.aborted) setSensitiveLoading(false);
    }
  };

  const closeSensitive = () => {
    sensitiveRequest.current?.abort();
    sensitiveRequest.current = null;
    setSensitiveLoading(false);
    setSensitiveOpen(false);
    setSensitiveData(undefined);
    setSensitiveError(undefined);
  };

  const valueCell = (key: string, row: ProfileRow) => formatFieldValue(key, row[key], definition, i18n.language, t);
  const columns: ColumnsType<ProfileRow> = [
    ...definition.columns.map((key) => ({
      title: key === "expiryStatus" ? t("driverProfile.fields.expiryStatus") : fieldName({ key }, t),
      dataIndex: key,
      key,
      render: (_value: unknown, row: ProfileRow) => valueCell(key, row),
    })),
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right",
      width: canEdit || (isAdmin && definition.sensitive) ? 210 : 120,
      render: (_value, row) => (
        <Space wrap>
          <Button aria-label={`${t("driverProfile.actions.view")} ${stringValue(row.id)}`} icon={<EyeOutlined />} onClick={() => void openDetail(row)} />
          {canEdit && definition.update ? <Button aria-label={`${t("actions.edit")} ${stringValue(row.id)}`} icon={<EditOutlined />} onClick={() => openEdit(row)} /> : null}
          {canEdit && definition.deactivate ? (
            <Popconfirm
              title={t("driverProfile.confirm.deactivateTitle")}
              description={t(definition.deactivateLabelKey ?? "driverProfile.confirm.deactivateDescription")}
              okText={t("driverProfile.actions.confirmDeactivate")}
              cancelText={t("common.cancel")}
              onConfirm={() => void deactivate(row)}
            >
              <Button aria-label={`${t("driverProfile.actions.deactivate")} ${stringValue(row.id)}`} danger icon={<StopOutlined />} loading={mutationLoading} />
            </Popconfirm>
          ) : null}
          {isAdmin && definition.sensitive ? <Button onClick={() => void showSensitive(row)}>{t("driverProfile.actions.viewSensitive")}</Button> : null}
        </Space>
      ),
    },
  ];

  if (request.loading) return <Spin aria-label={t("asyncState.loading")} />;
  if (request.error && !singleMissing && !sectionMissing) {
    if (getErrorStatus(request.error) === 403) return <ForbiddenState />;
    return <QueryErrorState description={getErrorMessage(request.error)} onRetry={request.reload} />;
  }

  if (definition.isSingle) {
    const row = request.data && !isPagedProfileData(request.data) ? request.data : undefined;
    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {messageContext}
        {singleMissing ? <Alert type="info" showIcon message={t("driverProfile.feedback.profileNotCreated")} /> : null}
        {canEdit ? <div><Button type="primary" icon={<EditOutlined />} onClick={() => openEdit(row)}>{t(row ? "actions.edit" : "driverProfile.actions.createProfile")}</Button></div> : null}
        {mutationError ? <MutationError error={mutationError} /> : null}
        {row ? (
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }} items={definition.fields.map((field) => ({
            key: field.key,
            label: fieldName(field, t),
            children: valueCell(field.key, row),
          }))} />
        ) : <Empty description={t("driverProfile.feedback.noProfileData")} />}
        {isAdmin && definition.sensitive ? <Button onClick={() => void showSensitive()}>{t("driverProfile.actions.viewSensitive")}</Button> : null}
        <FormModal
          form={form} fields={visibleFields(definition, "edit")} loading={mutationLoading}
          mode="edit" open={formOpen} t={t} onCancel={() => setFormOpen(false)} onFinish={submit} error={mutationError}
        />
        <SensitiveDrawer
          data={sensitiveData} error={sensitiveError} loading={sensitiveLoading} open={sensitiveOpen}
          definition={definition} locale={i18n.language} t={t} onClose={closeSensitive}
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {messageContext}
      {sectionMissing ? (
        <Alert
          type="info"
          showIcon
          message={t("driverProfile.feedback.sectionUnavailable")}
          description={t("driverProfile.feedback.sectionUnavailableDescription")}
          action={<Button size="small" onClick={request.reload}>{t("actions.retry")}</Button>}
        />
      ) : null}
      {mutationError ? <MutationError error={mutationError} /> : null}
      {canEdit && definition.create ? (
        <div><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{t("driverProfile.actions.add")}</Button></div>
      ) : null}
      <Table<ProfileRow>
        rowKey={(row) => stringValue(row.id)}
        dataSource={rows}
        columns={columns}
        loading={request.loading || mutationLoading}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <EmptyState description={t("driverProfile.feedback.noRecords")} /> }}
        pagination={{
          current: pageInfo?.currentPage ?? page,
          pageSize: pageInfo?.pageSize ?? pageSize,
          total: pageInfo?.totalItems ?? 0,
          responsive: true,
          ...createListPaginationConfig(t),
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPageSize === pageSize ? nextPage : 1);
            setPageSize(nextPageSize);
          },
        }}
      />
      <Modal
        open={formOpen}
        title={t(formMode === "create" ? "driverProfile.actions.add" : "actions.edit")}
        onCancel={() => setFormOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <FormModalBody
          form={form} fields={fields} loading={mutationLoading} mode={formMode} t={t}
          onCancel={() => setFormOpen(false)} onFinish={submit} error={mutationError}
        />
      </Modal>
      <Drawer
        open={Boolean(detail || detailLoading || detailError)}
        title={t("driverProfile.actions.recordDetails")}
        onClose={() => {
          detailRequest.current?.abort();
          detailRequest.current = null;
          setDetailLoading(false);
          setDetail(undefined);
          setDetailError(undefined);
        }}
        width={Math.min(560, typeof window === "undefined" ? 560 : window.innerWidth - 24)}
        destroyOnClose
      >
        {detailLoading ? <Spin /> : null}
        {getErrorStatus(detailError) === 403 ? <ForbiddenState /> : null}
        {getErrorStatus(detailError) === 404 ? <NotFoundState /> : null}
        {detailError && ![403, 404].includes(getErrorStatus(detailError) ?? 0) ? <QueryErrorState description={getErrorMessage(detailError)} /> : null}
        {detail ? <Descriptions bordered size="small" column={1} items={Object.entries(detail).map(([key, value]) => ({
          key, label: key === "expiryStatus" ? t("driverProfile.fields.expiryStatus") : fieldName({ key }, t),
          children: formatFieldValue(key, value, definition, i18n.language, t),
        }))} /> : null}
      </Drawer>
      <SensitiveDrawer
        data={sensitiveData} error={sensitiveError} loading={sensitiveLoading} open={sensitiveOpen}
        definition={definition} locale={i18n.language} t={t} onClose={closeSensitive}
      />
    </Space>
  );
}

interface FormBodyProps {
  fields: readonly DriverProfileField[];
  form: ReturnType<typeof Form.useForm<Record<string, unknown>>>[0];
  loading: boolean;
  mode: ModalMode;
  onCancel: () => void;
  onFinish: (values: Record<string, unknown>) => void;
  error: unknown;
  t: TFunction;
}

function FormModalBody({ fields, form, loading, mode, onCancel, onFinish, error, t }: FormBodyProps) {
  return (
    <>
      {error ? <MutationError error={error} /> : null}
      <Form form={form} layout="vertical" onFinish={onFinish} scrollToFirstError={{ block: "center" }}>
        {fields.map((field) => renderFormField(field, t))}
        <Space style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} disabled={loading}>{t("common.cancel")}</Button>
          <Button type="primary" htmlType="submit" loading={loading}>{t(mode === "create" ? "driverProfile.actions.add" : "actions.save")}</Button>
        </Space>
      </Form>
    </>
  );
}

function FormModal(props: FormBodyProps & { open: boolean }) {
  const { form, fields, loading, mode, open, t, onCancel, onFinish, error } = props;
  return (
    <Modal open={open} title={t(mode === "create" ? "driverProfile.actions.add" : "actions.edit")} onCancel={onCancel} footer={null} destroyOnClose width={720}>
      <FormModalBody form={form} fields={fields} loading={loading} mode={mode} t={t} onCancel={onCancel} onFinish={onFinish} error={error} />
    </Modal>
  );
}

function MutationError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  if (getErrorStatus(error) === 403) return <ForbiddenState />;
  return <Alert type="error" showIcon message={t("driverProfile.errors.saveFailed")} description={getErrorMessage(error)} />;
}

function SensitiveDrawer({
  data,
  error,
  loading,
  open,
  definition,
  locale,
  t,
  onClose,
}: {
  data: Record<string, unknown> | undefined;
  error: unknown;
  loading: boolean;
  open: boolean;
  definition: DriverProfileSectionDefinition;
  locale: string;
  t: TFunction;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} title={t("driverProfile.actions.sensitiveTitle")} onClose={onClose} width={Math.min(480, typeof window === "undefined" ? 480 : window.innerWidth - 24)} destroyOnClose>
      <Alert type="warning" showIcon message={t("driverProfile.sensitiveNotice")} style={{ marginBottom: 16 }} />
      {loading ? <Spin /> : null}
      {getErrorStatus(error) === 403 ? <ForbiddenState /> : null}
      {getErrorStatus(error) === 404 ? <NotFoundState /> : null}
      {error && ![403, 404].includes(getErrorStatus(error) ?? 0) ? <QueryErrorState description={getErrorMessage(error)} /> : null}
      {data ? <Descriptions bordered size="small" column={1} items={Object.entries(data).filter(([key]) => ["nationalIdNumber", "personalTaxCode", "licenseNumber", "socialInsuranceNumber", "healthInsuranceCardNumber", "taxCode", "accountNumber"].includes(key)).map(([key, value]) => ({
        key,
        label: fieldName({ key }, t),
        children: typeof value === "string" ? <Typography.Text copyable>{value}</Typography.Text> : formatFieldValue(key, value, definition, locale, t),
      }))} /> : null}
    </Drawer>
  );
}
