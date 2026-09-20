/**
 * Creates a backend-confirmed resource through Refine's Ant Design useForm.
 */

import { Create, useForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form } from "antd";

import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  createResourceFormInitialValues,
  isEditableResourceName,
  resourceFormDefinitions,
  type EditableResourceName,
} from "./resources/resourceForms";

interface ResourceCreatePageProps {
  resource?: EditableResourceName;
}

type ResourceFormValues = Record<string, unknown>;

export const ResourceCreatePage = ({ resource: resourceProp }: ResourceCreatePageProps) => {
  const resourceName = resourceProp ?? "__unsupported__";
  // useForm delegates mutation, notifications, invalidation and navigation to
  // Refine instead of rebuilding that server-state lifecycle in the page.
  const { formProps, saveButtonProps } = useForm<
    BaseRecord,
    ApiError,
    ResourceFormValues
  >({ action: "create", redirect: "list", resource: resourceName });
  if (!isEditableResourceName(resourceName)) {
    throw new Error(`RESOURCE_FORM_NOT_CONFIGURED:${resourceName}`);
  }
  const definition = resourceFormDefinitions[resourceName];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        initialValues={createResourceFormInitialValues(definition)}
        layout="vertical"
      >
        <ResourceFormFields definition={definition} />
      </Form>
    </Create>
  );
};
