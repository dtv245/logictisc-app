import React, { useEffect } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";

import {
  MILEAGE_BASES,
  PAY_METHODS,
  percentToRatio,
  ratioToPercent,
  REVENUE_BASES,
  type DriverPayPolicyFormValues,
  type DriverPayPolicyRequest,
  type DriverPayPolicyView,
} from "@/types/driverPayPolicy.dto";

const { Title, Text } = Typography;

export interface DriverPayPolicyFormProps {
  mode: "create" | "new-version";
  previousPolicy?: DriverPayPolicyView | null;
  onSubmit: (request: DriverPayPolicyRequest) => Promise<unknown>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DriverPayPolicyForm: React.FC<DriverPayPolicyFormProps> = ({
  mode,
  previousPolicy,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<DriverPayPolicyFormValues>();
  const payMethod = Form.useWatch("payMethod", form);
  const isDefaultScope = Form.useWatch("isDefaultScope", form);

  const isNewVersionMode = mode === "new-version" && Boolean(previousPolicy);

  // Initialize or prefill form values
  useEffect(() => {
    if (isNewVersionMode && previousPolicy) {
      form.setFieldsValue({
        policyCode: previousPolicy.policyCode,
        name: previousPolicy.name,
        isDefaultScope: previousPolicy.driverId === null,
        driverId: previousPolicy.driverId,
        payMethod: previousPolicy.payMethod,
        perMileRate: previousPolicy.perMileRate,
        perLoadRate: previousPolicy.perLoadRate,
        hourlyRate: previousPolicy.hourlyRate,
        dailyRate: previousPolicy.dailyRate,
        flatRate: previousPolicy.flatRate,
        revenuePercentageInput: ratioToPercent(previousPolicy.revenuePercentage),
        mileageBasis: previousPolicy.mileageBasis,
        revenueBasis: previousPolicy.revenueBasis,
        detentionRate: previousPolicy.detentionRate,
        detentionFreeMinutes: previousPolicy.detentionFreeMinutes,
        detentionBlockMinutes: previousPolicy.detentionBlockMinutes,
        layoverRate: previousPolicy.layoverRate,
        stopPayRate: previousPolicy.stopPayRate,
        currency: previousPolicy.currency || "VND",
        // Do not prefill effectiveFrom to previous: must be later
        effectiveFrom: undefined,
        effectiveTo: undefined,
      });
    } else {
      form.setFieldsValue({
        isDefaultScope: true,
        payMethod: "PER_MILE",
        mileageBasis: "ACTUAL_ALL_MILES",
        revenueBasis: "INVOICE_SUBTOTAL",
        currency: "VND",
      });
    }
  }, [form, isNewVersionMode, previousPolicy]);

  const handleFinish = async (values: DriverPayPolicyFormValues) => {
    const rawEffectiveFrom = values.effectiveFrom as unknown;
    const formattedEffectiveFrom = dayjs.isDayjs(rawEffectiveFrom)
      ? (rawEffectiveFrom as Dayjs).format("YYYY-MM-DD")
      : typeof rawEffectiveFrom === "string"
      ? rawEffectiveFrom
      : "";

    const rawEffectiveTo = values.effectiveTo as unknown;
    const formattedEffectiveTo = dayjs.isDayjs(rawEffectiveTo)
      ? (rawEffectiveTo as Dayjs).format("YYYY-MM-DD")
      : typeof rawEffectiveTo === "string" && rawEffectiveTo.trim()
      ? rawEffectiveTo
      : null;

    const request: DriverPayPolicyRequest = {
      policyCode: values.policyCode.trim(),
      name: values.name.trim(),
      driverId: values.isDefaultScope ? null : values.driverId || null,
      payMethod: values.payMethod,
      perMileRate: values.perMileRate ?? null,
      perLoadRate: values.perLoadRate ?? null,
      hourlyRate: values.hourlyRate ?? null,
      dailyRate: values.dailyRate ?? null,
      flatRate: values.flatRate ?? null,
      revenuePercentage:
        values.payMethod === "PERCENT_REVENUE"
          ? percentToRatio(values.revenuePercentageInput)
          : null,
      mileageBasis:
        values.payMethod === "PER_MILE" ? values.mileageBasis ?? null : null,
      revenueBasis:
        values.payMethod === "PERCENT_REVENUE"
          ? values.revenueBasis ?? "INVOICE_SUBTOTAL"
          : null,
      detentionRate: values.detentionRate ?? null,
      detentionFreeMinutes: values.detentionFreeMinutes ?? null,
      detentionBlockMinutes: values.detentionBlockMinutes ?? null,
      layoverRate: values.layoverRate ?? null,
      stopPayRate: values.stopPayRate ?? null,
      currency: (values.currency || "VND").toUpperCase(),
      effectiveFrom: formattedEffectiveFrom,
      effectiveTo: formattedEffectiveTo,
    };

    await onSubmit(request);
  };

  return (
    <Card bordered={false}>
      {isNewVersionMode && previousPolicy && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message={
            <span>
              {t(
                "settlements.creatingVersion",
                `Creating new version (v${previousPolicy.policyVersion + 1}) for policy "${previousPolicy.policyCode}". Scope and Code are immutable.`
              )}
            </span>
          }
          description={
            <div>
              <Text strong>{t("settlements.previousEffectiveFrom", "Previous Effective From")}: </Text>
              <span>{previousPolicy.effectiveFrom}</span>
              {previousPolicy.effectiveTo && (
                <>
                  <Text strong style={{ marginLeft: 16 }}>
                    {t("settlements.previousEffectiveTo", "Previous Effective To")}:{" "}
                  </Text>
                  <span>{previousPolicy.effectiveTo}</span>
                </>
              )}
            </div>
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          isDefaultScope: true,
          payMethod: "PER_MILE",
          mileageBasis: "ACTUAL_ALL_MILES",
          revenueBasis: "INVOICE_SUBTOTAL",
          currency: "VND",
        }}
      >
        <Title level={5}>
          {t("settlements.policyIdentification", "Policy Identification")}
        </Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="policyCode"
              label={t("settlements.policyCode", "Policy Code")}
              rules={[
                { required: true, message: t("settlements.policyCodeRequired", "Policy code is required") },
                { max: 80, message: t("settlements.policyCodeMax", "Max 80 characters") },
              ]}
            >
              <Input
                disabled={isNewVersionMode}
                placeholder="e.g. POL-DRV-STANDARD-2026"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label={t("settlements.policyName", "Policy Name")}
              rules={[
                { required: true, message: t("settlements.policyNameRequired", "Policy name is required") },
                { max: 200, message: t("settlements.policyNameMax", "Max 200 characters") },
              ]}
            >
              <Input placeholder="e.g. Standard Regional Driver Pay Policy" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="isDefaultScope"
              label={t("settlements.scopeType", "Driver Scope")}
              valuePropName="checked"
            >
              <Switch
                disabled={isNewVersionMode}
                checkedChildren={t("settlements.defaultAllDrivers", "Default (All Drivers)")}
                unCheckedChildren={t("settlements.specificDriver", "Specific Driver")}
              />
            </Form.Item>
          </Col>
          {!isDefaultScope && (
            <Col xs={24} md={12}>
              <Form.Item
                name="driverId"
                label={t("settlements.driverId", "Driver UUID")}
                rules={[
                  {
                    required: !isDefaultScope,
                    message: t("settlements.driverIdRequired", "Driver UUID is required for driver-specific scope"),
                  },
                ]}
              >
                <Input
                  disabled={isNewVersionMode}
                  placeholder="Enter driver UUID"
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Title level={5} style={{ marginTop: 16 }}>
          {t("settlements.rateMethod", "Pay Method & Base Rates")}
        </Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="payMethod"
              label={t("settlements.payMethod", "Pay Method")}
              rules={[{ required: true, message: t("settlements.payMethodRequired", "Pay method is required") }]}
            >
              <Select
                options={PAY_METHODS.map((m) => ({
                  value: m,
                  label: t(`settlements.payMethod_${m}`, m),
                }))}
              />
            </Form.Item>
          </Col>

          {/* Pay Method Dependent Fields */}
          {payMethod === "PER_MILE" && (
            <>
              <Col xs={24} md={6}>
                <Form.Item
                  name="perMileRate"
                  label={t("settlements.perMileRate", "Per Mile Rate")}
                  rules={[{ required: true, message: t("settlements.rateRequired", "Rate is required") }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={4}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="mileageBasis"
                  label={t("settlements.mileageBasis", "Mileage Basis")}
                  rules={[{ required: true, message: t("settlements.mileageBasisRequired", "Mileage basis required") }]}
                >
                  <Select
                    options={MILEAGE_BASES.map((b) => ({
                      value: b,
                      label: b,
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {payMethod === "PER_LOAD" && (
            <Col xs={24} md={12}>
              <Form.Item
                name="perLoadRate"
                label={t("settlements.perLoadRate", "Per Load Rate")}
                rules={[{ required: true, message: t("settlements.rateRequired", "Rate is required") }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}

          {payMethod === "PERCENT_REVENUE" && (
            <>
              <Col xs={24} md={6}>
                <Form.Item
                  name="revenuePercentageInput"
                  label={t("settlements.revenuePercentage", "Revenue Percentage (%)")}
                  extra={t("settlements.percentageExtra", "Enter percentage (e.g. 25 for 25%, transport is 0.25)")}
                  rules={[
                    { required: true, message: t("settlements.percentageRequired", "Percentage is required") },
                    {
                      type: "number",
                      min: 0,
                      max: 100,
                      message: t("settlements.percentageRange", "Must be between 0% and 100%"),
                    },
                  ]}
                >
                  <InputNumber<number>
                    min={0}
                    max={100}
                    step={0.5}
                    precision={2}
                    formatter={(value) => `${value}%`}
                    parser={(value) => (value ? Number(value.replace("%", "")) : 0)}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="revenueBasis"
                  label={t("settlements.revenueBasis", "Revenue Basis")}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={REVENUE_BASES.map((b) => ({
                      value: b,
                      label: b,
                    }))}
                  />
                </Form.Item>
              </Col>
            </>
          )}

          {payMethod === "HOURLY" && (
            <Col xs={24} md={12}>
              <Form.Item
                name="hourlyRate"
                label={t("settlements.hourlyRate", "Hourly Rate")}
                rules={[{ required: true, message: t("settlements.rateRequired", "Rate is required") }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}

          {payMethod === "DAILY" && (
            <Col xs={24} md={12}>
              <Form.Item
                name="dailyRate"
                label={t("settlements.dailyRate", "Daily Rate")}
                rules={[{ required: true, message: t("settlements.rateRequired", "Rate is required") }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}

          {payMethod === "FLAT_RATE" && (
            <Col xs={24} md={12}>
              <Form.Item
                name="flatRate"
                label={t("settlements.flatRate", "Flat Rate")}
                rules={[{ required: true, message: t("settlements.rateRequired", "Rate is required") }]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  precision={2}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Title level={5} style={{ marginTop: 16 }}>
          {t("settlements.detentionAndAccessorial", "Detention & Accessorial Rates")}
        </Title>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="detentionRate"
              label={t("settlements.detentionRate", "Detention Rate (per hour)")}
            >
              <InputNumber min={0} step={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="detentionFreeMinutes"
              label={t("settlements.detentionFreeMinutes", "Detention Free Minutes")}
            >
              <InputNumber min={0} step={15} style={{ width: "100%" }} placeholder="e.g. 120" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="detentionBlockMinutes"
              label={t("settlements.detentionBlockMinutes", "Detention Block Minutes")}
            >
              <InputNumber min={1} step={15} style={{ width: "100%" }} placeholder="e.g. 15" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="layoverRate"
              label={t("settlements.layoverRate", "Layover Rate")}
            >
              <InputNumber min={0} step={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="stopPayRate"
              label={t("settlements.stopPayRate", "Stop Pay Rate")}
            >
              <InputNumber min={0} step={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5} style={{ marginTop: 16 }}>
          {t("settlements.currencyAndEffectiveDates", "Currency & Effective Validity (Date-Only)")}
        </Title>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="currency"
              label={t("settlements.currency", "Currency")}
              rules={[
                { required: true, message: t("settlements.currencyRequired", "Currency is required") },
                { pattern: /^[A-Z]{3}$/, message: t("settlements.currencyPattern", "3 uppercase letters (e.g. VND, USD)") },
              ]}
            >
              <Select
                options={[
                  { value: "VND", label: "VND (Vietnamese Dong)" },
                  { value: "USD", label: "USD (US Dollar)" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="effectiveFrom"
              label={t("settlements.effectiveFrom", "Effective From")}
              rules={[
                { required: true, message: t("settlements.effectiveFromRequired", "Effective from date is required") },
                () => ({
                  validator(_, value) {
                    if (isNewVersionMode && previousPolicy && value) {
                      const prevDate = dayjs(previousPolicy.effectiveFrom);
                      const selectedDate = dayjs(value);
                      if (!selectedDate.isAfter(prevDate, "day")) {
                        return Promise.reject(
                          new Error(
                            t(
                              "settlements.effectiveFromAfterPrevious",
                              `Effective from must be strictly after previous version effective date (${previousPolicy.effectiveFrom})`
                            )
                          )
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                disabledDate={(current) => {
                  if (isNewVersionMode && previousPolicy) {
                    return current && current.isBefore(dayjs(previousPolicy.effectiveFrom).add(1, "day"), "day");
                  }
                  return false;
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="effectiveTo"
              label={t("settlements.effectiveTo", "Effective To (Optional)")}
              dependencies={["effectiveFrom"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const fromDate = getFieldValue("effectiveFrom");
                    if (fromDate && dayjs(value).isBefore(dayjs(fromDate), "day")) {
                      return Promise.reject(
                        new Error(t("settlements.effectiveToAfterFrom", "Effective to must not precede effective from"))
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {isNewVersionMode
                ? t("settlements.submitNewVersion", "Create New Version")
                : t("settlements.submitCreatePolicy", "Create Policy")}
            </Button>
            {onCancel && (
              <Button onClick={onCancel} disabled={isLoading}>
                {t("actions.cancel", "Cancel")}
              </Button>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
