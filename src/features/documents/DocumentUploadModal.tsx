import { useState } from "react";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Upload, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useTranslation } from "react-i18next";
import { applyBackendFieldErrors, type FieldErrorFormTarget } from "@/forms/backendFieldErrors";
import { useDocumentUpload } from "./useDocumentUpload";
import { DOCUMENT_UPLOAD_CONTRACT_CONFIRMED } from "./documents.api";
import type { Document, DocumentType } from "@/types/document.types";

export interface DocumentUploadModalProps {
  trigger?: (show: () => void) => React.ReactNode;
  defaultValues?: {
    type?: DocumentType;
    loadId?: string;
    truckId?: string;
    employeeId?: string;
    description?: string;
  };
  onSuccess?: (document: Document) => void;
}

interface FormValues {
  file?: unknown;
  type: DocumentType;
  description?: string;
  loadId?: string;
  truckId?: string;
  employeeId?: string;
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; labelKey: string }> = [
  { value: "bill_of_lading", labelKey: "documents.upload.types.bill_of_lading" },
  { value: "proof_of_delivery", labelKey: "documents.upload.types.proof_of_delivery" },
  { value: "driver_license", labelKey: "documents.upload.types.driver_license" },
  { value: "inspection", labelKey: "documents.upload.types.inspection" },
  { value: "receipt", labelKey: "documents.upload.types.receipt" },
  { value: "photo", labelKey: "documents.upload.types.photo" },
  { value: "signature", labelKey: "documents.upload.types.signature" },
  { value: "other", labelKey: "documents.upload.types.other" },
];

export const DocumentUploadModal = (props: DocumentUploadModalProps) =>
  DOCUMENT_UPLOAD_CONTRACT_CONFIRMED ? <ConfirmedDocumentUploadModal {...props} /> : null;

const ConfirmedDocumentUploadModal = ({
  trigger,
  defaultValues,
  onSuccess,
}: DocumentUploadModalProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<FormValues>();

  const { upload, isLoading } = useDocumentUpload({
    onSuccess: (doc) => {
      message.success(t("documents.upload.uploadSuccess"));
      handleClose();
      onSuccess?.(doc);
    },
    onError: (err) => {
      if (err.errors) {
        applyBackendFieldErrors(form as unknown as FieldErrorFormTarget, err.errors);
      }
      message.error(err.message || t("documents.upload.uploadFailed"));
    },
  });

  const handleOpen = () => {
    form.resetFields();
    if (defaultValues) {
      form.setFieldsValue(defaultValues);
    }
    setFileList([]);
    setOpen(true);
  };

  const handleClose = () => {
    if (isLoading) return;
    setOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const rawFile = (fileList[0]?.originFileObj ?? fileList[0]) as unknown as File | undefined;

      if (!rawFile) {
        form.setFields([
          {
            name: "file",
            errors: [t("documents.upload.fileRequired")],
          },
        ]);
        return;
      }

      await upload({
        file: rawFile,
        type: values.type,
        description: values.description,
        loadId: values.loadId,
        truckId: values.truckId,
        employeeId: values.employeeId,
      });
    } catch {
      // Form validation errors or upload error handled in hook
    }
  };

  const typeOptions = DOCUMENT_TYPE_OPTIONS.map((item) => ({
    value: item.value,
    label: t(item.labelKey),
  }));

  return (
    <>
      {trigger ? (
        trigger(handleOpen)
      ) : (
        <Button
          icon={<UploadOutlined />}
          onClick={handleOpen}
          type="primary"
        >
          {t("documents.upload.button")}
        </Button>
      )}

      <Modal
        confirmLoading={isLoading}
        destroyOnClose
        okButtonProps={{ disabled: isLoading }}
        okText={t("documents.upload.submit")}
        onCancel={handleClose}
        onOk={handleSubmit}
        open={open}
        title={t("documents.upload.title")}
      >
        <Form
          form={form}
          initialValues={defaultValues}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="file"
            label={t("documents.upload.file")}
            required
          >
            <Upload.Dragger
              beforeUpload={(file) => {
                setFileList([file]);
                form.setFields([{ name: "file", errors: [] }]);
                return false;
              }}
              fileList={fileList}
              maxCount={1}
              onRemove={() => {
                setFileList([]);
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {t("documents.upload.draggerText")}
              </p>
              <p className="ant-upload-hint">
                {t("documents.upload.draggerHint")}
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item
            label={t("documents.upload.type")}
            name="type"
            rules={[
              {
                required: true,
                message: t("documents.upload.typeRequired"),
              },
            ]}
          >
            <Select
              options={typeOptions}
              placeholder={t("documents.upload.typePlaceholder")}
            />
          </Form.Item>

          <Form.Item
            label={t("documents.upload.description")}
            name="description"
          >
            <Input.TextArea
              placeholder={t("documents.upload.descriptionPlaceholder")}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label={t("documents.upload.loadId")}
            name="loadId"
          >
            <Input placeholder="load-id" />
          </Form.Item>

          <Form.Item
            label={t("documents.upload.truckId")}
            name="truckId"
          >
            <Input placeholder="truck-id" />
          </Form.Item>

          <Form.Item
            label={t("documents.upload.employeeId")}
            name="employeeId"
          >
            <Input placeholder="employee-id" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
