/**
 * TruckCreate — Màn hình thêm mới phương tiện (xe tải) theo quy tắc 2 cột.
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { TruckForm } from "@/features/trucks/components/TruckForm";

export const TruckCreate = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: "list",
    resource: "trucks",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  return (
    <Create
      breadcrumb={false}
      footerButtons={() => null}
      saveButtonProps={saveButtonProps}
      title="Thêm mới phương tiện (Xe tải)"
    >
      <TruckForm
        form={form}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.trucks.list)}
        onFinish={(values) =>
          formProps.onFinish?.(buildResourceMutation("trucks", values))
        }
      />
    </Create>
  );
};
