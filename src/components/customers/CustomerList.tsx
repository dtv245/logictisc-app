import {
  DeleteOutlined,
  EllipsisOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Grid,
  Input,
  List,
  Pagination,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
  theme,
  type MenuProps,
} from "antd";
import { memo, useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { Customer } from "@/types/customers/customer.types";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { StatusTag, type StatusTone } from "@/components/StatusTag";
import { statusTone } from "@/components/statusTone";
import "./CustomerList.scss";

const EMPTY_VALUE = "—";

export interface CustomerListRecord extends Customer {
  createdAt?: string | null;
}

export interface CustomerListPagination {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface CustomerListProps {
  customers: CustomerListRecord[];
  loading: boolean;
  onView: (customer: CustomerListRecord) => void;
  onEdit: (customer: CustomerListRecord) => void;
  onDelete: (customer: CustomerListRecord) => void;
  pagination: CustomerListPagination;
  searchValue?: string;
  statusValue?: string;
  onSearch?: (value: string) => void;
  onStatusChange?: (value: string | undefined) => void;
  createButton?: ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  error?: ReactNode;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length > 1) return `${Array.from(words[0])[0]}${Array.from(words.at(-1) ?? "")[0]}`.toUpperCase();
  return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
};

const hashName = (name: string): number => {
  let hash = 0;
  for (const character of name.trim().toLocaleLowerCase()) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }
  return hash;
};

export const CustomerAvatar = ({ name }: { name: string }) => {
  const { token } = theme.useToken();
  const palette = [token.colorPrimary, token.colorSuccess, token.colorWarning, token.colorError, token.colorInfo];
  const background = palette[hashName(name) % palette.length];

  return (
    <Avatar
      aria-label={name || "Khách hàng"}
      className="customer-list-avatar"
      icon={!name.trim() ? <UserOutlined /> : undefined}
      size={48}
      style={{ backgroundColor: background, color: token.colorTextLightSolid, flex: "0 0 auto" }}
    >
      {name.trim() ? getInitials(name) : null}
    </Avatar>
  );
};

const getCustomerStatusTone = (status: string): StatusTone => {
  const normalized = status.trim().toLowerCase();
  if (normalized === "đang hoạt động") return "success";
  if (normalized === "không hoạt động") return "neutral";
  if (normalized === "chờ duyệt") return "warning";
  return statusTone(status);
};

export const CustomerStatusTag = ({ status }: { status?: string | null }) => {
  const value = status?.trim();
  if (!value) return <StatusTag label={EMPTY_VALUE} tone="neutral" />;
  return <StatusTag label={value} tone={getCustomerStatusTone(value)} />;
};

const formatAddress = (customer: Pick<
  Customer,
  "addressLine1" | "addressLine2" | "addressCity" | "addressState" | "addressZipCode" | "addressCountry"
>): string =>
  [
    customer.addressLine1,
    customer.addressLine2,
    customer.addressCity,
    customer.addressState,
    customer.addressZipCode,
    customer.addressCountry,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");

const formatCreatedAt = (value?: string | null): string => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const stopRowClick = (event: MouseEvent): void => event.stopPropagation();

interface CustomerItemProps {
  customer: CustomerListRecord;
  onView: (customer: CustomerListRecord) => void;
  onEdit: (customer: CustomerListRecord) => void;
  onDelete: (customer: CustomerListRecord) => void;
  canEdit: boolean;
  canDelete: boolean;
  mobile: boolean;
}

const CustomerItemComponent = ({ customer, onView, onEdit, onDelete, canEdit, canDelete, mobile }: CustomerItemProps) => {
  const { token } = theme.useToken();
  const fullAddress = formatAddress(customer) || EMPTY_VALUE;
  const email = customer.email?.trim();
  const phone = customer.phone?.trim();
  const taxId = customer.taxId?.trim();
  const rowStyle: CSSProperties & { "--customer-row-hover": string } = {
    borderColor: token.colorBorder,
    "--customer-row-hover": token.colorFillTertiary,
  };

  const deleteLabel = (
    <Popconfirm
      cancelText="Hủy"
      okButtonProps={{ danger: true }}
      okText="Xóa"
      onConfirm={() => onDelete(customer)}
      title={<>Xóa khách hàng <strong>{customer.name || EMPTY_VALUE}</strong>?</>}
    >
      <span onClick={stopRowClick}>Xóa khách hàng</span>
    </Popconfirm>
  );

  const mobileMenu: MenuProps["items"] = [
    { key: "view", icon: <UserOutlined />, label: "Xem" },
    ...(canEdit ? [{ key: "edit", label: "Sửa" }] : []),
    ...(canDelete ? [{ key: "delete", danger: true, icon: <DeleteOutlined />, label: deleteLabel }] : []),
  ];

  const actionButtons = mobile ? (
    <Dropdown
      menu={{
        items: mobileMenu,
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          if (key === "view") onView(customer);
          if (key === "edit") onEdit(customer);
        },
      }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        aria-label={`Thao tác với ${customer.name || "khách hàng"}`}
        icon={<EllipsisOutlined />}
        onClick={stopRowClick}
      />
    </Dropdown>
  ) : (
    <Space size={8} wrap onClick={stopRowClick}>
      <Button size="small" onClick={() => onView(customer)}>Xem</Button>
      {canEdit && <Button size="small" onClick={() => onEdit(customer)}>Sửa</Button>}
      {canDelete && (
        <Popconfirm
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          okText="Xóa"
          onConfirm={() => onDelete(customer)}
          title={<>Xóa khách hàng <strong>{customer.name || EMPTY_VALUE}</strong>?</>}
        >
          <Button danger size="small" onClick={stopRowClick}>Xóa</Button>
        </Popconfirm>
      )}
    </Space>
  );

  return (
    <List.Item
      actions={[
        <div className="customer-list-actions" key="actions" onClick={stopRowClick}>
          <Typography.Text className="customer-created-date" type="secondary">
            Ngày tạo: {formatCreatedAt(customer.createdAt)}
          </Typography.Text>
          {actionButtons}
        </div>,
      ]}
      className="customer-list-item"
      onClick={() => onView(customer)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(customer);
        }
      }}
      style={rowStyle}
      tabIndex={0}
    >
      <List.Item.Meta
        avatar={<CustomerAvatar name={customer.name || ""} />}
        description={
          <div className="customer-list-description">
            <Space className="customer-contact-row" size={[16, 4]} wrap>
              {email ? (
                <Typography.Link copyable={{ text: email }} href={`mailto:${email}`} onClick={stopRowClick}>
                  <MailOutlined /> <span>{email}</span>
                </Typography.Link>
              ) : (
                <Typography.Text type="secondary"><MailOutlined /> {EMPTY_VALUE}</Typography.Text>
              )}
              {phone ? (
                <Typography.Link copyable={{ text: phone }} href={`tel:${phone}`} onClick={stopRowClick}>
                  <PhoneOutlined /> <span>{phone}</span>
                </Typography.Link>
              ) : (
                <Typography.Text type="secondary"><PhoneOutlined /> {EMPTY_VALUE}</Typography.Text>
              )}
            </Space>
            <Typography.Text className="customer-tax-row" type={taxId ? undefined : "secondary"}>
              <IdcardOutlined /> <span>MST: {taxId || EMPTY_VALUE}</span>
            </Typography.Text>
            <Tooltip placement="topLeft" title={fullAddress === EMPTY_VALUE ? undefined : fullAddress}>
                <Typography.Text className="customer-address-row" ellipsis type={!formatAddress(customer) ? "secondary" : undefined}>
                <EnvironmentOutlined /> <span>{fullAddress}</span>
              </Typography.Text>
            </Tooltip>
            {customer.notes?.trim() ? (
              <Typography.Text className="customer-notes-row" ellipsis type="secondary">
                {customer.notes.trim()}
              </Typography.Text>
            ) : null}
          </div>
        }
        title={
          <Space className="customer-title-row" size={[8, 4]} wrap>
            <Tooltip title={customer.name || EMPTY_VALUE}>
              <Typography.Text className="customer-name" ellipsis strong>
                {customer.name?.trim() || EMPTY_VALUE}
              </Typography.Text>
            </Tooltip>
            <CustomerStatusTag status={customer.status} />
            {customer.isVatExempt && <StatusTag label="Miễn VAT" tone="processing" />}
          </Space>
        }
      />
    </List.Item>
  );
};

CustomerItemComponent.displayName = "CustomerItem";

const CustomerItem = memo(CustomerItemComponent);

const LoadingItems = () => (
  <div aria-label="Đang tải khách hàng" className="customer-list-loading" role="status">
    {Array.from({ length: 5 }, (_, index) => (
      <div className="customer-list-skeleton" key={index}>
        <Skeleton active avatar paragraph={{ rows: 3 }} title />
      </div>
    ))}
  </div>
);

export const CustomerList = ({
  customers,
  loading,
  onView,
  onEdit,
  onDelete,
  pagination,
  searchValue = "",
  statusValue,
  onSearch,
  onStatusChange,
  createButton,
  canEdit = true,
  canDelete = true,
  error,
}: CustomerListProps) => {
  const screens = Grid.useBreakpoint();
  const mobile = screens.md === false;
  const [searchDraft, setSearchDraft] = useState(searchValue);
  const [lastSearchValue, setLastSearchValue] = useState(searchValue);
  const { token } = theme.useToken();
  const debouncedSearch = useDebouncedSearch(searchDraft, 300);

  if (searchValue !== lastSearchValue) {
    setLastSearchValue(searchValue);
    setSearchDraft(searchValue);
  }

  useEffect(() => {
    if (!onSearch || debouncedSearch.trim() === searchValue.trim()) return;
    onSearch(debouncedSearch.trim());
  }, [debouncedSearch, onSearch, searchValue]);

  const statuses = useMemo(() => {
    const values = new Set(["active", "inactive"]);
    customers.forEach((customer) => {
      if (customer.status?.trim()) values.add(customer.status.trim());
    });
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [customers]);

  const rootStyle: CSSProperties & { "--customer-divider": string; "--customer-focus": string } = {
    "--customer-divider": token.colorSplit,
    "--customer-focus": token.colorPrimary,
  };

  return (
    <section className="customer-list" style={rootStyle}>
      <div className="customer-list-header">
        <Input
          allowClear
          aria-label="Tìm khách hàng"
          className="customer-search"
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại hoặc MST"
          value={searchDraft}
        />
        <Select
          aria-label="Lọc theo trạng thái"
          className="customer-status-filter"
          onChange={(value) => onStatusChange?.(value || undefined)}
          options={[
            { label: "Tất cả trạng thái", value: "" },
            ...statuses.map((status) => ({ label: status, value: status })),
          ]}
          value={statusValue ?? ""}
        />
        {createButton}
      </div>

      {error}
      {loading ? (
        <LoadingItems />
      ) : customers.length === 0 ? (
        <Empty className="customer-list-empty" description="Không có khách hàng phù hợp" />
      ) : (
        <List<CustomerListRecord>
          className="customer-list-results"
          dataSource={customers}
          itemLayout="horizontal"
          locale={{ emptyText: <Empty description="Không có khách hàng" /> }}
          renderItem={(customer) => (
            <CustomerItem
              canDelete={canDelete}
              canEdit={canEdit}
              customer={customer}
              key={customer.id}
              mobile={mobile}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
            />
          )}
          rowKey="id"
        />
      )}

      {!loading && pagination.total > 0 && (
        <Pagination
          className="customer-list-pagination"
          current={pagination.current}
          onChange={pagination.onChange}
          pageSize={pagination.pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          showSizeChanger
          showTotal={(total, range) => `${range[0]}–${range[1]} / ${total}`}
          size={mobile ? "small" : "default"}
          total={pagination.total}
        />
      )}
    </section>
  );
};
