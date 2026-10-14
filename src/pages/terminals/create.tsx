/**
 * TerminalCreate — Màn hình tạo mới Bến bãi (Terminal).
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { TerminalForm } from "@/features/terminals/components/TerminalForm";

export const TerminalCreate = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    redirect: "list",
    resource: "terminals",
    onMutationError: (error) => {
      if (error.statusCode === 409 || error.code === "CONFLICT") {
        form.setFields([
          {
            name: "code",
            errors: ["Mã UN/LOCODE này đã tồn tại trên hệ thống"],
          },
        ]);
      }
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });

  return (
    <Create
      breadcrumb={false}
      footerButtons={() => null}
      saveButtonProps={saveButtonProps}
      title="Thêm mới bến bãi (Terminal)"
    >
      <TerminalForm
        form={form}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.terminals.list)}
        onFinish={(values) =>
          formProps.onFinish?.(
            buildResourceMutation(
              "terminals",
              values as unknown as Record<string, unknown>,
            ),
          )
        }
      />
    </Create>
  );
};
