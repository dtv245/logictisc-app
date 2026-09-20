import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form, Modal } from "antd";
import type { ReactNode } from "react";

import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  createResourceFormInitialValues,
  isEditableResourceName,
  resourceFormDefinitions,
  type EditableResourceName,
} from "./resources/resourceForms";

interface ResourceCreateModalProps {
  resource: string;
  trigger: (show: () => void) => ReactNode;
}

export const ResourceCreateModal = ({ resource, trigger }: ResourceCreateModalProps) => {
  const { modalProps, formProps, show, formLoading } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "create",
    resource,
    warnWhenUnsavedChanges: true,
  });

  if (!isEditableResourceName(resource)) {
    return <>{trigger(() => {})}</>;
  }

  const definition = resourceFormDefinitions[resource as EditableResourceName];

  return (
    <>
      {trigger(show)}
      <Modal
        {...modalProps}
        title={`Create ${resource}`}
        okText="Create"
        confirmLoading={formLoading}
      >
        <Form
          {...formProps}
          initialValues={createResourceFormInitialValues(definition)}
          layout="vertical"
        >
          <ResourceFormFields definition={definition} />
        </Form>
      </Modal>
    </>
  );
};
