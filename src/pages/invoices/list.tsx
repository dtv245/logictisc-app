/** Hiển thị danh sách hóa đơn bằng Refine useTable kèm Popup tạo mới riêng theo hợp đồng Swagger. */
import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@/components/ResourceListPage";
import { InvoiceCreateModal } from "@/components/invoices/InvoiceCreateModal";
import type { Invoice } from "@/types/invoice.types";
import { invoiceColumns } from "@features/invoices/components/columns";

export const InvoiceList = () => (
  <ResourceListPage<Invoice>
    columns={invoiceColumns}
    resource="invoices"
    headerButtons={() => (
      <InvoiceCreateModal
        trigger={(show) => (
          <CreateButton
            onClick={(e) => {
              e.preventDefault();
              show();
            }}
          />
        )}
      />
    )}
  />
);
