import { memo, useCallback } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

import type { Vehicle } from "@/types/trucks/vehicle.types";

import { VehicleActions } from "./VehicleActions";
import { VehiclePrimaryInfo } from "./VehiclePrimaryInfo";
import { VehicleSpecifications } from "./VehicleSpecifications";
import { VehicleStatus } from "./VehicleStatus";
import { VehicleTypeImage } from "./VehicleTypeImage";
import styles from "./vehicleList.module.css";

interface VehicleListItemProps {
  vehicle: Vehicle;
  canEdit: boolean;
  canDeactivate: boolean;
  onDetail: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onViewRegistration: (vehicle: Vehicle) => void;
  onAssignDriver: (vehicle: Vehicle) => void;
  onDeactivate: (vehicle: Vehicle) => void;
}

const VehicleListItemComponent = ({
  vehicle,
  canEdit,
  canDeactivate,
  onDetail,
  onEdit,
  onViewRegistration,
  onAssignDriver,
  onDeactivate,
}: VehicleListItemProps) => {
  const handleCardClick = useCallback(() => onDetail(vehicle), [onDetail, vehicle]);
  const handleCardKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onDetail(vehicle);
    }
  }, [onDetail, vehicle]);
  const handleEdit = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onEdit(vehicle);
  }, [onEdit, vehicle]);
  const handleDeactivate = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDeactivate(vehicle);
  }, [onDeactivate, vehicle]);
  const stopActionKey = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  }, []);

  const handleDetail = useCallback(() => onDetail(vehicle), [onDetail, vehicle]);
  const handleActionEdit = useCallback(() => onEdit(vehicle), [onEdit, vehicle]);
  const handleViewRegistration = useCallback(
    () => onViewRegistration(vehicle),
    [onViewRegistration, vehicle],
  );
  const handleAssignDriver = useCallback(
    () => onAssignDriver(vehicle),
    [onAssignDriver, vehicle],
  );
  const handleActionDeactivate = useCallback(
    () => onDeactivate(vehicle),
    [onDeactivate, vehicle],
  );

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết xe ${vehicle.licensePlate ?? vehicle.number}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={styles.vehicleItem}
    >
      <div className={styles.vehicleMainRow}>
        <VehicleTypeImage
          type={vehicle.type}
          typeName={vehicle.type}
        />
        <div className={styles.vehicleContent}>
          <div className={styles.vehicleTopRow}>
            <VehiclePrimaryInfo vehicle={vehicle} />
            <div className={styles.statusAndQuickActions}>
              {canEdit || canDeactivate ? (
                <div className={styles.quickActions}>
                  {canEdit ? (
                    <Tooltip title="Sửa">
                      <Button
                        size="small"
                        type="text"
                        aria-label={`Sửa xe ${vehicle.number}`}
                        className={styles.quickActionButton}
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        onKeyDown={stopActionKey}
                      />
                    </Tooltip>
                  ) : null}
                  {canDeactivate ? (
                    <Tooltip title="Vô hiệu hóa">
                      <Button
                        size="small"
                        type="text"
                        danger
                        aria-label={`Vô hiệu hóa xe ${vehicle.number}`}
                        className={styles.quickActionButton}
                        icon={<DeleteOutlined />}
                        onClick={handleDeactivate}
                        onKeyDown={stopActionKey}
                      />
                    </Tooltip>
                  ) : null}
                </div>
              ) : null}
              <VehicleStatus status={vehicle.status} />
            </div>
          </div>
          <VehicleSpecifications vehicle={vehicle} />
        </div>
      </div>

      <div className={styles.vehicleFooter}>
        <div className={styles.vehicleIdentifiers}>
          <span>
            Mã xe: <span className={styles.identifierValue}>{vehicle.number}</span>
          </span>
          {vehicle.vin ? (
            <span className={styles.vinValue} title="Số khung xe">
              VIN: <span className={styles.identifierValue}>{vehicle.vin}</span>
            </span>
          ) : null}
        </div>
        <div onClick={(event) => event.stopPropagation()}>
          <VehicleActions
            canEdit={canEdit}
            canDeactivate={canDeactivate}
            onDetail={handleDetail}
            onEdit={handleActionEdit}
            onViewRegistration={handleViewRegistration}
            onAssignDriver={handleAssignDriver}
            onDeactivate={handleActionDeactivate}
          />
        </div>
      </div>
    </article>
  );
};

VehicleListItemComponent.displayName = "VehicleListItem";

export const VehicleListItem = memo(VehicleListItemComponent);
