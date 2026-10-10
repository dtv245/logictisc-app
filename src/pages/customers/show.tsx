/**
 * CustomerShow — Trang chi tiết khách hàng theo quy tắc UX:
 * Header với StatusTag, thẻ thông tin tổng quan dạng Descriptions column={3}.
 */

import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import type { ApiError } from "@/types/api.types";
import type { Customer } from "@/types/customer.types";

export const CustomerShow = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow<Customer, ApiError>({ resource: "customers" });

  const customer = queryResult.data?.data;

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry", "Thử lại")}
          </Button>
        }
        description={queryResult.error?.message}
        message="Không thể tải thông tin khách hàng"
        showIcon
        type="error"
      />
    );
  }

  if (queryResult.isLoading || !customer) {
    return (
      <Show isLoading={true}>
        <div style={{ minHeight: 200 }} />
      </Show>
    );
  }

  const fullAddress = [
    customer.addressLine1,
    customer.addressLine2,
    customer.addressCity,
    customer.addressState,
    customer.addressZipCode,
    customer.addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Show
      isLoading={queryResult.isLoading}
      title={
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {customer.name}
          </Typography.Title>
          <StatusTag label={customer.status} tone={statusTone(customer.status)} />
          {customer.isVatExempt && <Tag color="blue">Miễn thuế VAT</Tag>}
        </Space>
      }
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 8,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
        title="Thông tin đối tác khách hàng"
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Tên khách hàng">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <StatusTag label={customer.status} tone={statusTone(customer.status)} />
          </Descriptions.Item>
          <Descriptions.Item label="Mã số thuế">{customer.taxId || "—"}</Descriptions.Item>

          <Descriptions.Item label="Email liên hệ">{customer.email || "—"}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{customer.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Miễn thuế VAT">
            {customer.isVatExempt ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>}
          </Descriptions.Item>

          <Descriptions.Item label="Địa chỉ trụ sở" span={3}>
            {fullAddress || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Ghi chú" span={3}>
            {customer.notes || "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Show>
  );
};
