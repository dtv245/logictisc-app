/**
 * Bảng tra `statusTone`.
 *
 * Hai nhóm khẳng định ở đây không phải kiểm tra "hàm chạy được" mà kiểm tra hai
 * hợp đồng dễ vỡ khi có người thêm giá trị mới:
 *
 * 1. Hàm **toàn phần** — mọi đầu vào đều ra một tone. Trạng thái trong hệ thống
 *    này phần lớn là cột `text` tự do phía backend, nên gặp giá trị lạ là bình
 *    thường; ném lỗi ở đó sẽ làm trắng cả bảng.
 * 2. Mọi khoá trong bảng tra đều **có bản dịch** `forms.options.*`. Tô màu cho một
 *    giá trị không dịch được thì ô đó vẫn hiện enum thô — có màu mà vẫn sai.
 */

import { statusTone, statusTones } from "@components/statusTone";
import { initializeAppI18n } from "@locales";
import { describe, expect, it } from "vitest";

/**
 * Từ vựng của bốn enum Java có thật trong backend. Đây là nguồn sự thật cho trạng
 * thái của load/trip/invoice — xem `docs/` và enum `LoadStatus`, `TripStatus`,
 * `InvoiceDispatchStatus`.
 */
const BACKEND_STATUS_VOCABULARIES = {
  InvoiceStatus: ["draft", "issued", "partially_paid", "paid", "cancelled"],
  LoadStatus: ["draft", "dispatched", "picked_up", "delivered", "cancelled"],
  TripStatus: ["draft", "dispatched", "completed", "cancelled"],
} as const;

describe("statusTone — ánh xạ giá trị sang tone", () => {
  it("trả về tone đã khai cho giá trị đã biết", () => {
    expect(statusTone("delivered")).toBe("success");
    expect(statusTone("dispatched")).toBe("processing");
    expect(statusTone("partially_paid")).toBe("warning");
    expect(statusTone("cancelled")).toBe("error");
    expect(statusTone("draft")).toBe("neutral");
  });

  it("chuẩn hoá hoa/thường và khoảng trắng", () => {
    // Cố ý so với tone **khác neutral**: nếu chỉ thử "Draft" thì test vẫn xanh kể cả
    // khi hàm không hề chuẩn hoá, vì giá trị lạ nào cũng rơi về neutral.
    expect(statusTone("Delivered")).toBe("success");
    expect(statusTone("DELIVERED")).toBe("success");
    expect(statusTone("  delivered  ")).toBe("success");
    expect(statusTone("Partially_Paid")).toBe("warning");
    expect(statusTone("CANCELLED")).toBe("error");
  });

  it("trả neutral cho giá trị chưa biết thay vì ném lỗi", () => {
    expect(statusTone("brand_new_status")).toBe("neutral");
    expect(statusTone("")).toBe("neutral");
    expect(statusTone("   ")).toBe("neutral");
  });

  it("trả neutral cho mọi giá trị không phải chuỗi", () => {
    // Backend trả `null` cho cột trạng thái chưa gán; ô đó vẫn phải render được.
    for (const value of [undefined, null, 42, 0, true, false, {}, [], () => {}]) {
      expect(statusTone(value)).toBe("neutral");
    }
  });

  it("phủ hết từ vựng của các enum trạng thái phía backend", () => {
    for (const [name, values] of Object.entries(BACKEND_STATUS_VOCABULARIES)) {
      for (const value of values) {
        expect(
          Object.hasOwn(statusTones, value),
          `${name}: "${value}" chưa có tone`,
        ).toBe(true);
      }
    }
  });

  it("mọi tone đều có bản dịch forms.options.*", async () => {
    const i18n = await initializeAppI18n({ locale: "en", fallbackLocale: "en" });
    const options =
      (i18n.getResourceBundle("en", "translation") as
        | { forms?: { options?: Record<string, string> } }
        | undefined)?.forms?.options ?? {};

    // Lọc ra danh sách thiếu rồi so với mảng rỗng để thông báo lỗi nêu đúng giá trị
    // nào thiếu, thay vì chỉ "true !== false".
    const missing = Object.keys(statusTones).filter(
      (value) => !Object.hasOwn(options, value),
    );

    expect(missing).toEqual([]);
  });
});

describe("statusTone — tính đơn điệu của bảng", () => {
  it("không có giá trị nào vừa success vừa error", () => {
    const tones = Object.entries(statusTones);
    const successes = new Set(
      tones.filter(([, tone]) => tone === "success").map(([value]) => value),
    );
    const errors = tones
      .filter(([, tone]) => tone === "error")
      .map(([value]) => value);

    expect(errors.filter((value) => successes.has(value))).toEqual([]);
  });
});
