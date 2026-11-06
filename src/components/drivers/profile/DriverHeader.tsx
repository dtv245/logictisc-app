import { Avatar, Badge, Button, Card, Flex, Space, Tag, Tooltip, Typography, theme } from "antd";
import { EditOutlined, MailOutlined, MessageOutlined, PhoneOutlined, TruckOutlined } from "@ant-design/icons";
import type { DriverDirectoryItem } from "@/types/drivers/driver-profile.types";

const getInitials = (driver: DriverDirectoryItem): string =>
  `${driver.firstName.trim().charAt(0)}${driver.lastName.trim().charAt(0)}`.trim().toLocaleUpperCase() || "?";

const getColorIndex = (name: string): number => {
  const hash = [...name].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) | 0, 7);
  return Math.abs(hash) % 6;
};

const tenure = (joinedDate: string): string => {
  const start = new Date(joinedDate);
  if (!Number.isFinite(start.getTime())) return "—";
  const now = new Date();
  let months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return `${Math.floor(months / 12)} năm ${months % 12} tháng`;
};

const statusColor = (status: string): string => {
  const normalized = status.toUpperCase();
  if (["ACTIVE", "AVAILABLE"].includes(normalized)) return "green";
  if (["INACTIVE", "SUSPENDED", "TERMINATED"].includes(normalized)) return "red";
  return "default";
};

export interface DriverHeaderProps {
  driver: DriverDirectoryItem;
  onEdit: () => void;
  joinedDateLabel?: string;
}

export function DriverHeader({ driver, onEdit, joinedDateLabel = "—" }: DriverHeaderProps) {
  const { token } = theme.useToken();
  const name = `${driver.firstName} ${driver.lastName}`.trim() || "Tài xế";
  const avatarColors = [token.colorPrimary, token.colorInfo, token.colorSuccess, token.colorWarning, token.colorError, token.colorLink];
  const avatarColor = avatarColors[getColorIndex(name)];

  return (
    <Card>
      <Flex align="center" justify="space-between" gap={24} wrap>
        <Flex align="center" gap={20} style={{ minWidth: 0, flex: 1 }}>
          <Badge dot color={driver.status.toUpperCase() === "ACTIVE" ? "green" : "default"} offset={[-5, 66]}>
            <Avatar size={76} style={{ backgroundColor: avatarColor, flex: "none", fontSize: 25, fontWeight: 600 }}>
              {getInitials(driver)}
            </Avatar>
          </Badge>
          <div style={{ minWidth: 0 }}>
            <Space wrap size={[8, 8]}>
              <Typography.Title level={3} style={{ margin: 0 }}>{name}</Typography.Title>
              <Tag color={statusColor(driver.status)}>{driver.status || "—"}</Tag>
              <Tag color="blue">{driver.roleName || "Tài xế"}</Tag>
            </Space>
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
              Làm việc {tenure(driver.joinedDate)} · Vào làm {joinedDateLabel} · Mã: {driver.id}
            </Typography.Text>
            <Space wrap size={[16, 8]} style={{ marginTop: 10 }}>
              {driver.email ? <Typography.Link href={`mailto:${driver.email}`}><MailOutlined /> {driver.email}</Typography.Link> : <Typography.Text type="secondary">Email: —</Typography.Text>}
              {driver.phoneNumber ? <Typography.Text copyable={{ text: driver.phoneNumber }}><PhoneOutlined /> {driver.phoneNumber}</Typography.Text> : <Typography.Text type="secondary">SĐT: —</Typography.Text>}
            </Space>
          </div>
        </Flex>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>
          <Tooltip title="Chức năng gán xe chưa có API trong ứng dụng hiện tại">
            <Button icon={<TruckOutlined />} disabled>Gán xe</Button>
          </Tooltip>
          <Tooltip title="Chưa có luồng nhắn tin tài xế trong ứng dụng">
            <Button icon={<MessageOutlined />} disabled>Nhắn tin</Button>
          </Tooltip>
        </Space>
      </Flex>
    </Card>
  );
}
