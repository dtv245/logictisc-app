import { Tag } from "antd";

import type { Vehicle } from "@/types/trucks/vehicle.types";
import {
  formatVehicleSubtitle,
  getVehicleTypeLabel,
} from "@/utils/vehicle";

import styles from "./vehicleList.module.css";

interface VehiclePrimaryInfoProps {
  vehicle: Vehicle;
}

export const VehiclePrimaryInfo = ({ vehicle }: VehiclePrimaryInfoProps) => {
  const hasLicensePlate = Boolean(vehicle.licensePlate);
  const subtitle = formatVehicleSubtitle(
    getVehicleTypeLabel(vehicle.type),
    vehicle.make,
    vehicle.model,
    vehicle.year,
  );

  return (
    <div className={styles.primaryInfo}>
      <div className={styles.primaryLine}>
        <span
          className={styles.primaryText}
          title={hasLicensePlate ? vehicle.licensePlate ?? undefined : vehicle.number}
        >
          {hasLicensePlate ? vehicle.licensePlate : vehicle.number}
        </span>
        {hasLicensePlate && vehicle.licensePlateState ? (
          <span className={styles.licenseState}>({vehicle.licensePlateState})</span>
        ) : null}
        {!hasLicensePlate ? (
          <Tag className={`${styles.badge} ${styles.missingPlateBadge}`}>
            Chưa có biển số
          </Tag>
        ) : null}
        {vehicle.isHazmatPlacarded ? (
          <Tag className={`${styles.badge} ${styles.hazmatBadge}`}>Hazmat</Tag>
        ) : null}
        {vehicle.adrEquipmentIsAdrCertified ? (
          <Tag className={`${styles.badge} ${styles.adrBadge}`}>ADR</Tag>
        ) : null}
      </div>
      <div className={styles.subtitle} title={subtitle}>
        {subtitle}
      </div>
    </div>
  );
};
