import { Alert, Button, Card, Divider, Form, Input, Modal, Space, Tag, Typography, theme } from "antd";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FormGrid } from "@/forms/FormGrid";
import { applyBackendFieldErrors, type FormFieldName } from "@/forms/backendFieldErrors";
import { ApiHttpError } from "@/utils/httpError";
import { isUuid } from "@/utils/uuid";
import type { CreateOptimizationRequest, OptimizationOutcome, OptimizationSourceSelection, OptimizationTarget } from "@/types/optimization.dto";
import type { OptimizationActionsResult } from "../hooks/useOptimizationActions";
import { OptimizationError } from "./OptimizationError";

interface RunForm {
  policyId: string;
  targets: OptimizationTarget[];
  driverIds: string;
  truckIds: string;
  sourceSelections: OptimizationSourceSelection[];
}

const ids = (value: string): string[] => value.trim().split(/[\s,]+/).filter(Boolean);

type RunFieldName =
  | "policyId"
  | "driverIds"
  | "truckIds"
  | ["targets", number, keyof OptimizationTarget]
  | ["sourceSelections", number, "capacityInputId" | "qualificationInputId" | "forecastInputId"]
  | ["sourceSelections", number, "scope", "loadId" | "tripId" | "driverId" | "truckId"];

const isTargetField = (value: unknown): value is keyof OptimizationTarget =>
  typeof value === "string" && ["loadId", "tripId", "ratingSnapshotId", "pickupStopId"].includes(value);

const isScopeField = (value: unknown): value is "loadId" | "tripId" | "driverId" | "truckId" =>
  typeof value === "string" && ["loadId", "tripId", "driverId", "truckId"].includes(value);

const isSourceField = (value: unknown): value is "capacityInputId" | "qualificationInputId" | "forecastInputId" =>
  typeof value === "string" && ["capacityInputId", "qualificationInputId", "forecastInputId"].includes(value);

function formName(name: FormFieldName): RunFieldName | undefined {
  if (name === "policyId" || name === "driverIds" || name === "truckIds") return name;
  if (typeof name === "string" || typeof name === "number" || typeof name[1] !== "number") return undefined;
  if (name[0] === "targets" && name.length === 3 && isTargetField(name[2])) return ["targets", name[1], name[2]];
  if (name[0] === "sourceSelections" && name.length === 3 && isSourceField(name[2])) return ["sourceSelections", name[1], name[2]];
  if (name[0] === "sourceSelections" && name.length === 4 && name[2] === "scope" && isScopeField(name[3]))
    return ["sourceSelections", name[1], "scope", name[3]];
  return undefined;
}

export function OptimizationRunForm({
  actions,
  onCreated,
}: {
  actions: OptimizationActionsResult;
  onCreated: (outcome: OptimizationOutcome) => void;
}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [form] = Form.useForm<RunForm>();
  const [proposal, setProposal] = useState<CreateOptimizationRequest | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());

  const location = useLocation();
  const replay = (location.state as { replayRequest?: CreateOptimizationRequest } | null)?.replayRequest;
  const initialValues = useMemo(() => {
    if (replay) {
      return {
        policyId: replay.policyId,
        driverIds: replay.driverIds.join(", "),
        truckIds: replay.truckIds.join(", "),
        targets: replay.targets,
        sourceSelections: replay.sourceSelections,
      };
    }
    return { targets: [{}], sourceSelections: [] };
  }, [replay]);

  const watchedTargets = Form.useWatch("targets", form);
  const watchedDrivers = Form.useWatch("driverIds", form);
  const watchedTrucks = Form.useWatch("truckIds", form);

  const targetCount = Array.isArray(watchedTargets) ? watchedTargets.length : 0;
  const driverCount = typeof watchedDrivers === "string" ? ids(watchedDrivers).length : 0;
  const truckCount = typeof watchedTrucks === "string" ? ids(watchedTrucks).length : 0;
  const candidateCount = targetCount * driverCount * truckCount;
  const isOverLimit = candidateCount > 200;

  const uuidRules = [
    { required: true },
    {
      validator: async (_: unknown, value: string | undefined) => {
        if (!isUuid(value?.trim())) throw new Error(t("optimization.invalidUuid"));
      },
    },
  ];

  const submit = (values: RunForm) =>
    setProposal({
      idempotencyKey: key,
      policyId: values.policyId.trim(),
      targets: values.targets.map((target) => ({
        loadId: target.loadId.trim(),
        tripId: target.tripId.trim(),
        ratingSnapshotId: target.ratingSnapshotId.trim(),
        pickupStopId: target.pickupStopId.trim(),
      })),
      driverIds: ids(values.driverIds),
      truckIds: ids(values.truckIds),
      sourceSelections: (values.sourceSelections ?? []).map((selection) => ({
        scope: {
          loadId: selection.scope.loadId.trim(),
          tripId: selection.scope.tripId.trim(),
          driverId: selection.scope.driverId.trim(),
          truckId: selection.scope.truckId.trim(),
        },
        capacityInputId: selection.capacityInputId.trim(),
        qualificationInputId: selection.qualificationInputId.trim(),
        forecastInputId: selection.forecastInputId.trim(),
      })),
    });

  if (!actions.canRun) return null;

  return (
    <>
      <OptimizationError error={proposal ? null : actions.error} />
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ behavior: "smooth", block: "center" }}
        disabled={actions.pending}
        initialValues={initialValues}
        onValuesChange={() => setKey(crypto.randomUUID())}
        onFinish={submit}
      >
        <Alert type="info" message={t("optimization.runHelp")} style={{ marginBottom: 16 }} />

        {/* Real-time candidate scope scale counter & invariant limit preview */}
        <div
          role="status"
          aria-live="polite"
          className="optimization-scale-counter"
          style={{
            background: isOverLimit ? token.colorErrorBg : token.colorFillAlter,
            border: `1px solid ${isOverLimit ? token.colorErrorBorder : token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
          }}
        >
          <Space wrap size="middle">
            <Typography.Text strong>
              {t("optimization.candidateScaleLabel", { defaultValue: "Quy mô ứng viên dự kiến:" })}
            </Typography.Text>
            <Tag
              color={isOverLimit ? "error" : candidateCount > 0 ? "processing" : "default"}
              className="tabular-nums"
              style={{ fontSize: 13, padding: "2px 8px" }}
            >
              {candidateCount} / 200
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              ({targetCount} {t("optimization.targetsLabel", { defaultValue: "mục tiêu" })} × {driverCount} {t("optimization.driversLabel", { defaultValue: "tài xế" })} × {truckCount} {t("optimization.trucksLabel", { defaultValue: "xe" })})
            </Typography.Text>
          </Space>
          {isOverLimit && (
            <Typography.Text type="danger" strong>
              ⚠️ {t("optimization.scopeTooLarge")}
            </Typography.Text>
          )}
        </div>

        {/* Section 1: Published Policy & Resource Scope (3 inputs <= 7) */}
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("optimization.policySection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("optimization.policyHelp")}
          </Typography.Paragraph>

          <FormGrid
            columns={2}
            items={[
              {
                key: "policyId",
                fullWidth: true,
                node: (
                  <Form.Item name="policyId" label={t("optimization.policyId")} rules={uuidRules}>
                    <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  </Form.Item>
                ),
              },
              ...(["driverIds", "truckIds"] as const).map((name) => {
                const currentCount = name === "driverIds" ? driverCount : truckCount;
                return {
                  key: name,
                  node: (
                    <Form.Item
                      name={name}
                      label={t(`optimization.${name}`)}
                      extra={
                        currentCount > 0 ? (
                          <Typography.Text type="secondary" className="tabular-nums">
                            {name === "driverIds"
                              ? t("optimization.detectedDrivers", { defaultValue: `Đã phát hiện: ${currentCount} tài xế`, count: currentCount })
                              : t("optimization.detectedTrucks", { defaultValue: `Đã phát hiện: ${currentCount} xe`, count: currentCount })}
                          </Typography.Text>
                        ) : undefined
                      }
                      rules={[
                        { required: true },
                        {
                          validator: async (_, value: string | undefined) => {
                            const entries = value ? ids(value) : [];
                            if (
                              !entries.length ||
                              entries.some((id) => !isUuid(id)) ||
                              new Set(entries).size !== entries.length
                            ) {
                              throw new Error(t("optimization.invalidIds"));
                            }
                          },
                        },
                      ]}
                    >
                      <Input.TextArea rows={2} placeholder="UUID 1, UUID 2..." />
                    </Form.Item>
                  ),
                };
              }),
            ]}
          />
        </div>

        <Divider style={{ margin: "16px 0 24px" }} />

        {/* Section 2: Targets Scope (4 inputs <= 7 per target) */}
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("optimization.targetsSection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("optimization.targetsHelp")}
          </Typography.Paragraph>

          <Form.List
            name="targets"
            rules={[
              {
                validator: async (_, targets: OptimizationTarget[] | undefined) => {
                  if (
                    !targets?.length ||
                    new Set(targets.map((row) => `${row.loadId}/${row.tripId}`)).size !== targets.length
                  ) {
                    throw new Error(t("optimization.invalidTargets"));
                  }
                  const drivers: string = form.getFieldValue("driverIds") ?? "";
                  const trucks: string = form.getFieldValue("truckIds") ?? "";
                  if (targets.length * ids(drivers).length * ids(trucks).length > 200) {
                    throw new Error(t("optimization.scopeTooLarge"));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`${t("optimization.target")} #${index + 1}`}
                    extra={
                      <Button
                        danger
                        type="text"
                        disabled={fields.length === 1}
                        onClick={() => remove(field.name)}
                      >
                        {t("optimization.remove")}
                      </Button>
                    }
                  >
                    <FormGrid
                      columns={2}
                      items={(["loadId", "tripId", "ratingSnapshotId", "pickupStopId"] as const).map((name) => ({
                        key: name,
                        node: (
                          <Form.Item
                            name={[field.name, name]}
                            label={t(`optimization.${name}`)}
                            rules={uuidRules}
                          >
                            <Input placeholder="UUID" />
                          </Form.Item>
                        ),
                      }))}
                    />
                  </Card>
                ))}
                <Form.ErrorList errors={errors} />
                <Button onClick={() => add()}>{t("optimization.addTarget")}</Button>
              </Space>
            )}
          </Form.List>
        </div>

        <Divider style={{ margin: "16px 0 24px" }} />

        {/* Section 3: Evidence Selections (Optional, max 7 inputs <= 7 per selection) */}
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={5} style={{ marginBottom: 4 }}>
            {t("optimization.evidenceSection")}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
            {t("optimization.evidenceHelp")}
          </Typography.Paragraph>

          <Form.List name="sourceSelections">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`${t("optimization.sourceSelection")} #${index + 1}`}
                    extra={
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        {t("optimization.remove")}
                      </Button>
                    }
                  >
                    <Typography.Text strong style={{ display: "block", marginBottom: 12 }}>
                      {t("optimization.evidenceScope")}
                    </Typography.Text>
                    <FormGrid
                      columns={2}
                      items={(["loadId", "tripId", "driverId", "truckId"] as const).map((name) => ({
                        key: name,
                        node: (
                          <Form.Item
                            name={[field.name, "scope", name]}
                            label={t(`optimization.${name}`)}
                            rules={uuidRules}
                          >
                            <Input placeholder="UUID" />
                          </Form.Item>
                        ),
                      }))}
                    />

                    <Typography.Text strong style={{ display: "block", marginTop: 12, marginBottom: 12 }}>
                      {t("optimization.evidenceInputs")}
                    </Typography.Text>
                    <FormGrid
                      columns={2}
                      items={(["capacityInputId", "qualificationInputId", "forecastInputId"] as const).map((name) => ({
                        key: name,
                        node: (
                          <Form.Item
                            name={[field.name, name]}
                            label={t(`optimization.${name}`)}
                            rules={uuidRules}
                          >
                            <Input placeholder="UUID" />
                          </Form.Item>
                        ),
                      }))}
                    />
                  </Card>
                ))}
                <Button onClick={() => add()}>{t("optimization.addSources")}</Button>
              </Space>
            )}
          </Form.List>
        </div>

        {/* Footer: Exactly 1 primary button, separate reset button */}
        <div
          className="optimization-form-actions"
          style={{
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button onClick={() => form.resetFields()} disabled={actions.pending} aria-label={t("common.reset")}>
            {t("common.reset")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={actions.pending}
            disabled={actions.pending}
            aria-label={t("optimization.run")}
          >
            {t("optimization.run")}
          </Button>
        </div>
      </Form>

      <Modal
        open={proposal != null}
        title={t("optimization.run")}
        okText={t("actions.confirm")}
        cancelText={t("actions.cancel")}
        confirmLoading={actions.pending}
        cancelButtonProps={{ disabled: actions.pending }}
        maskClosable={!actions.pending}
        keyboard={!actions.pending}
        onCancel={() => {
          if (!actions.pending) setProposal(null);
        }}
        onOk={async () => {
          if (!proposal) return;
          try {
            const result = await actions.execute({ action: "run", payload: proposal });
            if (result && "run" in result) {
              setProposal(null);
              onCreated(result);
            }
          } catch (error) {
            if (error instanceof ApiHttpError && error.errors) {
              applyBackendFieldErrors(
                {
                  setFields: (fields) =>
                    form.setFields(
                      fields.flatMap(({ name, errors }) => {
                        const target = formName(name);
                        return target ? [{ name: target, errors }] : [];
                      })
                    ),
                  scrollToField: (name, options) => {
                    const target = formName(name);
                    if (target) form.scrollToField(target, { behavior: "smooth", block: "center", ...options });
                  },
                },
                error.errors
              );
            }
            /* Retain explicit input/key for safe command replay. */
          }
        }}
      >
        <Alert type="warning" showIcon message={t("optimization.runConfirm")} />
        <OptimizationError error={actions.error} />
      </Modal>
    </>
  );
}
