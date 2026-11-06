/**
 * Lưu danh sách lựa chọn gần đây (bến bãi, khách hàng…) trong bộ nhớ trình duyệt
 * để đưa lên đầu dropdown. Storage được truyền vào để test không cần DOM và để
 * mọi lỗi quota/bảo mật không làm hỏng form.
 */

export interface SelectionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const MAX_RECENT = 5;

export const readRecentSelections = (
  storage: SelectionStorage,
  key: string,
  limit = MAX_RECENT,
): string[] => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const value = item.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
      if (result.length >= limit) break;
    }
    return result;
  } catch {
    return [];
  }
};

/** Ghi nhận một lựa chọn mới và trả về danh sách sau khi sắp xếp. */
export const rememberRecentSelection = (
  storage: SelectionStorage,
  key: string,
  value: string | null | undefined,
  limit = MAX_RECENT,
): string[] => {
  const current = readRecentSelections(storage, key, limit);
  const normalized = (value ?? "").trim();
  if (!normalized) return current;
  const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, limit);
  try {
    storage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage đầy hoặc bị chặn: giữ danh sách trong phiên hiện tại.
  }
  return next;
};

/** Sắp xếp ổn định: giá trị nằm trong `preferred` lên trước theo đúng thứ tự. */
export const orderByPreference = <T>(
  items: readonly T[],
  preferred: readonly string[],
  getValue: (item: T) => string,
): T[] => {
  if (preferred.length === 0) return [...items];
  const rank = new Map(preferred.map((value, index) => [value, index]));
  return [...items].sort((left, right) => {
    const leftRank = rank.get(getValue(left)) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(getValue(right)) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
};
