import { Alert, Card, Empty, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCustom } from "@refinedev/core";
import { StatusTag } from "@/components/StatusTag";
import type { StatusTone } from "@/components/StatusTag";
import type { ApiError } from "@/types/api.types";
import type { Container } from "@/types/container.types";

export interface TerminalContainersTabProps {
  terminalId: string;
}

const containerStatusToneMap: Record<string, StatusTone> = {
  available: "success",
  loaded: "success",
  empty: "neutral",
  in_transit: "processing",
  booked: "processing",
  delivered: "success",
  returned: "neutral",
  maintenance: "warning",
};

/**
 * TerminalContainersTab — Tab hiển thị danh sách các container đang lưu bãi tại Terminal.
 * Gọi API `GET /api/containers?currentTerminalId={terminalId}`.
 */
export const TerminalContainersTab = ({ terminalId }: TerminalContainersTabProps) => {
  const { data, isLoading, isError, error } = useCustom<
    { items?: Container[] } | Container[],
    ApiError
  >({
    url: "/api/containers",
    method: "get",
    config: {
      query: {
        currentTerminalId: terminalId,
      },
    },
    queryOptions: {
      enabled: Boolean(terminalId),
      retry: 1,
    },
    errorNotification: false,
  });

  const rawData = data?.data;
  const containers: Container[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { items?: Container[] })?.items ?? [];

  const columns: ColumnsType<Container> = [
    {
      title: "Mã số Container",
      dataIndex: "number",
      key: "number",
      width: 170,
      render: (value: unknown) => {
        if (!value) return <span className="table-cell-empty">—</span>;
        return (
          <span className="table-number-link table-mono-cell tabular-nums">
            {String(value)}
          </span>
        );
      },
    },
    {
      title: "Loại ISO",
      dataIndex: "isoType",
      key: "isoType",
      width: 120,
      render: (value: unknown) => (value ? <Tag color="blue">{String(value)}</Tag> : "—"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: unknown) => {
        const val = String(status ?? "");
        if (!val) return "—";
        const tone = containerStatusToneMap[val] ?? "default";
        return <StatusTag label={val} tone={tone} />;
      },
    },
    {
      title: "Tải trọng (Gross Weight)",
      dataIndex: "grossWeight",
      key: "grossWeight",
      align: "right",
      width: 160,
      render: (value: unknown) => {
        if (value === null || value === undefined || value === "") return "—";
        return (
          <span className="tabular-nums">
            {Number(value).toLocaleString("vi-VN")} kg
          </span>
        );
      },
    },
    {
      title: "Số chì (Seal)",
      dataIndex: "sealNumber",
      key: "sealNumber",
      width: 140,
      render: (value: unknown) => (value ? <span className="table-mono-cell">{String(value)}</span> : "—"),
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (value: unknown) => String(value || "—"),
    },
  ];

  if (isError) {
    return (
      <Card variant="borderless" style={{ marginTop: 16 }}>
        <Alert
          type="info"
          showIcon
          message="Thông tin Container tại bến"
          description={
            <div>
              <Typography.Paragraph style={{ margin: 0 }}>
                Chưa có dữ liệu hoặc API tra cứu container theo bến bãi (
                <code>GET /api/containers?currentTerminalId={terminalId}</code>) chưa sẵn sàng trên máy chủ backend.
              </Typography.Paragraph>
              {error?.message && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Chi tiết: {error.message}
                </Typography.Text>
              )}
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      variant="borderless"
      style={{
        marginTop: 16,
        borderRadius: 8,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
      title="Danh sách Container đang lưu bãi"
    >
      <Table<Container>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={containers}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{
          emptyText: (
            <Empty
              description="Hiện không có container nào đang lưu bãi tại bến này"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Card>
  );
};
