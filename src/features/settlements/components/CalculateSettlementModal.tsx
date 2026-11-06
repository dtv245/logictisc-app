/** Calculation uses explicit driver/period selection and preserves the form while pending. */
import { CalculatorOutlined } from "@ant-design/icons";
import { Form, Modal, Select } from "antd";
import { useTranslation } from "react-i18next";

import type { CalculateSettlementPayload } from "@/types/settlements/settlement.dto";
import {
  useCalculateSettlement,
  usePayPeriods,
} from "../api/settlement.query";
import { EntityPicker } from "@/components/EntityPicker";

export interface CalculateSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CalculateSettlementModal = ({
  open,
  onClose,
  onSuccess,
}: CalculateSettlementModalProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<CalculateSettlementPayload>();
  const { payPeriods, isLoading: isPeriodsLoading } = usePayPeriods();
  const { calculateSettlement, isCalculating } = useCalculateSettlement();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const result = await calculateSettlement(values);
      if (result) {
        form.resetFields();
        onClose();
        onSuccess?.();
      }
    } catch {
      // Form validation errors handled by antd
    }
  };

  const handleCancel = () => {
    if (isCalculating) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span>
          <CalculatorOutlined style={{ marginRight: 8 }} />
          {t("settlements.calculateModalTitle", "Calculate Driver Settlement")}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isCalculating}
      cancelButtonProps={{ disabled: isCalculating }}
      maskClosable={!isCalculating}
      keyboard={!isCalculating}
      style={{ maxWidth: "calc(100vw - 32px)" }}
      okText={t("settlements.calculateAction", "Calculate")}
      cancelText={t("common.cancel", "Cancel")}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="driverId"
          label={t("settlements.driver", "Driver")}
          rules={[
            {
              required: true,
              message: t(
                "settlements.errors.driverRequired",
                "Please select a driver"
              ),
            },
          ]}
        >
          <EntityPicker
            placeholder={t(
              "settlements.filters.selectDriver",
              "Select Driver"
            )}
            resource="drivers"
            pageSize={50}
            labelFormat={(driver) => {
              const name = `${String(driver.firstName ?? "")} ${String(driver.lastName ?? "")}`.trim();
              return name || String(driver.email ?? driver.id ?? "");
            }}
          />
        </Form.Item>

        <Form.Item
          name="payPeriodId"
          label={t("settlements.payPeriod", "Pay Period")}
          rules={[
            {
              required: true,
              message: t(
                "settlements.errors.payPeriodRequired",
                "Please select a pay period"
              ),
            },
          ]}
        >
          <Select
            loading={isPeriodsLoading}
            placeholder={t(
              "settlements.filters.selectPayPeriod",
              "Select Pay Period"
            )}
            options={payPeriods.map((p) => ({
              label: `${p.periodCode} (${p.startDate} ~ ${p.endDate})`,
              value: p.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
