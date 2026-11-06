import { describe, expect, it } from "vitest";
import {
  orderByPreference,
  readRecentSelections,
  rememberRecentSelection,
  type SelectionStorage,
} from "./recentSelections";

const createStorage = (seed: Record<string, string> = {}): SelectionStorage => {
  const data = { ...seed };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
};

describe("recent selections", () => {
  it("đọc JSON hợp lệ, bỏ trùng và giới hạn số lượng", () => {
    const storage = createStorage({ key: JSON.stringify(["a", "b", "a", 3, "  "]) });
    expect(readRecentSelections(storage, "key", 2)).toEqual(["a", "b"]);
  });

  it("dữ liệu hỏng hoặc storage lỗi trả mảng rỗng", () => {
    expect(readRecentSelections(createStorage({ key: "{not json" }), "key")).toEqual([]);
    const broken: SelectionStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };
    expect(readRecentSelections(broken, "key")).toEqual([]);
    expect(rememberRecentSelection(broken, "key", "a")).toEqual(["a"]);
  });

  it("ghi lựa chọn mới lên đầu và loại trùng", () => {
    const storage = createStorage({ key: JSON.stringify(["a", "b"]) });
    expect(rememberRecentSelection(storage, "key", "b")).toEqual(["b", "a"]);
    expect(readRecentSelections(storage, "key")).toEqual(["b", "a"]);
  });

  it("sắp xếp ổn định theo thứ tự ưu tiên", () => {
    const items = ["a", "b", "c", "d"];
    expect(orderByPreference(items, ["c", "a"], (item) => item)).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
    expect(orderByPreference(items, [], (item) => item)).toEqual(items);
  });
});
