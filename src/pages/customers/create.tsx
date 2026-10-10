/**
 * CustomerCreate — Màn hình tạo mới khách hàng (trang riêng fallback).
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { CustomerForm } from "@/features/customers/components/CustomerForm";

export const CustomerCreate = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: "list",
    resource: "customers",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  return (
    <Create
      breadcrumb={false}
      footerButtons={() => null}
      saveButtonProps={saveButtonProps}
      title="Thêm mới khách hàng"
    >
      <CustomerForm
        form={form}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.customers.list)}
        onFinish={(values) =>
          formProps.onFinish?.(buildResourceMutation("customers", values))
        }
      />
    </Create>
  );
};
