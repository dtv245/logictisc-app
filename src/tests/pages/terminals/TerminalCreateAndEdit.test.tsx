import { render, screen } from "@testing-library/react";
import { Form } from "antd";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerminalCreate } from "@/pages/terminals/create";
import { TerminalEdit } from "@/pages/terminals/edit";
import type { Terminal } from "@/types/terminal.types";

const mockOnFinish = vi.fn();
let capturedUseFormOptions: Record<string, unknown> = {};
let capturedForm: ReturnType<typeof Form.useForm>[0] | null = null;

vi.mock("@refinedev/antd", () => ({
  Create: ({ children, title }: { children: ReactNode; title: string }) => (
    <div data-testid="refine-create">
      <h1>{title}</h1>
      {children}
    </div>
  ),
  Edit: ({ children, title }: { children: ReactNode; title: string }) => (
    <div data-testid="refine-edit">
      <h1>{title}</h1>
      {children}
    </div>
  ),
  useForm: (options: Record<string, unknown>) => {
    capturedUseFormOptions = options;
    const [form] = Form.useForm();
    capturedForm = form;
    return {
      form,
      formProps: {
        form,
        onFinish: mockOnFinish,
      },
      saveButtonProps: {
        children: "Lưu",
      },
      queryResult: {
        data: {
          data: {
            id: "term-1",
            name: "Cat Lai Port",
            code: "VNSGN",
            countryCode: "VN",
            type: "SEA_PORT",
            addressLine1: "Nguyen Thi Dinh",
            addressCity: "Ho Chi Minh City",
            addressState: "SG",
            addressZipCode: "700000",
            addressCountry: "VN",
          } as Terminal,
        },
        isLoading: false,
      },
    };
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("TerminalCreate & TerminalEdit — Màn hình Tạo mới & Chỉnh sửa Terminal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUseFormOptions = {};
    capturedForm = null;
  });

  describe("TerminalCreate", () => {
    it("khởi tạo useForm với action='create', resource='terminals' và redirect='list'", () => {
      render(<TerminalCreate />);

      expect(screen.getByTestId("refine-create")).toBeInTheDocument();
      expect(screen.getByText("Thêm mới bến bãi (Terminal)")).toBeInTheDocument();
      expect(capturedUseFormOptions.action).toBe("create");
      expect(capturedUseFormOptions.resource).toBe("terminals");
      expect(capturedUseFormOptions.redirect).toBe("list");
    });

    it("xử lý lỗi 409 CONFLICT bằng cách gắn thông báo lỗi trùng mã vào ô code", () => {
      render(<TerminalCreate />);

      const onMutationError = capturedUseFormOptions.onMutationError as (error: {
        statusCode?: number;
        code?: string;
        errors?: Record<string, string>;
      }) => void;

      expect(typeof onMutationError).toBe("function");

      const setFieldsSpy = vi.spyOn(capturedForm!, "setFields");

      onMutationError({
        statusCode: 409,
        code: "CONFLICT",
      });

      expect(setFieldsSpy).toHaveBeenCalledWith([
        {
          name: "code",
          errors: ["Mã UN/LOCODE này đã tồn tại trên hệ thống"],
        },
      ]);
    });
  });

  describe("TerminalEdit", () => {
    it("khởi tạo useForm với action='edit', resource='terminals' và redirect='show'", () => {
      render(<TerminalEdit />);

      expect(screen.getByTestId("refine-edit")).toBeInTheDocument();
      expect(screen.getByText("Chỉnh sửa bến bãi (Terminal)")).toBeInTheDocument();
      expect(capturedUseFormOptions.action).toBe("edit");
      expect(capturedUseFormOptions.resource).toBe("terminals");
      expect(capturedUseFormOptions.redirect).toBe("show");
    });
  });
});
