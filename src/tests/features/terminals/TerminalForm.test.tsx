import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Form, type FormInstance } from "antd";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import type { i18n as I18nInstance } from "i18next";
import { initializeAppI18n } from "@locales";
import { TerminalForm } from "@/features/terminals/components/TerminalForm";
import type { CreateTerminalRequest, Terminal } from "@/types/terminal.types";

let i18nInstance: I18nInstance;

beforeAll(async () => {
  i18nInstance = await initializeAppI18n({ locale: "vi", fallbackLocale: "en" });
});

const FormHarness = ({
  initialValues,
  isEdit = false,
  onFinish,
  onCancel,
  form: externalForm,
}: {
  initialValues?: Partial<Terminal>;
  isEdit?: boolean;
  onFinish?: (values: CreateTerminalRequest) => void;
  onCancel?: () => void;
  form?: FormInstance;
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm ?? internalForm;
  return (
    <I18nextProvider i18n={i18nInstance}>
      <TerminalForm
        form={form}
        initialValues={initialValues}
        isEdit={isEdit}
        onFinish={onFinish}
        onCancel={onCancel}
      />
    </I18nextProvider>
  );
};

describe("TerminalForm Component", () => {
  it("hiển thị đầy đủ 2 phân nhóm: Thông tin chung và Địa chỉ", () => {
    render(<FormHarness />);

    expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
    expect(screen.getByText("Địa chỉ bến bãi")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên cảng / bến bãi")).toBeInTheDocument();
    expect(screen.getByLabelText("Mã UN/LOCODE (Code)")).toBeInTheDocument();
    expect(screen.getByLabelText("Mã quốc gia (Country Code)")).toBeInTheDocument();
    expect(screen.getByLabelText("Phân loại bến bãi")).toBeInTheDocument();
    expect(screen.getByLabelText("Địa chỉ dòng 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Thành phố / Quận huyện")).toBeInTheDocument();
    expect(screen.getByLabelText("Tỉnh / Bang")).toBeInTheDocument();
    expect(screen.getByLabelText("Mã bưu chính (Zip/Postal Code)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quốc gia")).toBeInTheDocument();
  });

  it("báo lỗi validation khi để trống các trường bắt buộc", async () => {
    render(<FormHarness />);

    const submitBtn = screen.getByRole("button", { name: "Tạo mới bến bãi" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Vui lòng nhập tên cảng / bến bãi")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập mã UN/LOCODE")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập mã quốc gia")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng chọn loại bến bãi")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập địa chỉ dòng 1")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập thành phố / quận huyện")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập tỉnh / bang")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập mã bưu chính")).toBeInTheDocument();
      expect(screen.getByText("Vui lòng nhập quốc gia")).toBeInTheDocument();
    });
  });

  it("báo lỗi khi mã UN/LOCODE không đúng 5 chữ cái và mã quốc gia không đúng 2 chữ cái", async () => {
    render(<FormHarness />);

    const codeInput = screen.getByLabelText("Mã UN/LOCODE (Code)");
    fireEvent.change(codeInput, { target: { value: "VN1" } });

    const countryCodeInput = screen.getByLabelText("Mã quốc gia (Country Code)");
    fireEvent.change(countryCodeInput, { target: { value: "VNM" } });

    const submitBtn = screen.getByRole("button", { name: "Tạo mới bến bãi" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Mã UN/LOCODE phải đúng 5 chữ cái (Ví dụ: VNSGN, USNYC)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Mã quốc gia phải đúng 2 chữ cái ISO (Ví dụ: VN, US)"),
      ).toBeInTheDocument();
    });
  });

  it("gợi ý addressCountry khi nhập countryCode", async () => {
    render(<FormHarness />);

    const countryCodeInput = screen.getByLabelText("Mã quốc gia (Country Code)");
    fireEvent.change(countryCodeInput, { target: { value: "vn" } });

    const addressCountryInput = screen.getByLabelText("Quốc gia");
    expect(addressCountryInput).toHaveValue("VN");
  });

  it("chuẩn hóa dữ liệu in hoa và gửi đúng payload khi submit hợp lệ", async () => {
    const onFinish = vi.fn();
    let formRef: FormInstance | undefined;

    const TestHarness = () => {
      const [form] = Form.useForm();
      useEffect(() => {
        formRef = form;
      }, [form]);
      return <FormHarness form={form} onFinish={onFinish} />;
    };

    render(<TestHarness />);

    fireEvent.change(screen.getByLabelText("Tên cảng / bến bãi"), {
      target: { value: "Cat Lai Port" },
    });
    fireEvent.change(screen.getByLabelText("Mã UN/LOCODE (Code)"), {
      target: { value: "vnsgn" },
    });
    fireEvent.change(screen.getByLabelText("Mã quốc gia (Country Code)"), {
      target: { value: "vn" },
    });

    formRef?.setFieldValue("type", "SEA_PORT");

    fireEvent.change(screen.getByLabelText("Địa chỉ dòng 1"), {
      target: { value: "Nguyen Thi Dinh" },
    });
    fireEvent.change(screen.getByLabelText("Thành phố / Quận huyện"), {
      target: { value: "Ho Chi Minh City" },
    });
    fireEvent.change(screen.getByLabelText("Tỉnh / Bang"), {
      target: { value: "SG" },
    });
    fireEvent.change(screen.getByLabelText("Mã bưu chính (Zip/Postal Code)"), {
      target: { value: "700000" },
    });
    fireEvent.change(screen.getByLabelText("Quốc gia"), {
      target: { value: "vn" },
    });

    const submitBtn = screen.getByRole("button", { name: "Tạo mới bến bãi" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(onFinish).toHaveBeenCalledWith({
        name: "Cat Lai Port",
        code: "VNSGN",
        countryCode: "VN",
        type: "SEA_PORT",
        notes: null,
        addressLine1: "Nguyen Thi Dinh",
        addressLine2: null,
        addressCity: "Ho Chi Minh City",
        addressState: "SG",
        addressZipCode: "700000",
        addressCountry: "VN",
      });
    });
  });

  it("nạp đúng initialValues ở chế độ chỉnh sửa (Edit)", () => {
    const initial: Terminal = {
      id: "term-1",
      name: "Cat Lai Port",
      code: "VNSGN",
      countryCode: "VN",
      type: "SEA_PORT",
      notes: "Khu vực cổng A",
      addressLine1: "Nguyen Thi Dinh",
      addressCity: "TP HCM",
      addressState: "SG",
      addressZipCode: "700000",
      addressCountry: "VN",
      createdAt: "2026-10-14T08:00:00Z",
    };

    render(<FormHarness initialValues={initial} isEdit={true} />);

    expect(screen.getByLabelText("Tên cảng / bến bãi")).toHaveValue("Cat Lai Port");
    expect(screen.getByLabelText("Mã UN/LOCODE (Code)")).toHaveValue("VNSGN");
    expect(screen.getByLabelText("Mã quốc gia (Country Code)")).toHaveValue("VN");
    expect(screen.getByLabelText("Ghi chú")).toHaveValue("Khu vực cổng A");
    expect(screen.getByRole("button", { name: "Cập nhật bến bãi" })).toBeInTheDocument();
  });
});
