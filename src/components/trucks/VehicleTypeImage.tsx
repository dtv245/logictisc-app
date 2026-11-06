import type { SyntheticEvent } from "react";

import { DEFAULT_VEHICLE_IMAGE } from "@/constants/vehicle";
import { getVehicleImage } from "@/utils/vehicle";

import styles from "./vehicleList.module.css";

interface VehicleTypeImageProps {
  type: string;
  typeName: string;
  width?: number;
  height?: number;
}

export const VehicleTypeImage = ({
  type,
  typeName,
  width = 104,
  height = 76,
}: VehicleTypeImageProps) => {
  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!event.currentTarget.src.endsWith(DEFAULT_VEHICLE_IMAGE)) {
      event.currentTarget.src = DEFAULT_VEHICLE_IMAGE;
    }
  };

  return (
    <div
      className={styles.vehicleImageFrame}
      style={{ width, height }}
      aria-label={`Ảnh minh họa ${typeName}`}
    >
      <img
        src={getVehicleImage(type)}
        alt={typeName}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={styles.vehicleImage}
        onError={handleImageError}
      />
    </div>
  );
};
