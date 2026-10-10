/**
 * CustomerList — Danh sách khách hàng với nút thêm nhanh bằng Modal (1 cột, ≤6 trường).
 */

import { CreateButton } from "@refinedev/antd";
import { ResourceListPage } from "@components";
import type { Customer } from "@/types/customer.types";
import { customerColumns } from "@features/customers/components/columns";
import { CustomerCreateModal } from "@features/customers/components/CustomerCreateModal";

export const CustomerList = () => (
  <ResourceListPage<Customer>
    columns={customerColumns}
    resource="customers"
    headerButtons={() => (
      <CustomerCreateModal
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
