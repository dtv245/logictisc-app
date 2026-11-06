import { PlusOutlined } from "@ant-design/icons";
import { useCan, useDelete } from "@refinedev/core";
import { Alert, Button } from "antd";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerList as CustomerListView, type CustomerListRecord } from "@/components/customers/CustomerList";
import { CustomerCreateModal } from "@/components/customers/CustomerCreateModal";
import { routes } from "@/constants/routes";
import { DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import type { ApiError } from "@/types/api.types";
import type { Customer } from "@/types/customer.types";
import { useEntityFilters } from "@/hooks/useEntityFilters";
import { usePaginatedTable } from "@/hooks/usePaginatedTable";

export const CustomerListPage = () => {
  const navigate = useNavigate();
  const table = usePaginatedTable<Customer, ApiError>({
    resource: "customers",
  });
  const entityFilters = useEntityFilters("customers", table);
  const { mutate: removeCustomer } = useDelete();

  const { data: createPermission } = useCan({ action: "create", resource: "customers" });
  const { data: editPermission } = useCan({ action: "edit", resource: "customers" });
  const { data: deletePermission } = useCan({ action: "delete", resource: "customers" });

  const onView = useCallback((customer: CustomerListRecord) => {
    navigate(routes.resources.customers.show.replace(":id", customer.id));
  }, [navigate]);

  const onEdit = useCallback((customer: CustomerListRecord) => {
    navigate(routes.resources.customers.edit.replace(":id", customer.id));
  }, [navigate]);

  const onDelete = useCallback((customer: CustomerListRecord) => {
    removeCustomer({
      id: customer.id,
      mutationMode: "pessimistic",
      resource: "customers",
    });
  }, [removeCustomer]);

  const customers = (table.tableProps.dataSource ?? []) as CustomerListRecord[];
  const queryError = table.tableQueryResult.error;
  const pageSize = table.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  const current = table.current ?? 1;

  return (
    <div className="resource-list-card">
      <CustomerListView
        canDelete={deletePermission?.can === true}
        canEdit={editPermission?.can === true}
        createButton={createPermission?.can === true ? (
          <CustomerCreateModal
            trigger={(show) => (
              <Button icon={<PlusOutlined />} onClick={show} type="primary">
                Thêm khách hàng
              </Button>
            )}
          />
        ) : null}
        customers={customers}
        error={queryError ? (
          <Alert
            action={<Button onClick={() => void table.tableQueryResult.refetch()} size="small">Thử lại</Button>}
            className="customer-list-error"
            message="Không thể tải danh sách khách hàng"
            description={queryError.message}
            showIcon
            type="error"
          />
        ) : null}
        loading={table.tableQueryResult.isLoading}
        onDelete={onDelete}
        onEdit={onEdit}
        onSearch={(value) => entityFilters.setFilter("search", value || undefined)}
        onStatusChange={(value) => entityFilters.setFilter("status", value)}
        onView={onView}
        pagination={{
          current,
          pageSize,
          total: table.tableQueryResult.data?.total ?? 0,
          onChange: (page, nextPageSize) => {
            if (nextPageSize !== pageSize) {
              table.setPageSize(nextPageSize);
              table.setCurrent(1);
            } else {
              table.setCurrent(page);
            }
          },
        }}
        searchValue={entityFilters.value.search}
        statusValue={entityFilters.value.status}
      />
    </div>
  );
};

export const CustomerList = CustomerListPage;
