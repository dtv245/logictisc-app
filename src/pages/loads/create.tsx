/**
 * LoadCreate — Màn hình tạo đơn hàng mới theo bộ quy tắc UX:
 * Form đa nhóm, mục lục Anchor, tái sử dụng AddressFields và footer dính đáy.
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Button, Space } from "antd";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors, hasBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { LoadForm } from "@/features/loads/components/LoadForm";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";

type CreateIntent = "list" | "continue" | "dispatch";

export const LoadCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const intentRef = useRef<CreateIntent>("list");

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: false,
    resource: "loads",
    warnWhenUnsavedChanges: true,
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
      intentRef.current = "list";
      applyBackendFieldErrors(form, error.errors ?? {});
    },
    onMutationSuccess: () => {
      const intent = intentRef.current;
      intentRef.current = "list";

      if (intent === "continue") {
        form.resetFields();
        return;
      }
      if (intent === "dispatch") {
        navigate(routes.tmsFlow.dispatch);
        return;
      }
      navigate(routes.resources.loads.list);
    },
  });

  const submitWithIntent = (intent: CreateIntent) => {
    intentRef.current = intent;
    form.submit();
  };

  // Ctrl/Cmd + S lưu nhanh nhưng vẫn đi qua toàn bộ validation của form.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      if (saveButtonProps.loading) return;
      intentRef.current = "list";
      form.submit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, saveButtonProps.loading]);

  return (
    <Create
      breadcrumb={false}
      footerButtons={() => null}
      saveButtonProps={saveButtonProps}
      title="Tạo đơn hàng mới"
    >
      <LoadForm
        footerActions={
          <Space>
            <Button
              disabled={Boolean(saveButtonProps.loading)}
              onClick={() => submitWithIntent("continue")}
            >
              Lưu & tạo tiếp
            </Button>
            <Button
              disabled={Boolean(saveButtonProps.loading)}
              onClick={() => submitWithIntent("dispatch")}
            >
              Lưu & điều xe
            </Button>
          </Space>
        }
        form={form}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.loads.list)}
        onFinishFailed={() => {
          intentRef.current = "list";
        }}
        onFinish={(values) =>
          formProps.onFinish?.(buildResourceMutation("loads", values))
        }
      />
    </Create>
  );
};
