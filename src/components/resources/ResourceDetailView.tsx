/**
 * ResourceDetailView — Component hiển thị chi tiết bản ghi theo bố cục ngang (hình chữ nhật).
 *
 * Phục vụ popup xem chi tiết (View modal) trong các màn CRUD:
 * - Thay vì chỉ render form disabled với 1 cột dọc hẹp (~520px) thiếu nhiều thông tin server trả về,
 *   component này tổ chức toàn bộ dữ liệu trả về thành lưới 2 cột (Ant Design Descriptions).
 * - Tự động format các loại dữ liệu: StatusTag, Tag boolean, tiền tệ kèm currency, ngày giờ chuẩn locale,
 *   gộp các trường địa chỉ thành chuỗi đầy đủ và thay thế ID quan hệ bằng tên hiển thị thực tế (customerName,
 *   truckNumber, dispatcherName...) nếu có trong record.
 */

import { Descriptions, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { formatDateOnly, formatInstant } from "@/formatters/dateTime";
import { toIntlLocale } from "@/formatters/intlLocale";
import { formatMoney } from "@/formatters/money";
import type { ResourceFormDefinition } from "./resourceForms";

const { Text } = Typography;

export interface ResourceDetailViewProps {
  definition?: ResourceFormDefinition;
  record: Record<string, unknown>;
  resource: string;
}

interface DetailItem {
  key: string;
  label: string;
  span?: number;
  value: ReactNode;
}

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export const ResourceDetailView = ({
  definition,
  record,
  resource,
}: ResourceDetailViewProps) => {
  const { i18n, t } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  const getLabel = (key: string): string => {
    // 1. forms.fields.${key}
    const formKey = `forms.fields.${key}`;
    const formTranslated = t(formKey);
    if (formTranslated !== formKey) return formTranslated;

    // 2. columns.${resource}.${key}
    const colResKey = `columns.${resource}.${key}`;
    const colResTranslated = t(colResKey);
    if (colResTranslated !== colResKey) return colResTranslated;

    // 3. columns.${key}
    const colKey = `columns.${key}`;
    const colTranslated = t(colKey);
    if (colTranslated !== colKey) return colTranslated;

    // 4. crud.${key}
    const crudKey = `crud.${key}`;
    const crudTranslated = t(crudKey);
    if (crudTranslated !== crudKey) return crudTranslated;

    // 5. Fallback humanized
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const items: DetailItem[] = [];
  const processedKeys = new Set<string>();

  // 1. Mã số hoặc Số hiệu đầu tiên (number / id)
  if (record.number !== undefined && record.number !== null) {
    items.push({
      key: "number",
      label: getLabel("number"),
      value: <Text strong>#{String(record.number)}</Text>,
    });
    processedKeys.add("number");
  }

  if (record.id !== undefined && record.id !== null) {
    items.push({
      key: "id",
      label: getLabel("id"),
      value: <Text copyable={{ text: String(record.id) }}>{String(record.id)}</Text>,
    });
    processedKeys.add("id");
  }

  // Helper kiểm tra và format địa chỉ gộp
  const tryAddCombinedAddress = (
    prefix: string,
    labelKey: string,
    defaultLabel: string,
  ) => {
    const line1 = record[`${prefix}AddressLine1`];
    const city = record[`${prefix}AddressCity`];
    if (line1 || city) {
      const parts = [
        record[`${prefix}AddressLine1`],
        record[`${prefix}AddressLine2`],
        record[`${prefix}AddressCity`],
        record[`${prefix}AddressState`],
        record[`${prefix}AddressZipCode`],
        record[`${prefix}AddressCountry`],
      ]
        .filter(Boolean)
        .map(String);

      if (parts.length > 0) {
        items.push({
          key: `${prefix}Address`,
          label: t(labelKey, { defaultValue: defaultLabel }),
          span: 2,
          value: parts.join(", "),
        });
      }
      [
        `${prefix}AddressLine1`,
        `${prefix}AddressLine2`,
        `${prefix}AddressCity`,
        `${prefix}AddressState`,
        `${prefix}AddressZipCode`,
        `${prefix}AddressCountry`,
        `${prefix}LocationLatitude`,
        `${prefix}LocationLongitude`,
      ].forEach((k) => processedKeys.add(k));
    }
  };

  tryAddCombinedAddress("origin", "forms.fields.originAddress", "Địa chỉ xuất phát");
  tryAddCombinedAddress("destination", "forms.fields.destinationAddress", "Địa chỉ giao hàng");
  tryAddCombinedAddress("billing", "forms.fields.billingAddress", "Địa chỉ thanh toán");

  // Kiểm tra địa chỉ phẳng đơn thuần addressLine1 -> addressCountry
  if (!processedKeys.has("addressLine1") && (record.addressLine1 || record.addressCity)) {
    const parts = [
      record.addressLine1,
      record.addressLine2,
      record.addressCity,
      record.addressState,
      record.addressZipCode,
      record.addressCountry,
    ]
      .filter(Boolean)
      .map(String);

    if (parts.length > 0) {
      items.push({
        key: "address",
        label: t("forms.fields.address", { defaultValue: "Địa chỉ" }),
        span: 2,
        value: parts.join(", "),
      });
    }
    [
      "addressLine1",
      "addressLine2",
      "addressCity",
      "addressState",
      "addressZipCode",
      "addressCountry",
    ].forEach((k) => processedKeys.add(k));
  }

  // Kiểm tra địa chỉ dạng object { line1, line2, city, state, zipCode, country }
  if (record.address && typeof record.address === "object" && !Array.isArray(record.address)) {
    const addr = record.address as Record<string, unknown>;
    const parts = [
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country,
    ]
      .filter(Boolean)
      .map(String);

    if (parts.length > 0) {
      items.push({
        key: "addressObject",
        label: t("forms.fields.address", { defaultValue: "Địa chỉ" }),
        span: 2,
        value: parts.join(", "),
      });
    }
    processedKeys.add("address");
  }

  // 2. Thu thập danh sách keys cần duyệt
  const candidateKeys: string[] = [];
  if (definition) {
    for (const f of definition.fields) {
      if (!processedKeys.has(f.name)) {
        candidateKeys.push(f.name);
      }
    }
  }

  for (const k of Object.keys(record)) {
    if (!processedKeys.has(k) && !candidateKeys.includes(k)) {
      // Loại bỏ internal / audit / redundant fields
      if (
        [
          "__typename",
          "expectedVersion",
          "version",
          "customerName",
          "assignedTruckNumber",
          "assignedDispatcherName",
          "mainDriverName",
          "secondaryDriverName",
          "invoiceNumber",
          "truckNumber",
          "roleName",
        ].includes(k)
      ) {
        continue;
      }
      candidateKeys.push(k);
    }
  }

  // 3. Xử lý từng key
  for (const key of candidateKeys) {
    if (processedKeys.has(key)) continue;

    // Nếu key là Currency riêng và đã có Amount đi cùng, bỏ qua để không lặp
    if (key.endsWith("Currency")) {
      const amountKey = key.replace(/Currency$/, "Amount");
      if (record[amountKey] !== undefined) {
        continue;
      }
    }

    const rawValue = record[key];

    // Xử lý quan hệ: Nếu có trường Name/Number tương ứng, hiển thị giá trị trực quan
    if (key === "customerId" && record.customerName) {
      items.push({
        key,
        label: getLabel(key),
        value: (
          <Space direction="vertical" size={0}>
            <Text strong>{String(record.customerName)}</Text>
            {rawValue ? <Text type="secondary" style={{ fontSize: 12 }}>{String(rawValue)}</Text> : null}
          </Space>
        ),
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "assignedTruckId" && record.assignedTruckNumber) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.assignedTruckNumber)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "truckId" && record.truckNumber) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.truckNumber)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "assignedDispatcherId" && record.assignedDispatcherName) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.assignedDispatcherName)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "mainDriverId" && record.mainDriverName) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.mainDriverName)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "secondaryDriverId" && record.secondaryDriverName) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.secondaryDriverName)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "invoiceId" && record.invoiceNumber) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>#{String(record.invoiceNumber)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    if (key === "roleId" && record.roleName) {
      items.push({
        key,
        label: getLabel(key),
        value: <Text strong>{String(record.roleName)}</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    // Giá trị rỗng
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      items.push({
        key,
        label: getLabel(key),
        value: <Text type="secondary">—</Text>,
      });
      processedKeys.add(key);
      continue;
    }

    // Status tag
    if (key === "status" || key.endsWith("Status")) {
      const statusStr = String(rawValue);
      const tone = statusTone(statusStr);
      const label = t(`forms.options.${statusStr.toLowerCase()}`, { defaultValue: statusStr });
      items.push({
        key,
        label: getLabel(key),
        value: <StatusTag label={label} tone={tone} />,
      });
      processedKeys.add(key);
      continue;
    }

    // Boolean
    if (typeof rawValue === "boolean") {
      items.push({
        key,
        label: getLabel(key),
        value: (
          <Tag color={rawValue ? "green" : "default"}>
            {rawValue ? t("common.yes", { defaultValue: "Có" }) : t("common.no", { defaultValue: "Không" })}
          </Tag>
        ),
      });
      processedKeys.add(key);
      continue;
    }

    // Tiền tệ kèm Currency
    if (key.endsWith("Amount") && typeof rawValue === "number") {
      const currencyKey = key.replace(/Amount$/, "Currency");
      const currency = String(record[currencyKey] || record.currency || "USD");
      items.push({
        key,
        label: getLabel(key),
        value: (
          <Text strong>
            {formatMoney(rawValue, {
              currency,
              locale,
            })}
          </Text>
        ),
      });
      processedKeys.add(key);
      processedKeys.add(currencyKey);
      continue;
    }

    // Ngày giờ (Date hoặc ISO Instant)
    if (
      typeof rawValue === "string" &&
      (ISO_DATE_ONLY_REGEX.test(rawValue) ||
        ISO_DATETIME_REGEX.test(rawValue) ||
        key.endsWith("Date") ||
        key.endsWith("At"))
    ) {
      if (ISO_DATE_ONLY_REGEX.test(rawValue)) {
        items.push({
          key,
          label: getLabel(key),
          value: formatDateOnly(rawValue, { locale }),
        });
      } else {
        try {
          items.push({
            key,
            label: getLabel(key),
            value: formatInstant(rawValue, {
              format: {
                day: "2-digit",
                hour: "2-digit",
                hourCycle: "h23",
                minute: "2-digit",
                month: "2-digit",
                year: "numeric",
              },
              locale,
            }),
          });
        } catch {
          items.push({
            key,
            label: getLabel(key),
            value: String(rawValue),
          });
        }
      }
      processedKeys.add(key);
      continue;
    }

    // Ghi chú / Diễn giải / Mô tả dài chiếm 2 cột
    const isLongText =
      ["notes", "description", "reason", "resolution"].includes(key) ||
      (typeof rawValue === "string" && rawValue.length > 80);

    if (typeof rawValue === "object") {
      items.push({
        key,
        label: getLabel(key),
        span: 2,
        value: JSON.stringify(rawValue),
      });
    } else {
      items.push({
        key,
        label: getLabel(key),
        span: isLongText ? 2 : 1,
        value: String(rawValue),
      });
    }
    processedKeys.add(key);
  }

  return (
    <Descriptions
      bordered
      column={{ xs: 1, sm: 2, md: 2, lg: 2 }}
      size="middle"
      style={{ marginTop: 8 }}
    >
      {items.map((item) => (
        <Descriptions.Item key={item.key} label={item.label} span={item.span}>
          {item.value}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
};
