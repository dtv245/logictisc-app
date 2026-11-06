/**
 * Chi tiết hóa đơn: header, dòng hàng bất biến và các khoản thanh toán gắn với hóa đơn.
 *
 * Trước đây màn này dùng `ResourceShowPage` chung nên chỉ hiện các trường phẳng của
 * `InvoiceView` — không có dòng hàng, không có thanh toán, và không phân biệt hóa đơn
 * rated với hóa đơn legacy. Dòng hàng đọc từ `GET /api/invoices/{id}/lines`, thanh toán
 * đọc từ `GET /api/payments?invoiceId=…` (endpoint đã hỗ trợ sẵn filter này).
 */
import { Show } from "@refinedev/antd";
import { useCustom, useShow } from "@refinedev/core";
import { Alert, Button, Descriptions, Empty, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { isLegacyDraftInvoice } from "@/features/invoices/utils/invoiceMutability";
import { formatMoney } from "@formatters/money";
import type { ApiError, PagedResponse } from "@/types/api.types";
import type { Invoice, InvoiceLineDetail } from "@/types/invoice.types";
import type { PaymentResponse } from "@/types/payment.dto";

const toIntlLocale = (language: string): string =>
  language === "vi" ? "vi-VN" : "en-US";

const money = (amount: unknown, currency: unknown, locale: string): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) {
    return String(amount);
  }
  const code =
    typeof currency === "string" && currency.trim() ? currency : "USD";
  try {
    return formatMoney(value, { locale, currency: code });
  } catch {
    return String(amount);
  }
};

const text = (value: unknown): string =>
  value === null || value === undefined || String(value).trim() === ""
    ? "—"
    : String(value);

const InvoiceDetailBody = ({
  invoice,
  locale,
}: {
  invoice: Invoice;
  locale: string;
}) => {
  const { t } = useTranslation();

  const linesQuery = useCustom<InvoiceLineDetail[]>({
    url: `/api/invoices/${encodeURIComponent(invoice.id)}/lines`,
    method: "get",
    queryOptions: { staleTime: 60_000, retry: false },
  });

  const paymentsQuery = useCustom<PagedResponse<PaymentResponse>>({
    url: "/api/payments",
    method: "get",
    config: {
      query: {
        invoiceId: invoice.id,
        page: 1,
        pageSize: 50,
        orderBy: "recordedAt",
        descending: true,
      },
    },
    queryOptions: { staleTime: 60_000, retry: false },
  });

  const lineColumns = useMemo<ColumnsType<InvoiceLineDetail>>(
    () => [
      {
        dataIndex: "description",
        title: t("invoiceDetail.lineDescription"),
        render: (value: unknown) => text(value),
      },
      {
        dataIndex: "type",
        title: t("invoiceDetail.lineType"),
        width: 150,
        render: (value: unknown) => text(value),
      },
      {
        dataIndex: "quantity",
        title: t("invoiceDetail.lineQuantity"),
        width: 110,
        align: "right",
        render: (value: unknown) => text(value),
      },
      {
        dataIndex: "amountAmount",
        title: t("invoiceDetail.lineAmount"),
        width: 160,
        align: "right",
        render: (value: unknown, row) => (
          <span className="tabular-nums">
            {money(value, row.amountCurrency, locale)}
          </span>
        ),
      },
      {
        dataIndex: "taxAmount",
        title: t("invoiceDetail.lineTax"),
        width: 140,
        align: "right",
        render: (value: unknown, row) => (
          <span className="tabular-nums">
            {money(value, row.amountCurrency, locale)}
          </span>
        ),
      },
    ],
    [locale, t],
  );

  const paymentColumns = useMemo<ColumnsType<PaymentResponse>>(
    () => [
      {
        dataIndex: "status",
        title: t("invoiceDetail.paymentStatus"),
        width: 160,
        render: (value: unknown) => <Tag>{text(value)}</Tag>,
      },
      {
        dataIndex: "amountAmount",
        title: t("invoiceDetail.paymentAmount"),
        width: 160,
        align: "right",
        render: (value: unknown, row) => (
          <span className="tabular-nums">
            {money(value, row.amountCurrency, locale)}
          </span>
        ),
      },
      {
        dataIndex: "recordedAt",
        title: t("invoiceDetail.paymentRecordedAt"),
        width: 200,
        render: (value: unknown) => text(value),
      },
      {
        dataIndex: "referenceNumber",
        title: t("invoiceDetail.paymentReference"),
        render: (value: unknown) => text(value),
      },
    ],
    [locale, t],
  );

  const lines = linesQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data?.items ?? [];
  const isRated = Boolean(invoice.invoicePurpose || invoice.ratingSnapshotId);

  return (
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
      <Descriptions.Item label={t("columns.invoices.number")}>
        {text(invoice.number)}
      </Descriptions.Item>
      <Descriptions.Item label={t("columns.invoices.type")}>
        {text(invoice.type)}
      </Descriptions.Item>
      <Descriptions.Item label={t("columns.invoices.status")}>
        <Tag>{text(invoice.status)}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label={t("columns.invoices.customerName")}>
        {text(invoice.customerName)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.purpose")}>
        {text(invoice.invoicePurpose)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.snapshot")}>
        {text(invoice.ratingSnapshotId)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.parent")}>
        {text(invoice.parentInvoiceId)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.chain")}>
        {text(invoice.billingChainId)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.subtotal")}>
        {money(invoice.subtotalAmount, invoice.subtotalCurrency, locale)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.taxTotal")}>
        {money(invoice.taxTotalAmount, invoice.taxTotalCurrency, locale)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.total")}>
        {money(invoice.totalAmount, invoice.totalCurrency, locale)}
      </Descriptions.Item>
      <Descriptions.Item label={t("columns.invoices.dueDate")}>
        {text(invoice.dueDate)}
      </Descriptions.Item>
      <Descriptions.Item label={t("invoiceDetail.notes")}>
        {text(invoice.notes)}
      </Descriptions.Item>

      <Descriptions.Item span={2} label={t("invoiceDetail.lines")}>
        {isRated && (
          <Alert
            type="info"
            showIcon
            message={t("invoiceDetail.immutable")}
            style={{ marginBottom: 12 }}
          />
        )}
        {linesQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message={t("crud.loadError")}
            action={
              <Button size="small" onClick={() => void linesQuery.refetch()}>
                {t("actions.retry")}
              </Button>
            }
          />
        ) : (
          <Table<InvoiceLineDetail>
            columns={lineColumns}
            dataSource={lines}
            loading={linesQuery.isLoading}
            locale={{ emptyText: t("invoiceDetail.noLines") }}
            pagination={false}
            rowKey="id"
            size="small"
          />
        )}
      </Descriptions.Item>

      <Descriptions.Item span={2} label={t("invoiceDetail.payments")}>
        {paymentsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message={t("crud.loadError")}
            action={
              <Button size="small" onClick={() => void paymentsQuery.refetch()}>
                {t("actions.retry")}
              </Button>
            }
          />
        ) : (
          <Table<PaymentResponse>
            columns={paymentColumns}
            dataSource={payments}
            loading={paymentsQuery.isLoading}
            locale={{ emptyText: t("invoiceDetail.noPayments") }}
            pagination={false}
            rowKey="id"
            size="small"
          />
        )}
      </Descriptions.Item>
    </Descriptions>
  );
};

export const InvoiceShow = () => {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);
  const { queryResult } = useShow<Invoice, ApiError>({
    resource: "invoices",
  });

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry")}
          </Button>
        }
        description={queryResult.error?.message}
        message={t("crud.loadError")}
        showIcon
        type="error"
      />
    );
  }

  const record = queryResult.data?.data;
  const canEdit = record ? isLegacyDraftInvoice(record) : false;

  return (
    <Show
      isLoading={queryResult.isLoading}
      canDelete={canEdit}
      canEdit={canEdit}
    >
      {record ? (
        <InvoiceDetailBody invoice={record} locale={locale} />
      ) : (
        <Empty />
      )}
    </Show>
  );
};
