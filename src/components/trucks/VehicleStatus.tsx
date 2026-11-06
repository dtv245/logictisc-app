import { Tag } from "antd";

import { getVehicleStatusMeta } from "@/utils/vehicle";

import styles from "./vehicleList.module.css";

interface VehicleStatusProps {
  status: string;
}

export const VehicleStatus = ({ status }: VehicleStatusProps) => {
  const meta = getVehicleStatusMeta(status);

  return (
    <Tag color={meta.tagColor} className={styles.statusTag}>
      <span
        aria-hidden="true"
        className={styles.statusDot}
        style={{ backgroundColor: meta.dotColor }}
      />
      {meta.label}
    </Tag>
  );
};
