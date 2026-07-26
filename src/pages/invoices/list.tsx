/** Hiển thị danh sách hóa đơn bằng Refine useTable. */
import { ResourceListPage } from "../../components";
import type { Invoice } from "../../types/finance";
import { invoiceColumns } from "./columns";
export const InvoiceList = () => <ResourceListPage<Invoice> columns={invoiceColumns} resource="invoices" />;
