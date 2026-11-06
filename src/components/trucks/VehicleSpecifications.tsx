import type { ReactNode } from "react";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TruckOutlined,
  UserOutlined,
} from "@ant-design/icons";

import type { Vehicle } from "@/types/trucks/vehicle.types";
import {
  formatCapacity,
  formatDriver,
  formatLocation,
} from "@/utils/vehicle";

import styles from "./vehicleList.module.css";

interface VehicleSpecificationsProps {
  vehicle: Vehicle;
}

interface SpecItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const SpecItem = ({ icon, label, value }: SpecItemProps) => (
  <span className={styles.specItem}>
    <span className={styles.specIcon} aria-hidden="true">{icon}</span>
    <span className={styles.specLabel}>{label}:</span>
    <span className={styles.specValue} title={value}>{value}</span>
  </span>
);

export const VehicleSpecifications = ({ vehicle }: VehicleSpecificationsProps) => (
  <div className={styles.specsGrid}>
    <SpecItem
      icon={<TruckOutlined />}
      label="Sức chở"
      value={formatCapacity(vehicle.vehicleCapacity)}
    />
    <SpecItem
      icon={<UserOutlined />}
      label="Tài xế"
      value={formatDriver(vehicle.mainDriverName, vehicle.secondaryDriverName)}
    />
    <SpecItem
      icon={<EnvironmentOutlined />}
      label="Vị trí"
      value={formatLocation(vehicle.currentLocationLatitude, vehicle.currentLocationLongitude)}
    />
    <SpecItem
      icon={<CalendarOutlined />}
      label="Năm SX"
      value={vehicle.year === null ? "—" : String(vehicle.year)}
    />
  </div>
);
