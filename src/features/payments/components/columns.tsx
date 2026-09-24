/** Định nghĩa columns cho Payment resource. */
import { createCrudColumns } from "@components/crudColumns";
import type { Payment } from "@/types/payment.types";
export const paymentColumns = createCrudColumns<Payment>("payments", [
  { dataIndex: "status", titleKey: "columns.payments.status", status: true, sorter: true },
  { dataIndex: "referenceNumber", titleKey: "columns.payments.referenceNumber", sorter: true },
  { dataIndex: "invoiceId", titleKey: "columns.payments.invoiceId" },
  { dataIndex: "recordedAt", titleKey: "columns.payments.recordedAt", sorter: true },
]);
