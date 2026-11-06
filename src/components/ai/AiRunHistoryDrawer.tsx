import {
  Alert,
  Button,
  Drawer,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { HistoryOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AiRun } from "@/api/ai/ai.types";
import { formatDateTime } from "@/formatters/dateTime";
import { useAiRuns } from "@/hooks/ai/useAiRuns";
import { createListPaginationConfig, DEFAULT_LIST_PAGE_SIZE } from "@/constants/pagination";
import { normalizePage, normalizePageSize } from "@/utils/querySerializer";

const { Text } = Typography;

export interface AiRunHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  loadId?: string;
  canViewRuns?: boolean;
}

export const AiRunHistoryDrawer = ({
  open,
  onClose,
  loadId,
  canViewRuns = false,
}: AiRunHistoryDrawerProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = normalizePage(Number(searchParams.get("aiRunsPage"))) - 1;
  const pageSize = normalizePageSize(Number(searchParams.get("aiRunsPageSize") ?? DEFAULT_LIST_PAGE_SIZE));
  const { runs, total, isFetching, isError, error, refetch } = useAiRuns({
    loadId,
    canViewRuns: Boolean(open && canViewRuns),
    page,
    pageSize,
  });

  // Định nghĩa các cột. Token và Chi phí chỉ xuất hiện khi có quyền canViewRuns
  const columns: ColumnsType<AiRun> = useMemo(() => [
    {
      title: "Loại tác vụ",
      dataIndex: "type",
      key: "type",
      width: 170,
      render: (val: string) => {
        if (val === "DISPATCH_RECOMMENDATION") {
          return <Tag color="blue">Gợi ý điều phối</Tag>;
        }
        return <Tag>{val}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        if (status === "SUCCESS") return <Tag color="success">Thành công</Tag>;
        if (status === "FAILED") return <Tag color="error">Thất bại</Tag>;
        return <Tag color="processing">{status}</Tag>;
      },
    },
    {
      title: "Mô hình LLM",
      dataIndex: "model",
      key: "model",
      ellipsis: true,
      render: (val: string) => <Text code>{val}</Text>,
    },
    {
      title: "Phiên bản Prompt",
      dataIndex: "promptVersion",
      key: "promptVersion",
      width: 130,
      render: (val: string) => <Text type="secondary">{val}</Text>,
    },
    {
      title: "Độ trễ",
      dataIndex: "latencyMs",
      key: "latencyMs",
      width: 100,
      align: "right",
      render: (val: number) => <span>{val} ms</span>,
    },
    // Hai cột bảo mật: Tuyệt đối không hiển thị nếu không có quyền canViewRuns
    ...(canViewRuns
      ? [
          {
            title: "Token tiêu thụ",
            dataIndex: "tokens",
            key: "tokens",
            width: 110,
            align: "right" as const,
            render: (val: number | null | undefined) =>
              val != null ? val.toLocaleString() : "—",
          },
          {
            title: "Chi phí ước tính",
            dataIndex: "cost",
            key: "cost",
            width: 120,
            align: "right" as const,
            render: (val: number | null | undefined) =>
              val != null ? `$${val.toFixed(4)}` : "—",
          },
        ]
      : []),
    {
      title: "Thời điểm",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (val: string) => formatDateTime(val),
    },
  ], [canViewRuns]);

  const pagination = useMemo(() => ({
    current: page + 1,
    pageSize,
    total,
    ...createListPaginationConfig(t),
    onChange: (nextPage: number, nextPageSize: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("aiRunsPage", String(nextPageSize === pageSize ? nextPage : 1));
      params.set("aiRunsPageSize", String(nextPageSize));
      setSearchParams(params);
    },
  }), [page, pageSize, searchParams, setSearchParams, t, total]);

  const expandable = useMemo(() => ({
    expandedRowRender: (record: AiRun) => (
      <div style={{ padding: 8 }}>
        {record.error ? (
          <Alert message="Chi tiết lỗi:" description={record.error} type="error" showIcon />
        ) : (
          <Text type="secondary">Phiên chạy hoàn tất không có lỗi ngoại lệ ghi nhận.</Text>
        )}
      </div>
    ),
    rowExpandable: (record: AiRun) => Boolean(record.error),
  }), []);

  // Nếu người dùng không có quyền xem lịch sử chạy AI
  if (!canViewRuns) {
    return (
      <Drawer
        title="Lịch sử tính toán của AI"
        open={open}
        onClose={onClose}
        width={720}
      >
        <Alert
          message="Không có quyền truy cập"
          description="Tài khoản của bạn không được phân quyền xem lịch sử chạy mô hình AI và chi phí vận hành (capabilities.canViewRuns = false)."
          type="warning"
          showIcon
        />
      </Drawer>
    );
  }

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>Lịch sử tính toán & phiên bản AI {loadId ? `(Đơn #${loadId})` : ""}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={900}
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={() => void refetch()} loading={isFetching}>
          Làm mới
        </Button>
      }
      data-testid="ai-run-history-drawer"
    >
      {isError && (
        <Alert
          message="Lỗi tải lịch sử chạy AI"
          description={(error as Error)?.message}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table<AiRun>
        columns={columns}
        dataSource={runs}
        rowKey="id"
        loading={isFetching}
        pagination={pagination}
        size="small"
        expandable={expandable}
      />
    </Drawer>
  );
};
