/**
 * TerminalEdit — Màn hình chỉnh sửa thông tin Bến bãi (Terminal).
 */

import { Edit, useForm } from "@refinedev/antd";
import { useNavigate } from "react-router-dom";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import type { Terminal } from "@/types/terminal.types";
import { routes } from "@constants/routes";
import { buildResourceMutation } from "@/components/resources/resourceMutation";
import { TerminalForm } from "@/features/terminals/components/TerminalForm";

export const TerminalEdit = () => {
  const navigate = useNavigate();

  const { form, formProps, saveButtonProps, queryResult } = useForm<
    Terminal,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    redirect: "show",
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

  const terminalData = queryResult?.data?.data;

  return (
    <Edit
      breadcrumb={false}
      footerButtons={() => null}
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
      title="Chỉnh sửa bến bãi (Terminal)"
    >
      <TerminalForm
        isEdit={true}
        form={form}
        initialValues={terminalData}
        saveButtonProps={saveButtonProps}
        onCancel={() => navigate(routes.resources.terminals.list)}
        onFinish={(values) =>
          formProps.onFinish?.(
            buildResourceMutation(
              "terminals",
              values as unknown as Record<string, unknown>,
              terminalData as unknown as Record<string, unknown> | undefined,
            ),
          )
        }
      />
    </Edit>
  );
};
