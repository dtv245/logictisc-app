/**
 * CustomerEdit — Màn hình chỉnh sửa thông tin khách hàng.
 */

import { Edit, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { useResourceEditContract } from "@/components/resources/useResourceEditContract";
import { CustomerForm } from "@/features/customers/components/CustomerForm";

export const CustomerEdit = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps, queryResult } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    redirect: "show",
    resource: "customers",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
      contract.reportError(error);
    },
  });

  const customerData = queryResult?.data?.data as Record<string, unknown> | undefined;
  const contract = useResourceEditContract("customers", form, customerData);

  return (
    <Edit
      breadcrumb={false}
      footerButtons={() => null}
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
      title="Chỉnh sửa thông tin khách hàng"
    >
      {contract.feedback}
      <CustomerForm
        isEdit={true}
        form={form}
        initialValues={customerData}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.customers.list)}
        onFinish={(values) =>
          formProps.onFinish?.(contract.prepare(values))
        }
      />
    </Edit>
  );
};
