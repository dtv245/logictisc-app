import { describe, expect, it } from "vitest";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  documentTypeLabelKey,
  normalizeDocumentType,
} from "@/features/documents/components/documentUtils";

describe("document category filter", () => {
  it("gửi giá trị BOL đúng với dữ liệu backend", () => {
    expect(DOCUMENT_CATEGORY_OPTIONS.find((option) => option.key === "bill_of_lading")?.value).toBe("BILL_OF_LADING");
  });
});

describe("document type normalization", () => {
  it("nhóm được BOL viết hoa và viết thường về cùng một giá trị", () => {
    expect(normalizeDocumentType("BILL_OF_LADING")).toBe("bill_of_lading");
    expect(normalizeDocumentType("bill_of_lading")).toBe("bill_of_lading");
    expect(normalizeDocumentType(" PROOF_OF_DELIVERY ")).toBe("proof_of_delivery");
  });

  it("trả về khóa nhãn theo chữ thường để hiển thị đúng loại đã lưu", () => {
    expect(documentTypeLabelKey("BILL_OF_LADING")).toBe("documents.upload.types.bill_of_lading");
    expect(documentTypeLabelKey("driver_license")).toBe("documents.upload.types.driver_license");
    expect(documentTypeLabelKey("an_unmapped_type")).toBe("documents.upload.types.an_unmapped_type");
    expect(documentTypeLabelKey(null)).toBe("");
  });
});
