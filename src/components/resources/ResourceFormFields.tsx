/* eslint-disable react-refresh/only-export-components */
/**
 * Renders backend-confirmed resource form definitions with Ant Design controls.
 * Refine owns submit/query state; this component only owns field presentation.
 */

import { DownOutlined, InfoCircleOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import type { Rule } from "antd/es/form";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { translateOptional } from "@/locales";

import { FormGrid } from "@/forms/FormGrid";
import type { FormGridColumns } from "@/forms/FormGrid";
import { EntityPicker } from "../EntityPicker";
import {
  findSectionKeyForField,
  isFullWidthControl,
  type ResourceFormDefinition,
  type ResourceFormField,
  type ResourceFormSection,
} from "./resourceForms";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export interface ResourceFormFieldsProps {
  /**
   * Số cột ở màn rộng. Mặc định `1` — modal chỉ rộng ~520px nên hai cột ở đó sẽ bóp
   * mỗi ô còn ~230px. Trang route truyền `2`.
   */
  columns?: FormGridColumns;
  definition: ResourceFormDefinition;
  /** Danh sách key các section đang mở (khi điều khiển từ ngoài) */
  expandedKeys?: string[];
  /** Hàm callback khi người dùng bấm đóng/mở section */
  onToggleSection?: (key: string) => void;
  /** Tập hợp các field đã thay đổi so với giá trị ban đầu */
  dirtyFields?: Set<string>;
  /** Đang ở chế độ chỉnh sửa (Edit) hay tạo mới (Create) */
  isEdit?: boolean;
}

interface FieldRendererProps {
  field: ResourceFormField;
  listNamePrefix?: number;
  dirtyFields?: Set<string>;
  isEdit?: boolean;
}

const TripStopsField = () => {
  const { t } = useTranslation();
  const stopFields: readonly ResourceFormField[] = [
    { control: "text", name: "type", required: true },
    { control: "number", min: 1, name: "order", required: true },
    {
      control: "relation",
      name: "loadId",
      relationResource: "loads",
      required: true,
      relationLabelFormat: (r: Record<string, unknown>) =>
        r.name ? `Load #${r.number ?? ""} ${r.name}` : String(r.id ?? ""),
    },
    { control: "text", name: "addressLine1", required: true },
    { control: "text", name: "addressLine2" },
    { control: "text", name: "addressCity", required: true },
    { control: "text", name: "addressState", required: true },
    { control: "text", name: "addressZipCode", required: true },
    { control: "text", name: "addressCountry", required: true },
    { control: "number", min: -90, max: 90, name: "locationLatitude", required: true },
    { control: "number", min: -180, max: 180, name: "locationLongitude", required: true },
  ];

  return (
    <Form.List
      name="stops"
      rules={[
        {
          validator: async (_, stops: unknown[]) => {
            if (!Array.isArray(stops) || stops.length === 0) {
              throw new Error(t("forms.validation.stopRequired"));
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {fields.map(({ key, name }) => (
            <Space align="start" key={key} style={{ width: "100%" }} wrap>
              {stopFields.map((field) => (
                <FieldRenderer field={field} key={field.name} listNamePrefix={name} />
              ))}
              <Button
                aria-label={t("forms.actions.removeStop")}
                icon={<MinusCircleOutlined />}
                onClick={() => remove(name)}
              />
            </Space>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => add()} type="dashed">
            {t("forms.actions.addStop")}
          </Button>
          <Form.ErrorList errors={errors} />
        </Space>
      )}
    </Form.List>
  );
};

const FieldRenderer = ({ field, listNamePrefix, dirtyFields }: FieldRendererProps) => {
  const { i18n, t } = useTranslation();
  const form = Form.useFormInstance();
  // Lắng nghe tài xế chính để loại trừ khỏi danh sách tài xế phụ
  const mainDriverId = Form.useWatch("mainDriverId", form);

  if (field.control === "tripStops") {
    return <TripStopsField />;
  }

  // Trường server sở hữu: render `disabled` chứ KHÔNG bỏ khỏi form. antd giữ giá
  // trị của field `disabled` trong form store, nên giá trị gốc được gửi lại nguyên
  // vẹn khi update — đúng cả khi backend PUT là full-replace lẫn partial.
  const isReadOnly = field.readOnly === true;

  const fieldLabelKey = `forms.fields.${field.name}`;
  const labelText = translateOptional(
    i18n,
    (key) => t(key),
    fieldLabelKey,
    field.name.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase()),
  );
  const isDirty = dirtyFields?.has(field.name);
  const readOnlyReasonKey = `forms.readOnlyReason.${field.name}`;
  const hasReason = i18n.exists(readOnlyReasonKey);
  const readOnlyReason = translateOptional(i18n, (key) => t(key), readOnlyReasonKey, "");

  const label = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span>{labelText}</span>
      {isDirty && (
        <Tooltip title={t("crud.fieldModified", "Đã thay đổi so với giá trị gốc")}>
          <span
            aria-label={t("crud.fieldModified", "Đã thay đổi")}
            className="dirty-indicator"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#fa8c16",
              marginLeft: 2,
            }}
          />
        </Tooltip>
      )}
      {isReadOnly && hasReason && (
        <Tooltip title={readOnlyReason}>
          <InfoCircleOutlined style={{ color: "rgba(0, 0, 0, 0.45)", fontSize: 13 }} />
        </Tooltip>
      )}
    </span>
  );

  const rules: Rule[] = [
    ...(field.required && field.control !== "boolean" && !isReadOnly
      ? [
          {
            required: true,
            message: t(`forms.validation.${field.name}Required`, {
              defaultValue: t("forms.validation.requiredField", {
                field: labelText,
                defaultValue: t("forms.validation.required"),
              }),
            }),
          },
        ]
      : []),
    ...(field.control === "email"
      ? [{ type: "email" as const, message: t("forms.validation.email") }]
      : []),
    ...(field.control === "uuid"
      ? [{ pattern: UUID_PATTERN, message: t("forms.validation.uuid") }]
      : []),
    ...(field.pattern
      ? [{ pattern: field.pattern, message: t("forms.validation.pattern") }]
      : []),
  ];

  // Ràng buộc tài xế phụ không được trùng tài xế chính
  if (field.name === "secondaryDriverId") {
    rules.push(({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || value !== getFieldValue("mainDriverId")) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(t("forms.validation.driverDuplicate")));
      },
    }));
  }

  const name = listNamePrefix === undefined
    ? field.name
    : [listNamePrefix, field.name];
  const extra = field.helperTextKey ? t(field.helperTextKey) : undefined;
  const placeholder = field.placeholderKey
    ? t(field.placeholderKey)
    : field.placeholder ??
      (field.control === "datetime"
        ? t("contractAlignment.instantHelp")
        : field.control === "relation"
          ? t("crud.selectPlaceholder", { label: labelText.toLowerCase() })
          : undefined);

  const componentType = field.component ?? (field.control === "boolean" ? "checkbox" : field.control);

  const sharedProps = {
    extra,
    label,
    name,
    rules,
    ...(field.name === "secondaryDriverId" ? { dependencies: ["mainDriverId"] } : {}),
    ...(field.control === "boolean" || componentType === "switch" ? { valuePropName: "checked" } : {}),
    ...(componentType === "multiSelect"
      ? {
          getValueProps: (value: unknown) => ({
            value: Array.isArray(value)
              ? value
              : typeof value === "string" && value.length > 0
                ? value.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
          }),
          normalize: (value: unknown) =>
            Array.isArray(value) ? value.join(", ") : value,
        }
      : {}),
    ...(field.control === "datetime" || field.control === "date"
      ? {
          getValueProps: (value: unknown) => {
            if (value === null || value === undefined || value === "") {
              return { value: undefined };
            }
            const parsed = dayjs.isDayjs(value)
              ? value
              : typeof value === "string" || typeof value === "number" || value instanceof Date
                ? dayjs(value)
                : undefined;
            return { value: parsed?.isValid() ? parsed : undefined };
          },
          normalize: (value: unknown) => {
            if (!dayjs.isDayjs(value) || !value.isValid()) return value;
            return field.control === "date"
              ? value.format("YYYY-MM-DD")
              : value.toISOString();
          },
        }
      : {}),
    ...(field.uppercase
      ? {
          normalize: (value: unknown) =>
            typeof value === "string" ? value.toUpperCase() : value,
        }
      : {}),
    ...(field.selectMode === "tags"
      ? {
          getValueProps: (value: unknown) => ({
            value: Array.isArray(value) ? value : value == null || value === "" ? [] : [value],
          }),
          normalize: (value: unknown) =>
            Array.isArray(value) ? value.at(-1) : value,
        }
      : {}),
  };

  const max = typeof field.max === "function" ? field.max() : field.max;

  let control: ReactNode;

  if (componentType === "switch") {
    control = (
      <Switch
        checkedChildren={t("common.yes", "Bật")}
        disabled={isReadOnly}
        unCheckedChildren={t("common.no", "Tắt")}
      />
    );
  } else if (componentType === "multiSelect") {
    control = (
      <Select
        allowClear
        disabled={isReadOnly}
        mode="tags"
        options={field.options?.map((value) => ({
          label: translateOptional(i18n, (key) => t(key), `forms.options.${value}`, value),
          value,
        }))}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
    );
  } else if (field.control === "boolean" || componentType === "checkbox") {
    control = <Checkbox disabled={isReadOnly} />;
  } else if (field.control === "number" || componentType === "number") {
    const inputNumberNode = (
      <InputNumber
        disabled={isReadOnly}
        max={max}
        min={field.min}
        placeholder={placeholder}
        stringMode={field.stringMode}
        style={{ width: "100%" }}
      />
    );
    control = field.unit ? (
      <Space.Compact style={{ width: "100%" }}>
        {inputNumberNode}
        <span className="ant-input-group-addon">{field.unit}</span>
      </Space.Compact>
    ) : (
      inputNumberNode
    );
  } else if (field.control === "select" || componentType === "select") {
    control = (
      <Select
        allowClear={!field.required}
        disabled={isReadOnly}
        mode={field.selectMode}
        options={field.options?.map((value) => ({
          label: translateOptional(i18n, (key) => t(key), `forms.options.${value}`, value),
          value,
        }))}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
    );
  } else if (field.control === "relation" || componentType === "entityPicker") {
    const excludeValues =
      field.name === "secondaryDriverId" && mainDriverId ? [String(mainDriverId)] : undefined;
    control = (
      <EntityPicker
        disabled={isReadOnly}
        excludeValues={excludeValues}
        {...(field.relationLabelField === undefined
          ? {}
          : { labelField: field.relationLabelField })}
        {...(field.relationLabelFormat === undefined
          ? {}
          : { labelFormat: field.relationLabelFormat })}
        placeholder={placeholder}
        required={field.required}
        resource={field.relationResource ?? ""}
      />
    );
  } else if (field.control === "textarea") {
    control = (
      <Input.TextArea
        disabled={isReadOnly}
        maxLength={field.maxLength}
        placeholder={placeholder}
        rows={3}
        style={{ width: "100%" }}
      />
    );
  } else if (field.control === "datetime" || field.control === "date") {
    control = (
      <DatePicker
        disabled={isReadOnly}
        format={field.control === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm"}
        placeholder={placeholder}
        showTime={field.control === "datetime"}
        style={{ width: "100%" }}
      />
    );
  } else {
    control = (
      <Input
        disabled={isReadOnly}
        maxLength={field.maxLength}
        placeholder={placeholder}
        style={{ width: "100%", ...(field.uppercase ? { textTransform: "uppercase" } : {}) }}
        type={field.control === "email" ? "email" : "text"}
      />
    );
  }

  return <Form.Item {...sharedProps}>{control}</Form.Item>;
};

interface ConditionalFieldColProps {
  columns: FormGridColumns;
  field: ResourceFormField;
  dirtyFields?: Set<string>;
  isEdit?: boolean;
}

const ConditionalFieldCol = ({
  columns,
  dirtyFields,
  field,
  isEdit,
}: ConditionalFieldColProps) => {
  const form = Form.useFormInstance();
  const dependsOn = field.dependsOn;
  const watchedValue = Form.useWatch(dependsOn?.field ?? "", form);

  const isVisible = useMemo(() => {
    if (!dependsOn) return true;
    if (dependsOn.condition) return dependsOn.condition(watchedValue, form?.getFieldsValue?.());
    if (dependsOn.value !== undefined) return watchedValue === dependsOn.value;
    return Boolean(watchedValue);
  }, [dependsOn, watchedValue, form]);

  const prevVisibleRef = useRef(isVisible);
  useEffect(() => {
    if (prevVisibleRef.current && !isVisible) {
      if (dependsOn?.resetOnHide !== false) {
        form?.setFieldValue(field.name, undefined);
      }
    }
    prevVisibleRef.current = isVisible;
  }, [isVisible, field.name, dependsOn, form]);

  if (!isVisible) {
    return null;
  }

  const isFull = isFullWidthControl(field) || field.span === 2 || columns === 1;

  return (
    <Col
      key={field.name}
      lg={isFull ? 24 : 12}
      md={isFull ? 24 : 12}
      sm={24}
      span={24}
      xs={24}
    >
      <FieldRenderer dirtyFields={dirtyFields} field={field} isEdit={isEdit} />
    </Col>
  );
};

interface SectionCardProps {
  columns: FormGridColumns;
  isOpen: boolean;
  onToggle?: () => void;
  section: ResourceFormSection;
  dirtyFields?: Set<string>;
  isEdit?: boolean;
}

const SectionCard = ({
  columns,
  dirtyFields,
  isEdit,
  isOpen,
  onToggle,
  section,
}: SectionCardProps) => {
  const { t } = useTranslation();
  const title = t(section.titleKey);
  const description = section.descriptionKey ? t(section.descriptionKey) : undefined;
  const isCollapsible = section.collapsible === true;

  return (
    <div
      className="resource-form-section"
      id={`section-${section.key}`}
      style={{
        marginBottom: 32,
      }}
    >
      {isCollapsible ? (
        <div
          aria-controls={`section-${section.key}-content`}
          aria-expanded={isOpen}
          className="resource-form-section-header"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle?.();
            }
          }}
          role="button"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            padding: "4px 0",
            outline: "none",
          }}
          tabIndex={0}
        >
          <div>
            <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              {title}
            </Typography.Title>
            {description && (
              <Typography.Text
                style={{ fontSize: 13, display: "block", marginTop: 2 }}
                type="secondary"
              >
                {description}
              </Typography.Text>
            )}
          </div>
          <DownOutlined
            aria-hidden="true"
            style={{
              fontSize: 14,
              color: "rgba(0, 0, 0, 0.45)",
              transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 4, padding: "4px 0" }}>
          <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            {title}
          </Typography.Title>
          {description && (
            <Typography.Text
              style={{ fontSize: 13, display: "block", marginTop: 2 }}
              type="secondary"
            >
              {description}
            </Typography.Text>
          )}
        </div>
      )}
      <Divider style={{ margin: "8px 0 16px" }} />
      {(!isCollapsible || isOpen) && (
        <div id={`section-${section.key}-content`}>
          <Row gutter={[16, 0]}>
            {section.fields.map((field) => (
              <ConditionalFieldCol
                columns={columns}
                dirtyFields={dirtyFields}
                field={field}
                isEdit={isEdit}
                key={field.name}
              />
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export function useResourceFormSections(
  definition: ResourceFormDefinition,
) {
  const initialKeys = useMemo(() => {
    if (!definition.sections) return [];
    return definition.sections
      .filter((s) => !s.defaultCollapsed)
      .map((s) => s.key);
  }, [definition.sections]);

  const [expandedKeys, setExpandedKeys] = useState<string[]>(initialKeys);

  const openSection = useCallback((sectionKey: string) => {
    setExpandedKeys((prev) => (prev.includes(sectionKey) ? prev : [...prev, sectionKey]));
  }, []);

  const closeSection = useCallback((sectionKey: string) => {
    setExpandedKeys((prev) => prev.filter((k) => k !== sectionKey));
  }, []);

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedKeys((prev) =>
      prev.includes(sectionKey)
        ? prev.filter((k) => k !== sectionKey)
        : [...prev, sectionKey],
    );
  }, []);

  const openSectionForField = useCallback(
    (fieldName: string | readonly (string | number)[]) => {
      const sectionKey = findSectionKeyForField(definition, fieldName);
      if (sectionKey) {
        openSection(sectionKey);
      }
      return sectionKey;
    },
    [definition, openSection],
  );

  return {
    expandedKeys,
    setExpandedKeys,
    openSection,
    closeSection,
    toggleSection,
    openSectionForField,
  };
}

export function focusFirstFormErrorWithSections(
  form: { scrollToField: (name: string | number | readonly (string | number)[], options?: ScrollIntoViewOptions & { focus?: boolean }) => void },
  definition: ResourceFormDefinition,
  errorFieldName: string | readonly (string | number)[],
  openSection?: (sectionKey: string) => void,
): boolean {
  const sectionKey = findSectionKeyForField(definition, errorFieldName);
  if (sectionKey && openSection) {
    openSection(sectionKey);
  }
  form.scrollToField(errorFieldName, {
    block: "center",
    focus: true,
  });
  return true;
}

export const ResourceFormFields = ({
  columns = 1,
  definition,
  dirtyFields,
  expandedKeys: controlledExpandedKeys,
  isEdit,
  onToggleSection: controlledOnToggle,
}: ResourceFormFieldsProps) => {
  const internalSections = useResourceFormSections(definition);
  const isControlled = controlledExpandedKeys !== undefined;
  const expandedKeys = isControlled ? controlledExpandedKeys : internalSections.expandedKeys;
  const toggleSection = isControlled
    ? (controlledOnToggle ?? (() => {}))
    : internalSections.toggleSection;

  if (!definition.sections || definition.sections.length === 0) {
    return (
      <FormGrid
        columns={columns}
        items={definition.fields.map((field) => ({
          fullWidth: isFullWidthControl(field),
          key: field.name,
          node: <FieldRenderer dirtyFields={dirtyFields} field={field} isEdit={isEdit} />,
        }))}
      />
    );
  }

  return (
    <div className="resource-form-sections-container">
      {definition.sections.map((section) => (
        <SectionCard
          columns={columns}
          dirtyFields={dirtyFields}
          isEdit={isEdit}
          isOpen={!section.collapsible || expandedKeys.includes(section.key)}
          key={section.key}
          onToggle={() => toggleSection(section.key)}
          section={section}
        />
      ))}
    </div>
  );
};
