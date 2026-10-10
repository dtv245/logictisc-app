import { PickupBusinessDateForm } from "./PickupBusinessDateForm";
import { PICKUP_BUSINESS_DATE_RUNTIME_VERIFIED } from "./pickupBusinessDate.api";
import { Card, Descriptions, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "@/formatters/dateTime";
import type { Load } from "@/types/load.types";

export interface LoadOverviewPanelProps {
  load: Load;
}

const formatAddress = (addr?: {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}): string => {
  if (!addr) return "—";
  return [addr.line1, addr.city, addr.state, addr.country, addr.postalCode]
    .filter(Boolean)
    .join(", ");
};

export const LoadOverviewPanel = ({ load }: LoadOverviewPanelProps) => {
  const { t } = useTranslation();

  return (
    <div data-testid="load-overview-panel">
      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title={t("loads.overview.generalInfo", "General Information")}
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
        >
          <Descriptions.Item label={t("loads.fields.number", "Load No.")}>
            <Typography.Text strong>#{load.number}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.name", "Name")}>
            {load.name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.type", "Type")}>
            <Tag color="blue">{load.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.source", "Source")}>
            <Tag>{load.source}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.distance", "Distance")}>
            {load.distance !== null && load.distance !== undefined
              ? String(load.distance)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.proximity", "In Proximity")}>
            <Tag color={load.isInProximity ? "green" : "default"}>
              {load.isInProximity
                ? t("common.yes", "Yes")
                : t("common.no", "No")}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.customer", "Customer")}>
            {load.customerName || load.customerId || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.truck", "Assigned Truck")}>
            {load.assignedTruckNumber ? (
              <Tag color="cyan">🚛 {load.assignedTruckNumber}</Tag>
            ) : (
              "—"
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.dispatcher", "Dispatcher")}>
            {load.assignedDispatcherName || load.assignedDispatcherId || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("loads.fields.deliveryCost", "Delivery Cost")}>
            {load.deliveryCostAmount != null && load.deliveryCostCurrency ? (
              <Typography.Text strong style={{ color: "#1890ff" }}>
                {Number(load.deliveryCostAmount).toLocaleString()}{" "}
                {load.deliveryCostCurrency}
              </Typography.Text>
            ) : (
              "—"
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.hazmat", "Hazardous Material")}
            span={2}
          >
            {load.isHazmat ? (
              <Space>
                <Tag color="volcano">HAZMAT</Tag>
                {load.hazmatClass && <span>Class: {load.hazmatClass}</span>}
                {load.unNumber && <span>UN: {load.unNumber}</span>}
              </Space>
            ) : (
              <Typography.Text type="secondary">
                {t("common.no", "No")}
              </Typography.Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title={t("loads.overview.schedule", "Schedule & Timestamps")}
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item
            label={t("loads.fields.requestedPickup", "Requested Pickup")}
          >
            {load.requestedPickupDate
              ? formatDateTime(load.requestedPickupDate)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.requestedDelivery", "Requested Delivery")}
          >
            {load.requestedDeliveryDate
              ? formatDateTime(load.requestedDeliveryDate)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.dispatchedAt", "Dispatched At")}
          >
            {load.dispatchedAt ? formatDateTime(load.dispatchedAt) : "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.pickedUpAt", "Picked Up At")}
          >
            {load.pickedUpAt ? formatDateTime(load.pickedUpAt) : "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.deliveredAt", "Delivered At")}
          >
            {load.deliveredAt ? formatDateTime(load.deliveredAt) : "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.cancelledAt", "Cancelled At")}
          >
            {load.cancelledAt ? formatDateTime(load.cancelledAt) : "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {PICKUP_BUSINESS_DATE_RUNTIME_VERIFIED && <Card title={t("pickupBusinessDate.title")} style={{ marginBottom: 16 }}><PickupBusinessDateForm key={load.id} load={load} /></Card>}

      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title={t("loads.overview.routing", "Routing & Addresses")}
          bordered
          column={1}
        >
          <Descriptions.Item label={t("loads.fields.origin", "Origin")}>
            📍 {formatAddress({ line1: load.originAddressLine1 ?? undefined, city: load.originAddressCity ?? undefined, state: load.originAddressState ?? undefined, country: load.originAddressCountry ?? undefined, postalCode: load.originAddressZipCode ?? undefined })}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("loads.fields.destination", "Destination")}
          >
            🏁 {formatAddress({ line1: load.destinationAddressLine1 ?? undefined, city: load.destinationAddressCity ?? undefined, state: load.destinationAddressState ?? undefined, country: load.destinationAddressCountry ?? undefined, postalCode: load.destinationAddressZipCode ?? undefined })}
          </Descriptions.Item>
          {load.notes && (
            <Descriptions.Item label={t("loads.fields.notes", "Notes")}>
              {load.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};
