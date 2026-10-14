import { CarOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Empty, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { Load } from "@/types/load.types";

export interface LoadTripPanelProps {
  load: Load;
}

export const LoadTripPanel = ({ load }: LoadTripPanelProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const hasAssignment = Boolean(load.assignedTruckId || load.assignedTruckNumber);

  return (
    <Card
      title={t("loads.trip.title", "Trip & Vehicle Assignment")}
      data-testid="load-trip-panel"
    >
      {hasAssignment ? (
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t("loads.trip.truck", "Assigned Truck")}>
            <Space align="center">
              <CarOutlined style={{ fontSize: 16 }} />
              <Typography.Text strong>
                {load.assignedTruckNumber || load.assignedTruckId}
              </Typography.Text>
              {load.assignedTruckId && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/trucks/show/${load.assignedTruckId}`)}
                >
                  {t("loads.trip.viewTruck", "View Truck")}
                </Button>
              )}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t("loads.trip.dispatcher", "Dispatcher")}>
            {load.assignedDispatcherName || load.assignedDispatcherId || "—"}
          </Descriptions.Item>

          <Descriptions.Item label={t("loads.trip.status", "Transit Status")}>
            <Tag color={load.status === "delivered" ? "green" : "blue"}>
              {load.status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty
          description={t(
            "loads.trip.notAssigned",
            "No vehicle or trip assigned to this load yet",
          )}
        />
      )}
    </Card>
  );
};
