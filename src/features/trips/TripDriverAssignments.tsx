import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import type {
  AssignDriverPayload,
  TripDriverAssignment,
} from "@/types/tripExecution.types";
import { TRIP_ASSIGNMENT_TYPES } from "./tripExecution.api";
import { useTripDriverAssignments } from "./useTripDriverAssignments";

export interface TripDriverAssignmentsProps {
  tripId: string;
}

export const TripDriverAssignments = ({
  tripId,
}: TripDriverAssignmentsProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm<AssignDriverPayload>();

  const {
    drivers,
    isLoading,
    isError,
    error,
    isSubmitting,
    assignDriver,
    unassignDriver,
  } = useTripDriverAssignments(tripId);

  const handleOpenModal = () => {
    form.resetFields();
    form.setFieldsValue({
      assignmentType: "PRIMARY",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: AssignDriverPayload = {
        driverId: values.driverId,
        assignmentType: values.assignmentType || "PRIMARY",
        plannedMiles: values.plannedMiles,
        effectiveFrom: values.effectiveFrom
          ? (values.effectiveFrom as unknown as { toISOString: () => string }).toISOString()
          : undefined,
      };

      const success = await assignDriver(payload);
      if (success) {
        handleCloseModal();
      }
    } catch {
      // Form validation errors handled by antd
    }
  };

  const columns: ColumnsType<TripDriverAssignment> = [
    {
      title: t("trips.driverAssignments.driver", "Driver"),
      dataIndex: "driverName",
      key: "driverName",
      render: (name: string, record: TripDriverAssignment) => (
        <Space>
          <UserOutlined />
          <Typography.Text strong>{name || record.driverId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t("trips.driverAssignments.role", "Assignment Role"),
      dataIndex: "assignmentType",
      key: "assignmentType",
      render: (role: string) => {
        const isPrimary = role === "PRIMARY";
        return <Tag color={isPrimary ? "blue" : "purple"}>{role}</Tag>;
      },
    },
    {
      title: t("trips.driverAssignments.status", "Status"),
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive
            ? t("trips.driverAssignments.active", "Active")
            : t("trips.driverAssignments.closed", "Ended")}
        </Tag>
      ),
    },
    {
      title: t("trips.driverAssignments.effectiveFrom", "Effective From"),
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      render: (val: string) => formatDateTime(val),
    },
    {
      title: t("trips.driverAssignments.effectiveTo", "Effective To"),
      dataIndex: "effectiveTo",
      key: "effectiveTo",
      render: (val?: string | null) =>
        val ? (
          formatDateTime(val)
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: t("trips.driverAssignments.plannedMiles", "Planned Miles"),
      dataIndex: "plannedMiles",
      key: "plannedMiles",
      render: (miles?: number | null) =>
        miles !== null && miles !== undefined && Number.isFinite(Number(miles))
          ? `${Number(miles).toLocaleString()} mi`
          : "—",
    },
    {
      title: t("trips.driverAssignments.actualMiles", "Actual Miles"),
      dataIndex: "actualMiles",
      key: "actualMiles",
      render: (miles?: number | null) =>
        miles !== null && miles !== undefined && Number.isFinite(Number(miles))
          ? `${Number(miles).toLocaleString()} mi`
          : "—",
    },
    {
      title: t("columns.actions", "Actions"),
      key: "actions",
      render: (_, record: TripDriverAssignment) => {
        if (!record.isActive) {
          return <Typography.Text type="secondary">—</Typography.Text>;
        }

        return (
          <Popconfirm
            title={t(
              "trips.driverAssignments.unassignConfirm",
              "Are you sure you want to unassign this driver?",
            )}
            okText={t("trips.driverAssignments.unassign", "Unassign")}
            cancelText={t("actions.cancel", "Cancel")}
            okButtonProps={{ danger: true, loading: isSubmitting }}
            onConfirm={() => void unassignDriver(record.id)}
          >
            <Button
              danger
              size="small"
              disabled={isSubmitting}
              data-testid={`unassign-btn-${record.id}`}
            >
              {t("trips.driverAssignments.unassign", "Unassign")}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Card
      title={t("trips.driverAssignments.title", "Driver Assignments")}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
          data-testid="assign-driver-btn"
        >
          {t("trips.driverAssignments.assignDriver", "Assign Driver")}
        </Button>
      }
      data-testid="trip-driver-assignments-card"
    >
      {isError && (
        <Alert
          type="error"
          message={t(
            "trips.driverAssignments.loadFailed",
            "Failed to load driver assignments",
          )}
          description={error?.message}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table<TripDriverAssignment>
        dataSource={drivers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        data-testid="driver-assignments-table"
      />

      <Modal
        title={t("trips.driverAssignments.assignModalTitle", "Assign Driver to Trip")}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleAssignSubmit}
        confirmLoading={isSubmitting}
        destroyOnClose
        data-testid="assign-driver-modal"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ assignmentType: "PRIMARY" }}
        >
          <Form.Item
            name="driverId"
            label={t("trips.driverAssignments.driverId", "Driver UUID")}
            rules={[
              {
                required: true,
                message: t(
                  "trips.driverAssignments.driverRequired",
                  "Driver ID is required",
                ),
              },
            ]}
          >
            <Input
              placeholder={t(
                "trips.driverAssignments.driverIdPlaceholder",
                "Enter driver ID (UUID)",
              )}
              data-testid="driver-id-input"
            />
          </Form.Item>

          <Form.Item
            name="assignmentType"
            label={t("trips.driverAssignments.assignmentType", "Assignment Type")}
            rules={[{ required: true }]}
          >
            <Select data-testid="assignment-type-select">
              {TRIP_ASSIGNMENT_TYPES.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="effectiveFrom"
            label={t("trips.driverAssignments.effectiveFrom", "Effective From")}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder={t("trips.driverAssignments.nowDefault", "Default: Now")}
            />
          </Form.Item>

          <Form.Item
            name="plannedMiles"
            label={t("trips.driverAssignments.plannedMiles", "Planned Miles")}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="e.g. 450"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
