/**
 * Chứa kiểu dữ liệu khóa API dùng để truy cập tích hợp CETA.
 */

/** Khóa API chỉ lưu hash và prefix an toàn để nhận diện. */
export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
}
