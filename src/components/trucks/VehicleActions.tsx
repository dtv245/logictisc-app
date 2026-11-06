import { useCallback, useMemo } from "react";
import type { KeyboardEvent, MouseEventHandler } from "react";
import { MoreOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";

import styles from "./vehicleList.module.css";

interface VehicleActionsProps {
  canEdit: boolean;
  canDeactivate: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onViewRegistration: () => void;
  onAssignDriver: () => void;
  onDeactivate: () => void;
}

export const VehicleActions = ({
  onDetail,
  onEdit,
  onViewRegistration,
  onAssignDriver,
  onDeactivate,
  canEdit,
  canDeactivate,
}: VehicleActionsProps) => {
  const menuItems = useMemo<MenuProps["items"]>(() => {
    const items: NonNullable<MenuProps["items"]> = [
      ...(canEdit ? [
        { key: "edit", label: "Chỉnh sửa xe" },
        { key: "assign", label: "Gán tài xế" },
      ] : []),
      { key: "registration", label: "Lịch sử đăng kiểm" },
    ];
    if (canDeactivate) {
      items.push({ type: "divider" }, { key: "deactivate", label: "Vô hiệu hóa xe", danger: true });
    }
    return items;
  }, [canDeactivate, canEdit]);

  const handleMenuClick = useCallback<NonNullable<MenuProps["onClick"]>>(
    ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === "edit") onEdit();
      else if (key === "registration") onViewRegistration();
      else if (key === "assign") onAssignDriver();
      else if (key === "deactivate") onDeactivate();
    },
    [onAssignDriver, onDeactivate, onEdit, onViewRegistration],
  );

  const handleDetail = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      event.stopPropagation();
      onDetail();
    },
    [onDetail],
  );
  const stopKeyPropagation = useCallback((event: KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div className={styles.cardActions}>
      <Button size="small" type="primary" onClick={handleDetail} onKeyDown={stopKeyPropagation}>
        Chi tiết
      </Button>
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <Button
          size="small"
          type="text"
          aria-label="Thao tác nhanh"
          className={styles.menuButton}
          icon={<MoreOutlined />}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={stopKeyPropagation}
        />
      </Dropdown>
    </div>
  );
};
