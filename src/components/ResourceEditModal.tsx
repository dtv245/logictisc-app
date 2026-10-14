import { useModalForm } from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { useWarnAboutChange } from "@refinedev/core";
import { Alert, App, Button, Col, Form, Row, Skeleton, Space, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResourceModalFrame } from "./resources/ResourceModalFrame";

import { useResourceEditContract } from "./resources/useResourceEditContract";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import { applyBackendFieldErrors } from "@/forms/backendFieldErrors";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { ApiError } from "@/types/api.types";
import { createApiErrorNotification } from "@/utils/apiErrorNotification";
import {
  ResourceFormFields,
  useResourceFormSections,
} from "./resources/ResourceFormFields";
import {
  findSectionKeyForField,
  isEditableResourceName,
  resourceFormDefinitions,
} from "./resources/resourceForms";

interface ResourceEditModalProps {
  resource: string;
  id: string | number | null;
  visible: boolean;
  onClose: () => void;
}

export const ResourceEditModal = ({ resource, id, visible, onClose }: ResourceEditModalProps) => {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { setWarnWhen } = useWarnAboutChange();
  const resourceLabel = t(`resources.${resource}`);

  const isEditable = isEditableResourceName(resource);
  const definition = isEditable ? resourceFormDefinitions[resource] : null;

  const { expandedKeys, toggleSection, openSection, setExpandedKeys } =
    useResourceFormSections(definition ?? { fields: [] });

  const { form, formProps, formLoading, close, queryResult } = useModalForm<
    BaseRecord,
    ApiError,
    Record<string, unknown>
  >({
    action: "edit",
    resource,
    id: id ?? undefined,
    mutationMode: "pessimistic",
    warnWhenUnsavedChanges: true,
    queryOptions: {
      enabled: visible && id !== null,
    },
    successNotification: () => ({
      key: `edit-${resource}`,
      message: t("notifications.editSuccess", { resource: resourceLabel }),
      description: t("notifications.success"),
      type: "success",
    }),
    errorNotification: (error) => createApiErrorNotification(error, t, {
      key: `edit-${resource}`,
      operation: "update",
      resourceLabel,
    }),
    onMutationError: (error) => {
      const backendErrors = error.errors ?? {};
      const firstErrorField = Object.keys(backendErrors)[0];
      if (firstErrorField && definition) {
        const targetSection = findSectionKeyForField(definition, firstErrorField);
        if (targetSection) {
          openSection(targetSection);
        }
      }
      applyBackendFieldErrors(form, backendErrors);
      contract.reportError(error);
    },
  });

  const record = queryResult?.data?.data as Record<string, unknown> | undefined;
  const contract = useResourceEditContract(resource, form, record, visible);

  const initialValuesRef = useRef<Record<string, unknown>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const isDirty = dirtyFields.size > 0;

  // Đóng thật: dọn state nội bộ Refine và báo cho component cha sau khi xác nhận bỏ thay đổi
  const closeModal = useCallback(() => {
    close();
    setDirtyFields(new Set());
    setWarnWhen(false);
    onClose();
  }, [close, onClose, setWarnWhen]);

  const discardConfirm = useDiscardConfirm(closeModal);

  // Dirty-check chính xác: so sánh với giá trị snapshot gốc
  const recomputeDirty = useCallback(
    (currentVals: Record<string, unknown>) => {
      if (!definition) return;
      const nextDirty = new Set<string>();
      const init = initialValuesRef.current;
      for (const f of definition.fields) {
        const key = f.name;
        let cur = currentVals[key] === "" || currentVals[key] === null ? undefined : currentVals[key];
        let ori = init[key] === "" || init[key] === null ? undefined : init[key];
        if (Array.isArray(cur)) cur = cur.join(", ");
        if (Array.isArray(ori)) ori = ori.join(", ");
        if (JSON.stringify(cur) !== JSON.stringify(ori)) {
          nextDirty.add(key);
        }
      }
      setDirtyFields(nextDirty);
      setWarnWhen(nextDirty.size > 0);
    },
    [definition, setWarnWhen],
  );

  // Reset form khi chuyển sang record ID khác hoặc khi modal đóng (AC: không rò dữ liệu giữa A và B)
  const prevIdRef = useRef<string | number | null>(id);
  useEffect(() => {
    if (prevIdRef.current !== id || !visible) {
      prevIdRef.current = id;
      form.resetFields();
      setDirtyFields(new Set());
      initialValuesRef.current = {};
      setWarnWhen(false);
    }
  }, [id, visible, form, setWarnWhen]);

  // Nạp initialValues khi record của ID tương ứng đã sẵn sàng
  useEffect(() => {
    if (visible && record && String(record.id) === String(id) && definition) {
      const initVals: Record<string, unknown> = {};
      definition.fields.forEach((f) => {
        initVals[f.name] = record[f.name] ?? (f.control === "boolean" ? false : undefined);
      });
      if (record.address && typeof record.address === "object" && !Array.isArray(record.address)) {
        const addr = record.address as Record<string, unknown>;
        if (addr.line1 !== undefined) initVals.addressLine1 = addr.line1;
        if (addr.line2 !== undefined) initVals.addressLine2 = addr.line2;
        if (addr.city !== undefined) initVals.addressCity = addr.city;
        if (addr.state !== undefined) initVals.addressState = addr.state;
        if (addr.zipCode !== undefined) initVals.addressZipCode = addr.zipCode;
        if (addr.country !== undefined) initVals.addressCountry = addr.country;
      }
      initialValuesRef.current = initVals;
      form.setFieldsValue(initVals as Parameters<typeof form.setFieldsValue>[0]);
      if (definition.sections) {
        const isAdr = Boolean(record.adrEquipmentIsAdrCertified);
        const openKeys = definition.sections
          .filter((s) => !s.defaultCollapsed || (s.key === "hazmatAdr" && isAdr))
          .map((s) => s.key);
        setExpandedKeys(openKeys);
      }
      queueMicrotask(() => {
        setDirtyFields(new Set());
        setWarnWhen(false);
      });
    }
  }, [visible, record, id, form, definition, setWarnWhen, setExpandedKeys]);

  // Khôi phục về giá trị gốc của record
  const handleReset = () => {
    form.setFieldsValue(initialValuesRef.current as Parameters<typeof form.setFieldsValue>[0]);
    setDirtyFields(new Set());
    setWarnWhen(false);
  };

  // Xử lý thay đổi dữ liệu: dirty-check và cảnh báo xác nhận khi tắt ADR
  const handleValuesChange = (
    changed: Record<string, unknown>,
    allValues: Record<string, unknown>,
  ) => {
    contract.onValuesChange(changed, allValues);
    formProps.onValuesChange?.(changed, allValues);

    // Section ADR: Khi tắt ADR mà đang có dữ liệu lớp hàng/số biển cam thì hỏi xác nhận
    if ("adrEquipmentIsAdrCertified" in changed && changed.adrEquipmentIsAdrCertified === false) {
      const currentClasses = form.getFieldValue("adrEquipmentAllowedClasses");
      const currentPlate = form.getFieldValue("adrEquipmentOrangePlateNumber");
      const hasAdrData = Boolean(
        (currentClasses && String(currentClasses).trim().length > 0) ||
        (currentPlate && String(currentPlate).trim().length > 0),
      );

      if (hasAdrData) {
        modal.confirm({
          title: t("crud.adrDisableConfirmTitle", "Tắt chứng chỉ ADR?"),
          content: t(
            "crud.adrDisableConfirmContent",
            "Tắt chứng chỉ ADR sẽ xóa phân lớp ADR và số biển cam đã nhập. Bạn có chắc chắn muốn tiếp tục?",
          ),
          okText: t("actions.confirm", "Xác nhận"),
          cancelText: t("actions.cancel", "Hủy"),
          okButtonProps: { danger: true },
          onOk: () => {
            form.setFieldsValue({
              adrEquipmentAllowedClasses: undefined,
              adrEquipmentOrangePlateNumber: undefined,
              adrEquipmentIsAdrCertified: false,
            });
            recomputeDirty(form.getFieldsValue());
          },
          onCancel: () => {
            form.setFieldValue("adrEquipmentIsAdrCertified", true);
            recomputeDirty(form.getFieldsValue());
          },
        });
      }
    }

    recomputeDirty(allValues);
  };

  if (!isEditable || !definition) {
    return null;
  }

  // Header ngữ cảnh: "Chỉnh sửa xe tải [số hiệu]" kèm StatusTag hiện tại
  const identifier = record
    ? String(record.number || record.name || record.id || "")
    : "";
  const status = record?.status ? String(record.status) : undefined;
  const modalTitle = identifier
    ? t("crud.editTitleWithContext", {
        resource: resourceLabel,
        identifier,
        defaultValue: `Chỉnh sửa ${resourceLabel} ${identifier}`,
      })
    : t("crud.editTitle", { resource: resourceLabel });

  const titleNode = (
    <Space align="center" wrap>
      <Typography.Text strong style={{ fontSize: 16 }}>
        {modalTitle}
      </Typography.Text>
      {status && (
        <StatusTag
          label={t(`forms.options.${status.toLowerCase()}`, { defaultValue: status })}
          tone={statusTone(status)}
        />
      )}
    </Space>
  );

  const isQueryLoading = Boolean(queryResult?.isLoading);
  const isQueryError = Boolean(queryResult?.isError);
  // Khi id vừa đổi hoặc query đang chạy mà chưa có record của đúng ID đó
  const isRecordReady = Boolean(
    !queryResult ||
    (record && String(record.id) === String(id)) ||
    (!queryResult.isLoading && !queryResult.isError),
  );

  return (
    <ResourceModalFrame
      className="resource-edit-modal"
      confirmLoading={formLoading}
      destroyOnHidden
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <Button
              disabled={!isDirty || formLoading || isQueryLoading}
              onClick={handleReset}
            >
              {t("crud.reset", "Khôi phục")}
            </Button>
          </div>
          <Space wrap>
            <Button
              disabled={formLoading}
              onClick={discardConfirm.onCancel}
            >
              {t("actions.cancel", "Hủy")}
            </Button>
            <Button
              type="primary"
              disabled={!isDirty || formLoading || isQueryLoading}
              loading={formLoading}
              onClick={() => form.submit()}
            >
              {t("crud.saveChanges", "Lưu thay đổi")}
            </Button>
          </Space>
        </div>
      }
      formId="edit-resource-form"
      maskClosable={!isDirty}
      onCancel={discardConfirm.onCancel}
      open={visible}
      title={titleNode}
      width={860}
    >
      {isQueryError && (
        <Alert
          type="error"
          showIcon
          message={t("crud.loadError", "Không thể tải dữ liệu.")}
          description={(queryResult?.error as unknown as Error)?.message || t("queryError.description")}
          action={
            <Button size="small" onClick={() => void queryResult?.refetch()}>
              {t("actions.retry", "Thử lại")}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {isQueryLoading && !isRecordReady ? (
        <div style={{ padding: "16px 0" }}>
          <Row gutter={[16, 16]}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <Col key={idx} xs={24} md={12}>
                <div style={{ marginBottom: 6 }}>
                  <Skeleton.Input active size="small" style={{ width: 120, height: 16 }} />
                </div>
                <Skeleton.Input active block style={{ height: 32 }} />
              </Col>
            ))}
          </Row>
        </div>
      ) : (
        <>
          {contract.feedback}
          <Form
            {...formProps}
            key={id ? String(id) : "new"}
            form={form}
            onValuesChange={handleValuesChange}
            onFinish={async (values) => {
              try {
                await formProps.onFinish?.(contract.prepare(values));
              } catch {
                // Handled by Refine onMutationError and notificationFailed
              }
            }}
            layout="vertical"
            disabled={formLoading}
          >
            <ResourceFormFields
              columns={2}
              definition={definition}
              dirtyFields={dirtyFields}
              expandedKeys={expandedKeys}
              isEdit={true}
              onToggleSection={toggleSection}
            />
          </Form>
        </>
      )}
    </ResourceModalFrame>
  );
};

