/**
 * Loads and updates a backend-confirmed resource through Refine useForm.
 */

import { Edit, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form } from "antd";

import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  isEditableResourceName,
  resourceFormDefinitions,
  type EditableResourceName,
} from "./resources/resourceForms";

interface ResourceEditPageProps {
  resource?: EditableResourceName;
}

type ResourceFormValues = Record<string, unknown>;

export const ResourceEditPage = ({ resource: resourceProp }: ResourceEditPageProps) => {
  const resourceName = resourceProp ?? "__unsupported__";
  // useForm owns getOne, asynchronous form population and update cache
  // invalidation; the form definition only declares the backend request fields.
  const { form, formProps, saveButtonProps, queryResult } = useForm<
    BaseRecord,
    ApiError,
    ResourceFormValues
  >({
    action: "edit",
    redirect: "show",
    resource: resourceName,
    onMutationError: (error) => {
      applyBackendFieldErrors(form, error.errors ?? {});
    },
  });
  if (!isEditableResourceName(resourceName)) {
    throw new Error(`RESOURCE_FORM_NOT_CONFIGURED:${resourceName}`);
  }

  return (
    <Edit
      isLoading={queryResult?.isLoading}
      saveButtonProps={saveButtonProps}
    >
      <Form {...formProps} layout="vertical">
        {/* Trang route rộng nên xếp 2 cột; modal vẫn 1 cột — xem `ResourceFormFields`. */}
        <ResourceFormFields
          columns={2}
          definition={resourceFormDefinitions[resourceName]}
        />
      </Form>
    </Edit>
  );
};
