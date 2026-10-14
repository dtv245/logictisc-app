/**
 * TerminalShow — Màn hình chi tiết Bến bãi (Terminal) và danh sách Container lưu bãi.
 */

import {
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useCan, useShow } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatTerminalAddress } from "@/features/terminals/components/columns";
import { TerminalContainersTab } from "@/features/terminals/components/TerminalContainersTab";
import type { ApiError } from "@/types/api.types";
import type { Terminal } from "@/types/terminal.types";
import { routes } from "@constants/routes";

export const TerminalShow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { queryResult } = useShow<Terminal, ApiError>({ resource: "terminals" });

  const { data: canEditData } = useCan({
    resource: "terminals",
    action: "edit",
  });
  const { data: canDeleteData } = useCan({
    resource: "terminals",
    action: "delete",
  });

  const terminal = queryResult.data?.data;

  if (queryResult.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void queryResult.refetch()} size="small">
            {t("actions.retry", "Thử lại")}
          </Button>
        }
        description={queryResult.error?.message}
        message="Không thể tải thông tin bến bãi (Terminal)"
        showIcon
        type="error"
      />
    );
  }

  if (queryResult.isLoading || !terminal) {
    return (
      <Show isLoading={true}>
        <div style={{ minHeight: 240 }} />
      </Show>
    );
  }

  const fullAddress = formatTerminalAddress(terminal);
  const typeLabel = t(`forms.options.${terminal.type}`, terminal.type);

  const tabItems = [
    {
      key: "details",
      label: "Thông tin chi tiết",
      children: (
        <Card
          variant="borderless"
          style={{
            borderRadius: 8,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
          title="Thông tin bến bãi & vị trí"
        >
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Tên bến bãi">{terminal.name}</Descriptions.Item>
            <Descriptions.Item label="Mã UN/LOCODE">
              <span className="table-mono-cell">{terminal.code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Phân loại">{typeLabel}</Descriptions.Item>

            <Descriptions.Item label="Mã quốc gia">{terminal.countryCode}</Descriptions.Item>
            <Descriptions.Item label="Thành phố">
              {terminal.addressCity ?? terminal.address?.city ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tỉnh / Bang">
              {terminal.addressState ?? terminal.address?.state ?? "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Địa chỉ dòng 1" span={2}>
              {terminal.addressLine1 ?? terminal.address?.line1 ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Mã bưu chính">
              {terminal.addressZipCode ?? terminal.address?.zipCode ?? "—"}
            </Descriptions.Item>

            {terminal.addressLine2 && (
              <Descriptions.Item label="Địa chỉ dòng 2" span={3}>
                {terminal.addressLine2}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="Địa chỉ đầy đủ" span={3}>
              {fullAddress || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Ghi chú" span={3}>
              {terminal.notes || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Ngày tạo">
              {terminal.createdAt ? new Date(terminal.createdAt).toLocaleString("vi-VN") : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Lần sửa đổi cuối" span={2}>
              {terminal.lastModifiedAt ? new Date(terminal.lastModifiedAt).toLocaleString("vi-VN") : "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: "containers",
      label: "Containers tại bến (Containers at Terminal)",
      children: <TerminalContainersTab terminalId={terminal.id} />,
    },
  ];

  return (
    <Show
      isLoading={queryResult.isLoading}
      headerButtons={
        <Space>
          <ListButton onClick={() => navigate(routes.resources.terminals.list)}>
            {t("actions.list", "Danh sách")}
          </ListButton>
          {canEditData?.can && (
            <EditButton recordItemId={terminal.id}>
              {t("actions.edit", "Sửa")}
            </EditButton>
          )}
          {canDeleteData?.can && (
            <DeleteButton
              recordItemId={terminal.id}
              mutationMode="pessimistic"
              confirmTitle={t("crud.deleteConfirm", { record: terminal.name })}
              confirmOkText={t("actions.confirm", "Xác nhận")}
              confirmCancelText={t("actions.cancel", "Hủy")}
            />
          )}
        </Space>
      }
      title={
        <Space align="center" wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {terminal.name}
          </Typography.Title>
          <Tag color="blue" className="table-mono-cell">
            {terminal.code}
          </Tag>
          <Tag color="cyan">{typeLabel}</Tag>
          <Tag color="geekblue">{terminal.countryCode}</Tag>
        </Space>
      }
    >
      <Tabs defaultActiveKey="details" items={tabItems} />
    </Show>
  );
};
