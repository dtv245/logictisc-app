/**
 * LoadCreate — Màn hình tạo đơn hàng mới theo bộ quy tắc UX:
 * Form đa nhóm, mục lục Anchor, tái sử dụng AddressFields và footer dính đáy.
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { LoadForm } from "@/features/loads/components/LoadForm";

export const LoadCreate = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: "list",
    resource: "loads",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  return (
    <Create
      breadcrumb={false}
      footerButtons={() => null}
      saveButtonProps={saveButtonProps}
      title="Tạo đơn hàng mới"
    >
      <LoadForm
        form={form}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.loads.list)}
        onFinish={(values) =>
          formProps.onFinish?.(buildResourceMutation("loads", values))
        }
      />
    </Create>
  );
};
