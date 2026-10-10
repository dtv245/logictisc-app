/**
 * LoadEdit — Màn hình chỉnh sửa đơn hàng theo bộ quy tắc UX:
 * Tự động đồng bộ dữ liệu vào form, hỗ trợ chống xung đột phiên bản (409) và footer dính đáy.
 */

import { Edit, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { useResourceEditContract } from "@/components/resources/useResourceEditContract";
import { LoadForm } from "@/features/loads/components/LoadForm";

export const LoadEdit = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps, queryResult } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    redirect: "show",
    resource: "loads",
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
      contract.reportError(error);
    },
  });

  const loadData = queryResult?.data?.data as Record<string, unknown> | undefined;
  const contract = useResourceEditContract("loads", form, loadData);

  return (
    <Edit
      breadcrumb={false}
      footerButtons={() => null}
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
      title="Chỉnh sửa đơn hàng"
    >
      {contract.feedback}
      <LoadForm
        isEdit={true}
        form={form}
        initialValues={loadData}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.loads.list)}
        onFinish={(values) =>
          formProps.onFinish?.(contract.prepare(values))
        }
      />
    </Edit>
  );
};
