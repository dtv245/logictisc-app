/**
 * Unit & Integration Tests cho Settlement Columns (settlement.columns.tsx):
 * - settlementNumber: router Link, class table-number-link, font-weight 500, fallback "—".
 * - driverName: ellipsis text, Tooltip, fallback "—".
 * - status & settlementType: StatusTag với màu ngữ nghĩa WCAG AA, dot indicator và nhãn chữ i18n.
 * - Tiền tệ (gross, deductions, reimbursements, net):
 *   + align: "right", font-variant-numeric: tabular-nums
 *   + deductions: luôn hiển thị nhất quán dấu âm (-) phía trước cho các khoản trừ dương
 *   + net: in đậm (fontWeight 600)
 * - actions: fixed right, Button View có aria-label, tooltip và vùng chạm >= 32px.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { Table } from "antd";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";

import { initializeAppI18n } from "@locales";
import { defaultStatusStyles } from "@components/StatusTag";
import {
  createSettlementColumns,
  SETTLEMENT_TYPE_TONE_MAP,
} from "@features/settlements/settlement.columns";
import type { DriverSettlementView } from "@/types/settlement.dto";

let i18nInstance: I18nInstance;

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderWithProviders = (node: ReactNode) => {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18nInstance}>{node}</I18nextProvider>
    </MemoryRouter>,
  );
};

describe("Settlement Columns — UX, Formatting & A11y", () => {
  const sample: DriverSettlementView = {
    id: "ds-001",
    settlementNumber: "DS-2026-001",
    driverId: "drv-001",
    driverName: "Alex Driver",
    payPeriodId: "pp-001",
    payPeriodCode: "PP-2026-W40",
    settlementType: "ORIGINAL",
    status: "APPROVED",
    currency: "USD",
    grossEarnings: 2500,
    deductionAmount: 150,
    reimbursementAmount: 50,
    settlementNet: 2400,
    calculatedAt: "2026-10-12T10:00:00Z",
    approvedAt: null,
    lockedAt: null,
  };

  const TableHarness = ({ data }: { data: DriverSettlementView[] }) => {
    const columns = createSettlementColumns({
      t: i18nInstance.t,
      locale: "en-US",
    });
    return <Table columns={columns} dataSource={data} pagination={false} rowKey="id" />;
  };

  it("cột settlementNumber render dạng link với class table-number-link", () => {
    renderWithProviders(<TableHarness data={[sample]} />);

    const link = screen.getByRole("link", { name: "DS-2026-001" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass("table-number-link");
    expect(link).toHaveAttribute("href", "/settlements/ds-001");
  });

  it("cột deductionAmount hiển thị nhất quán kèm dấu âm (-) phía trước", () => {
    renderWithProviders(<TableHarness data={[sample]} />);

    // Dữ liệu backend là 150 -> Hiển thị -$150.00
    const deduction = screen.getByText("-$150.00");
    expect(deduction).toBeInTheDocument();
    expect(deduction).toHaveClass("tabular-nums");
  });

  it("cột grossEarnings, reimbursementAmount, settlementNet căn phải và tabular-nums", () => {
    renderWithProviders(<TableHarness data={[sample]} />);

    const gross = screen.getByText("$2,500.00");
    expect(gross).toBeInTheDocument();
    expect(gross).toHaveClass("tabular-nums");

    const reimbursement = screen.getByText("$50.00");
    expect(reimbursement).toBeInTheDocument();
    expect(reimbursement).toHaveClass("tabular-nums");

    const net = screen.getByText("$2,400.00");
    expect(net).toBeInTheDocument();
    expect(net).toHaveClass("tabular-nums");
    expect(net.tagName).toBe("STRONG");
  });

  it("cột status và settlementType hiển thị StatusTag với màu ngữ nghĩa WCAG AA", () => {
    const { container } = renderWithProviders(<TableHarness data={[sample]} />);

    const statusTags = screen.getAllByRole("status");
    expect(statusTags.length).toBe(2);

    // 1. settlementType (ORIGINAL -> processing xanh dương)
    expect(SETTLEMENT_TYPE_TONE_MAP.ORIGINAL).toBe("processing");
    const dots = container.querySelectorAll(".status-tag__dot");
    expect(dots[0]).toHaveStyle({ backgroundColor: defaultStatusStyles.processing.dotColor });

    // 2. status (APPROVED -> success xanh lá)
    expect(dots[1]).toHaveStyle({ backgroundColor: defaultStatusStyles.success.dotColor });
  });

  it("cột actions hiển thị nút Xem với aria-label chứa mã quyết toán và vùng chạm >= 32px", () => {
    renderWithProviders(<TableHarness data={[sample]} />);

    const viewBtn = screen.getByRole("button", { name: /DS-2026-001/i });
    expect(viewBtn).toBeInTheDocument();
    expect(viewBtn).toHaveClass("table-action-btn--show");
    expect(viewBtn).toHaveStyle({ minWidth: "32px", minHeight: "32px" });
  });

  it("hiển thị '—' với class table-cell-empty khi driverName hoặc giá trị rỗng", () => {
    const emptySample: DriverSettlementView = {
      ...sample,
      id: "ds-empty",
      driverName: null,
      driverId: "",
      deductionAmount: null as unknown as number,
    };

    const { container } = renderWithProviders(<TableHarness data={[emptySample]} />);

    const emptyPlaceholders = container.querySelectorAll(".table-cell-empty");
    expect(emptyPlaceholders.length).toBeGreaterThanOrEqual(1);
    expect(emptyPlaceholders[0]).toHaveTextContent("—");
  });
});
