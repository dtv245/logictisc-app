/**
 * LoadCreate — Màn hình tạo đơn hàng mới theo bộ quy tắc UX:
 * Form đa nhóm, mục lục Anchor, tái sử dụng AddressFields và footer dính đáy.
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { LoadForm } from "@/features/loads/components/LoadForm";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

export const LoadCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: "list",
    resource: "loads",
    // Lỗi từng field đã hiển thị ngay dưới ô nhập; toast chung chỉ gây nhiễu
    // và từng chứa tiêu đề "Đã xảy ra lỗi (mã: )" không có mã.
    errorNotification: (error) => {
      if (hasBackendFieldErrors(error)) return false;
      return createApiErrorNotification(error, t, {
        operation: "create",
        resourceLabel: t("resources.loads", "đơn hàng"),
      });
    },
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
