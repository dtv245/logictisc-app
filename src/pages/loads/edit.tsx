/**
 * LoadEdit — Màn hình chỉnh sửa đơn hàng theo bộ quy tắc UX:
 * Tự động đồng bộ dữ liệu vào form, hỗ trợ chống xung đột phiên bản (409) và footer dính đáy.
 */

import { Edit, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { useResourceEditContract } from "@/components/resources/useResourceEditContract";
import { LoadForm } from "@/features/loads/components/LoadForm";

export const LoadEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Tự động cuộn và focus vào trường dữ liệu được chỉ định từ AI GAP widget
  useEffect(() => {
    const focusField = new URLSearchParams(location.search).get("focusField");
    if (focusField && !queryResult?.isLoading) {
      const timer = setTimeout(() => {
        const target =
          document.getElementById(focusField) ||
          document.querySelector(`[name="${focusField}"]`) ||
          document.querySelector(`input[id*="${focusField}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          if ("focus" in target && typeof (target as HTMLElement).focus === "function") {
            (target as HTMLElement).focus();
          }
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.search, queryResult?.isLoading]);

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
