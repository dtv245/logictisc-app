/**
 * TruckShow — Màn hình chi tiết phương tiện (xe tải) theo quy tắc UX:
 * Header với StatusTag, thông tin chia Card dạng Descriptions column=3.
 */

import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { StatusTag } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import type { ApiError } from "@/types/api.types";
import type { Truck } from "@/types/truck.types";

export const TruckShow = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow<Truck, ApiError>({ resource: "trucks" });

  const truck = queryResult.data?.data;

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry", "Thử lại")}
          </Button>
        }
        description={queryResult.error?.message}
        message="Không thể tải thông tin phương tiện"
        showIcon
        type="error"
      />
    );
  }

  if (queryResult.isLoading || !truck) {
    return (
      <Show isLoading={true}>
        <div style={{ minHeight: 200 }} />
      </Show>
    );
  }

  return (
    <Show
      isLoading={queryResult.isLoading}
      title={
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            🚛 {truck.number}
          </Typography.Title>
          <StatusTag label={truck.status} tone={statusTone(truck.status)} />
          <Tag color="blue">{truck.type}</Tag>
          {truck.isHazmatPlacarded && <Tag color="warning">⚠️ Hazmat Placarded</Tag>}
          {truck.adrEquipmentIsAdrCertified && <Tag color="orange">ADR Certified</Tag>}
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Card 1: Thông số kỹ thuật */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          title="Thông số & Định danh phương tiện"
        >
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Số hiệu xe">{truck.number}</Descriptions.Item>
            <Descriptions.Item label="Loại xe">{truck.type}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusTag label={truck.status} tone={statusTone(truck.status)} />
            </Descriptions.Item>

            <Descriptions.Item label="Tải trọng">
              <strong>{Number(truck.vehicleCapacity).toLocaleString()} kg</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Biển số đăng ký">
              {truck.licensePlate
                ? `${truck.licensePlate} (${truck.licensePlateState ?? ""})`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số khung (VIN)">
              <span style={{ fontFamily: "monospace" }}>{truck.vin || "—"}</span>
            </Descriptions.Item>

            <Descriptions.Item label="Hãng sản xuất">{truck.make || "—"}</Descriptions.Item>
            <Descriptions.Item label="Dòng xe (Model)">{truck.model || "—"}</Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">{truck.year || "—"}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Card 2: Tài xế phụ trách */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          title="Phân công tài xế"
        >
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
            <Descriptions.Item label="Tài xế chính">
              {truck.mainDriverName || "Chưa phân công"}
            </Descriptions.Item>
            <Descriptions.Item label="Tài xế phụ">
              {truck.secondaryDriverName || "Không có"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Card 3: Tiêu chuẩn an toàn & ADR */}
        <Card
          bordered={false}
          style={{
            borderRadius: 8,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          title="Tiêu chuẩn an toàn & Thiết bị ADR"
        >
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
            <Descriptions.Item label="Biển cảnh báo nguy hiểm">
              {truck.isHazmatPlacarded ? (
                <Tag color="warning">Có gắn biển</Tag>
              ) : (
                <Tag color="default">Không</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Chứng chỉ ADR">
              {truck.adrEquipmentIsAdrCertified ? (
                <Tag color="success">Đạt chứng chỉ</Tag>
              ) : (
                <Tag color="default">Chưa cấp</Tag>
              )}
            </Descriptions.Item>

            {truck.adrEquipmentIsAdrCertified && (
              <Descriptions.Item label="Phân lớp ADR cho phép">
                {truck.adrEquipmentAllowedClasses || "—"}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Space>
    </Show>
  );
};
