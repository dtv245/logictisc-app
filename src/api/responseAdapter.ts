import type { BaseRecord } from "@refinedev/core";

import { ApiHttpError } from "./errors";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const unwrapApiResponse = (responseData: unknown): unknown => {
  if (isRecord(responseData) && "result" in responseData) {
    return responseData.result;
  }

  return responseData;
};

const readNumber = (
  source: Record<string, unknown>,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
};

export const adaptListResponse = <TData extends BaseRecord>(
  responseData: unknown,
): { data: TData[]; total: number } => {
  const result = unwrapApiResponse(responseData);

  if (Array.isArray(result)) {
    return { data: result as TData[], total: result.length };
  }

  if (!isRecord(result)) {
    throw new ApiHttpError(500, "Response danh sách từ API không hợp lệ.");
  }

  const items = result.items ?? result.content ?? result.data;
  if (!Array.isArray(items)) {
    throw new ApiHttpError(500, "Response API không chứa mảng items/content.");
  }

  const total =
    readNumber(result, ["totalElements", "total", "totalCount"]) ??
    items.length;

  return { data: items as TData[], total };
};

export const adaptRecordResponse = <TData>(responseData: unknown): TData => {
  const result = unwrapApiResponse(responseData);

  if (result === undefined || result === null) {
    throw new ApiHttpError(500, "Response API không chứa dữ liệu.");
  }

  return result as TData;
};
