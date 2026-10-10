/**
 * Tests cho ResourceDetailView — hiển thị chi tiết bản ghi theo bố cục ngang (hình chữ nhật).
 */

import { AntdLocaleProvider } from "@components/AntdLocaleProvider";
import { ResourceDetailView } from "@components/resources/ResourceDetailView";
import { resourceFormDefinitions } from "@components/resources/resourceForms";
import { initializeAppI18n } from "@locales";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it } from "vitest";

let i18n: Awaited<ReturnType<typeof initializeAppI18n>>;

beforeAll(async () => {
  i18n = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const renderDetail = (
  resource: string,
  record: Record<string, unknown>,
  useDefinition = true,
) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AntdLocaleProvider>
        <ResourceDetailView
          definition={
            useDefinition && resource in resourceFormDefinitions
              ? resourceFormDefinitions[resource as keyof typeof resourceFormDefinitions]
              : undefined
          }
          record={record}
          resource={resource}
        />
      </AntdLocaleProvider>
    </I18nextProvider>,
  );

describe("ResourceDetailView — bố cục hiển thị và ánh xạ data trả về", () => {
  it("hiển thị số hiệu (#number) và id nổi bật", () => {
    renderDetail("loads", {
      id: "uuid-123",
      name: "Chuyến hàng Bắc Nam",
      number: 1001,
      status: "dispatched",
    });

    expect(screen.getByText("#1001")).toBeInTheDocument();
    expect(screen.getByText("uuid-123")).toBeInTheDocument();
    expect(screen.getByText("Chuyến hàng Bắc Nam")).toBeInTheDocument();
  });

  it("hiển thị trạng thái với StatusTag và tone màu", () => {
    renderDetail("loads", {
      id: "uuid-123",
      status: "in_transit",
    });

    expect(screen.getByRole("status")).toHaveTextContent("Đang vận chuyển");
  });

  it("hiển thị tiền tệ kèm định dạng currency", () => {
    renderDetail("invoices", {
      id: "inv-1",
      number: 501,
      status: "issued",
      totalAmount: 1500000,
      totalCurrency: "VND",
    });

    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument();
  });

  it("hiển thị boolean dưới dạng Tag có màu sắc", () => {
    renderDetail("loads", {
      id: "uuid-123",
      isHazmat: true,
      isInProximity: false,
    });

    expect(screen.getByText("Có")).toBeInTheDocument();
    expect(screen.getByText("Không")).toBeInTheDocument();
  });

  it("gộp các trường địa chỉ phẳng thành chuỗi địa chỉ đầy đủ", () => {
    renderDetail("loads", {
      destinationAddressCity: "Hà Nội",
      destinationAddressCountry: "VN",
      destinationAddressLine1: "456 Giải Phóng",
      id: "uuid-123",
      originAddressCity: "TP Hồ Chí Minh",
      originAddressCountry: "VN",
      originAddressLine1: "123 Nguyễn Huệ",
    });

    expect(screen.getByText(/123 Nguyễn Huệ, TP Hồ Chí Minh, VN/)).toBeInTheDocument();
    expect(screen.getByText(/456 Giải Phóng, Hà Nội, VN/)).toBeInTheDocument();
  });

  it("hiển thị địa chỉ object lồng nhau (như terminal)", () => {
    renderDetail("terminals", {
      address: {
        city: "Dallas",
        country: "US",
        line1: "100 Port Rd",
        state: "TX",
        zipCode: "75001",
      },
      code: "DAL01",
      id: "term-1",
      name: "Dallas Inland Port",
    });

    expect(screen.getByText(/100 Port Rd, Dallas, TX, 75001, US/)).toBeInTheDocument();
  });

  it("hiển thị tên thực tế của các quan hệ (customerName, truckNumber, dispatcherName)", () => {
    renderDetail("loads", {
      assignedDispatcherId: "emp-2",
      assignedDispatcherName: "Nguyễn Văn B",
      assignedTruckId: "trk-1",
      assignedTruckNumber: "29C-12345",
      customerId: "cust-1",
      customerName: "Công ty ABC",
      id: "uuid-123",
    });

    expect(screen.getByText("Công ty ABC")).toBeInTheDocument();
    expect(screen.getByText("29C-12345")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn B")).toBeInTheDocument();
  });

  it("hoạt động tốt với các resource không có definition (như containers, dvir)", () => {
    renderDetail(
      "containers",
      {
        containerNumber: "MSKU1234567",
        id: "cnt-1",
        size: "40ft",
        status: "available",
      },
      false,
    );

    expect(screen.getByText("MSKU1234567")).toBeInTheDocument();
    expect(screen.getByText("40ft")).toBeInTheDocument();
  });
});
