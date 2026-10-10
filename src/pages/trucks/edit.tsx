/**
 * TruckEdit — Màn hình chỉnh sửa thông số phương tiện (xe tải).
 */

import { Edit, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { useResourceEditContract } from "@/components/resources/useResourceEditContract";
import { TruckForm } from "@/features/trucks/components/TruckForm";

export const TruckEdit = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps, queryResult } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    redirect: "show",
    resource: "trucks",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
      contract.reportError(error);
    },
  });

  const truckData = queryResult?.data?.data as Record<string, unknown> | undefined;
  const contract = useResourceEditContract("trucks", form, truckData);

  return (
    <Edit
      breadcrumb={false}
      footerButtons={() => null}
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
      title="Chỉnh sửa thông số phương tiện"
    >
      {contract.feedback}
      <TruckForm
        isEdit={true}
        form={form}
        initialValues={truckData}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.trucks.list)}
        onFinish={(values) =>
          formProps.onFinish?.(contract.prepare(values))
        }
      />
    </Edit>
  );
};
