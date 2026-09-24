/** Hiển thị danh sách hóa đơn bằng Refine useTable. */
import { ResourceListPage } from "@components";
import type { Invoice } from "@/types/invoice.types";
import { invoiceColumns } from "@features/invoices/components/columns";
export const InvoiceList = () => <ResourceListPage<Invoice> columns={invoiceColumns} resource="invoices" />;
