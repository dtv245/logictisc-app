import type React from "react";
import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Form, Modal } from "antd";

import type { ApiError } from "@/types/api.types";
import { ResourceFormFields } from "./resources/ResourceFormFields";
import {
  isEditableResourceName,
  resourceFormDefinitions,
  type EditableResourceName,
} from "./resources/resourceForms";

interface ResourceEditModalProps {
  resource: string;
  id: string | number | null;
  visible: boolean;
  onClose: () => void;
}

export const ResourceEditModal = ({ resource, id, visible, onClose }: ResourceEditModalProps) => {
  const { modalProps, formProps, formLoading } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    resource,
    id: id ?? undefined,
    warnWhenUnsavedChanges: true,
    // When id is null, we shouldn't fetch
    queryOptions: {
      enabled: visible && id !== null,
    },
  });

  if (!isEditableResourceName(resource)) {
    return null;
  }

  const definition = resourceFormDefinitions[resource as EditableResourceName];

  return (
    <Modal
      {...modalProps}
      open={visible}
      onCancel={() => {
        if (modalProps.onCancel) modalProps.onCancel({} as React.MouseEvent<HTMLButtonElement>);
        onClose();
      }}
      title={`Edit ${resource}`}
      okText="Save"
      confirmLoading={formLoading}
    >
      <Form
        {...formProps}
        layout="vertical"
      >
        <ResourceFormFields definition={definition} />
      </Form>
    </Modal>
  );
};
