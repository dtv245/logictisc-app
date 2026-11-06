import {
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Empty,
  Grid,
  List,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import { memo, type CSSProperties, type MouseEvent } from "react";
import { formatDateOnly } from "@/formatters/dateTime";
import type { DriverDirectoryItem } from "@/types/drivers/driver-profile.types";
import { StatusTag, type StatusTone } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import "./DriverDirectoryList.scss";

export interface DriverDirectoryPagination {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

interface DriverDirectoryListProps {
  drivers: DriverDirectoryItem[];
  loading: boolean;
  pagination: DriverDirectoryPagination;
  onOpenProfile: (driver: DriverDirectoryItem) => void;
  emptyDescription: string;
  locale: string;
}

const emptyValue = "—";

const initials = (driver: DriverDirectoryItem): string => {
  const first = driver.firstName.trim().split(/\s+/u).at(0) ?? "";
  const last = driver.lastName.trim().split(/\s+/u).at(-1) ?? "";
  const chars = [Array.from(first)[0], Array.from(last)[0]].filter(Boolean);
  return chars.join("").toLocaleUpperCase() || "?";
};

const nameHash = (value: string): number => {
  let hash = 0;
  for (const character of value.toLocaleLowerCase()) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }
  return hash;
};

const getDriverStatusTone = (status: string): StatusTone => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "đang làm việc") return "success";
  if (normalized === "nghỉ việc") return "neutral";
  return statusTone(status);
};

const driverAddress = (driver: DriverDirectoryItem): string =>
  [
    driver.addressLine1,
    driver.addressLine2,
    driver.addressCity,
    driver.addressState,
    driver.addressZipCode,
    driver.addressCountry,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ") || emptyValue;

const stopRowClick = (event: MouseEvent): void => event.stopPropagation();

interface DriverItemProps {
  driver: DriverDirectoryItem;
  locale: string;
  onOpenProfile: (driver: DriverDirectoryItem) => void;
}

const DriverItemComponent = ({ driver, locale, onOpenProfile }: DriverItemProps) => {
  const { token } = theme.useToken();
  const fullName = `${driver.firstName} ${driver.lastName}`.trim() || emptyValue;
  const email = driver.email?.trim();
  const phone = driver.phoneNumber?.trim();
  const address = driverAddress(driver);
  const palette = [token.colorPrimary, token.colorSuccess, token.colorWarning, token.colorError, token.colorInfo];
  const rowStyle: CSSProperties & { "--driver-row-hover": string } = {
    borderColor: token.colorBorder,
    "--driver-row-hover": token.colorFillTertiary,
  };

  return (
    <List.Item
      actions={[
        <div className="driver-directory-actions" key="actions" onClick={stopRowClick}>
          <Typography.Text className="driver-directory-joined" type="secondary">
            Vào làm: {driver.joinedDate ? formatDateOnly(driver.joinedDate, { locale, timeZone: "Asia/Ho_Chi_Minh" }) : emptyValue}
          </Typography.Text>
          <Button onClick={() => onOpenProfile(driver)} size="small" type="default">
            Mở hồ sơ
          </Button>
        </div>,
      ]}
      className="driver-directory-item"
      onClick={() => onOpenProfile(driver)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenProfile(driver);
        }
      }}
      role="link"
      style={rowStyle}
      tabIndex={0}
    >
      <List.Item.Meta
        avatar={(
          <Avatar
            aria-label={fullName}
            className="driver-directory-avatar"
            size={48}
            style={{
              backgroundColor: palette[nameHash(fullName) % palette.length],
              color: token.colorTextLightSolid,
              flex: "0 0 auto",
            }}
          >
            {initials(driver)}
          </Avatar>
        )}
        description={(
          <div className="driver-directory-description">
            <Space className="driver-directory-contact" size={[16, 4]} wrap>
              {email ? (
                <Typography.Link copyable={{ text: email }} href={`mailto:${email}`} onClick={stopRowClick}>
                  <MailOutlined /> <span>{email}</span>
                </Typography.Link>
              ) : (
                <Typography.Text type="secondary"><MailOutlined /> {emptyValue}</Typography.Text>
              )}
              {phone ? (
                <Typography.Link copyable={{ text: phone }} href={`tel:${phone}`} onClick={stopRowClick}>
                  <PhoneOutlined /> <span>{phone}</span>
                </Typography.Link>
              ) : (
                <Typography.Text type="secondary"><PhoneOutlined /> {emptyValue}</Typography.Text>
              )}
            </Space>
            <Tooltip placement="topLeft" title={address === emptyValue ? undefined : address}>
              <Typography.Text className="driver-directory-address" ellipsis type={address === emptyValue ? "secondary" : undefined}>
                <EnvironmentOutlined /> <span>{address}</span>
              </Typography.Text>
            </Tooltip>
          </div>
        )}
        title={(
          <Space className="driver-directory-title" size={[8, 4]} wrap>
            <Tooltip title={fullName}>
              <Typography.Text className="driver-directory-name" ellipsis strong>{fullName}</Typography.Text>
            </Tooltip>
            <StatusTag
              tone={getDriverStatusTone(driver.status)}
              label={driver.status?.trim() || emptyValue}
            />
            {driver.roleName?.trim() && <Tag>{driver.roleName}</Tag>}
          </Space>
        )}
      />
    </List.Item>
  );
};

DriverItemComponent.displayName = "DriverItem";

const DriverItem = memo(DriverItemComponent);

const DriverListSkeleton = () => (
  <div aria-label="Đang tải tài xế" className="driver-directory-loading" role="status">
    {Array.from({ length: 5 }, (_, index) => (
      <div className="driver-directory-skeleton" key={index}>
        <Skeleton active avatar paragraph={{ rows: 2 }} title />
      </div>
    ))}
  </div>
);

export const DriverDirectoryList = ({
  drivers,
  loading,
  pagination,
  onOpenProfile,
  emptyDescription,
  locale,
}: DriverDirectoryListProps) => {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const { token } = theme.useToken();
  const listStyle: CSSProperties & {
    "--driver-focus": string;
    "--driver-border": string;
    "--driver-background": string;
    "--driver-split": string;
  } = {
    "--driver-focus": token.colorPrimary,
    "--driver-border": token.colorBorderSecondary,
    "--driver-background": token.colorBgContainer,
    "--driver-split": token.colorSplit,
  };

  return (
    <section className="driver-directory-list" style={listStyle}>
      {loading ? (
        <DriverListSkeleton />
      ) : drivers.length === 0 ? (
        <Empty className="driver-directory-empty" description={emptyDescription} />
      ) : (
        <List<DriverDirectoryItem>
          className="driver-directory-results"
          dataSource={drivers}
          itemLayout="horizontal"
          renderItem={(driver) => (
            <DriverItem driver={driver} key={driver.id} locale={locale} onOpenProfile={onOpenProfile} />
          )}
          rowKey="id"
        />
      )}
      {!loading && pagination.total > 0 && (
        <Pagination
          className="driver-directory-pagination"
          current={pagination.current}
          onChange={pagination.onChange}
          pageSize={pagination.pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          showSizeChanger
          showTotal={(total, range) => `${range[0]}–${range[1]} / ${total}`}
          size={isMobile ? "small" : "default"}
          total={pagination.total}
        />
      )}
    </section>
  );
};
