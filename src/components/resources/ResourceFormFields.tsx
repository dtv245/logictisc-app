/**
 * Renders backend-confirmed resource form definitions with Ant Design controls.
 * Refine owns submit/query state; this component only owns field presentation.
 */

import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useSelect } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Button, Checkbox, Form, Input, InputNumber, Select, Space } from "antd";
import type { Rule } from "antd/es/form";
import { useTranslation } from "react-i18next";

import { APP_I18N_NAMESPACE } from "@locales";
import type {
  RelationRecord,
  ResourceFormDefinition,
  ResourceFormField,
} from "./resourceForms";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

interface ResourceFormFieldsProps {
  definition: ResourceFormDefinition;
}

interface FieldRendererProps {
  field: ResourceFormField;
  listNamePrefix?: number;
}

const RelationSelect = ({
  field,
  placeholder,
}: {
  field: ResourceFormField;
  placeholder?: string;
}) => {
  const { selectProps } = useSelect<BaseRecord>({
    resource: field.relationResource || "",
    optionLabel: (item: BaseRecord) =>
      (field.relationLabelFormat
        ? field.relationLabelFormat(item as RelationRecord)
        : undefined) ?? String(item[field.relationLabelField ?? "name"] ?? item.id ?? ""),
    optionValue: (item: BaseRecord) => String(item.id ?? ""),
    debounce: 300,
    onSearch: (value) => [
      {
        field: "search",
        operator: "contains",
        value,
      },
    ],
  });

  return (
    <Select
      {...selectProps}
      allowClear={!field.required}
      filterOption={false}
      placeholder={placeholder}
      showSearch
      style={{ minWidth: 200, width: "100%" }}
    />
  );
};

const TripStopsField = () => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
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
        <Space direction="vertical" size="middle">
          {fields.map(({ key, name }) => (
            <Space align="start" key={key} wrap>
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

const FieldRenderer = ({ field, listNamePrefix }: FieldRendererProps) => {
  const { t } = useTranslation(APP_I18N_NAMESPACE);
  if (field.control === "tripStops") {
    return <TripStopsField />;
  }

  const rules: Rule[] = [
    ...(field.required && field.control !== "boolean"
      ? [{ required: true, message: t("forms.validation.required") }]
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
  const name = listNamePrefix === undefined
    ? field.name
    : [listNamePrefix, field.name];
  const label = t(`forms.fields.${field.name}`);
  const sharedProps = {
    label,
    name,
    rules,
    ...(field.control === "boolean" ? { valuePropName: "checked" } : {}),
    ...(field.uppercase
      ? {
          normalize: (value: unknown) =>
            typeof value === "string" ? value.toUpperCase() : value,
        }
      : {}),
  };

  let control;
  if (field.control === "boolean") {
    control = <Checkbox />;
  } else if (field.control === "number") {
    control = <InputNumber max={field.max} min={field.min} />;
  } else if (field.control === "select") {
    control = (
      <Select
        allowClear={!field.required}
        options={field.options?.map((value) => ({
          label: t(`forms.options.${value}`),
          value,
        }))}
      />
    );
  } else if (field.control === "relation") {
    control = (
      <RelationSelect
        field={field}
        placeholder={`Chọn ${label.toLowerCase()}...`}
      />
    );
  } else if (field.control === "textarea") {
    control = <Input.TextArea maxLength={field.maxLength} rows={3} />;
  } else {
    control = (
      <Input
        maxLength={field.maxLength}
        type={field.control === "email" ? "email" : field.control === "datetime" ? "datetime-local" : "text"}
      />
    );
  }

  return <Form.Item {...sharedProps}>{control}</Form.Item>;
};

export const ResourceFormFields = ({ definition }: ResourceFormFieldsProps) => (
  <>
    {definition.fields.map((field) => (
      <FieldRenderer field={field} key={field.name} />
    ))}
  </>
);
