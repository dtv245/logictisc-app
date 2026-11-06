import { Alert, Button, Table, Tooltip, Typography } from "antd";
import { useState } from "react";
import Decimal from "decimal.js";
import { usePayrollSettlements } from "@/hooks/payroll/usePayrollSettlements";
import { isUuid } from "@/utils/uuid";
import type { DriverSettlementView } from "@/types/settlement.dto";

interface Props {
  payPeriodId: string;
  currency: string;
  value?: DriverSettlementView[];
  onChange?: (value: DriverSettlementView[]) => void;
}

export function PayrollSettlementPicker({ payPeriodId, currency, value = [], onChange }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const query = usePayrollSettlements(payPeriodId, page, pageSize);
  const selected = new Map(value.map((row) => [row.id, row]));
  const total = value.reduce((sum, row) => sum.plus(row.settlementNet), new Decimal(0));
  if (!isUuid(payPeriodId)) return <Alert type="info" message="Nhập mã kỳ lương hợp lệ để chọn quyết toán." />;
  if (!query.checkingAccess && !query.allowed) return <Alert type="warning" message="Bạn không có quyền xem quyết toán." />;
  if (query.isError) return <Alert type="error" message="Không tải được quyết toán." action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} />;
  return <>
    <Table<DriverSettlementView>
      rowKey="id" size="small" loading={query.isFetching || query.checkingAccess}
      dataSource={query.data?.data ?? []} scroll={{ x: 700 }}
      locale={{ emptyText: "Không có quyết toán đã khóa trong kỳ này." }}
      rowSelection={{
        selectedRowKeys: [...selected.keys()], preserveSelectedRowKeys: true,
        getCheckboxProps: (row) => ({ disabled: row.status !== "LOCKED" || row.payPeriodId !== payPeriodId || row.currency.toUpperCase() !== currency.trim().toUpperCase() }),
        onSelect: (row, checked) => { if (checked) selected.set(row.id, row); else selected.delete(row.id); onChange?.([...selected.values()]); },
        onSelectAll: (checked, _rows, changed) => { changed.forEach((row) => checked ? selected.set(row.id, row) : selected.delete(row.id)); onChange?.([...selected.values()]); },
      }}
      columns={[
        {
          title: "Quyết toán",
          dataIndex: "settlementNumber",
          ellipsis: true,
          render: (val: string) => (
            <Tooltip title={val}>
              <span className="table-cell-ellipsis">{val}</span>
            </Tooltip>
          ),
        },
        {
          title: "Tài xế",
          ellipsis: true,
          render: (_: unknown, row) => {
            const text = row.driverName || row.driverId;
            return (
              <Tooltip title={text}>
                <span className="table-cell-ellipsis">{text}</span>
              </Tooltip>
            );
          },
        },
        {
          title: "Kỳ",
          ellipsis: true,
          render: (_: unknown, row) => {
            const text = row.payPeriodCode || row.payPeriodId;
            return (
              <Tooltip title={text}>
                <span className="table-cell-ellipsis">{text}</span>
              </Tooltip>
            );
          },
        },
        { title: "Trạng thái", dataIndex: "status" },
        { title: "Số tiền", render: (_: unknown, row) => `${row.settlementNet} ${row.currency}` },
      ]}
      pagination={{ current: page, pageSize, total: query.data?.meta.pagination.total ?? 0, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], onChange: (next, size) => { setPage(size === pageSize ? next : 1); setPageSize(size); } }}
    />
    <Typography.Text>Đã chọn {value.length} quyết toán · Tổng: {total.toFixed(2)} {currency.toUpperCase()}</Typography.Text>
  </>;
}
