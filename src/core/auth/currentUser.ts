/**
 * Loads the backend-authenticated principal and enforces the JWT session
 * subject/tenant boundary before exposing identity data to Refine.
 */

import type { LogisticsApiClient } from "../../types/apiClient.types";
import { AuthSessionExpiredError } from "./sessionManager";
import type { AuthIdentity } from "../../types/authSession.types";
import { normalizeJwtRoles } from "../permissions/jwtRoles";
import type { CurrentUser } from "../../types/auth.types";

interface CurrentUserResponse {
  subject: string;
  email: string | null;
  tenantId: string;
  roles: string[];
  employeeId: string | null;
}

export interface CreateCurrentUserLoaderOptions {
  apiClient: LogisticsApiClient;
  clearSession: () => Promise<void>;
}

const isCurrentUserResponse = (
  value: unknown,
): value is CurrentUserResponse => {
  // Generic của HTTP client chỉ hỗ trợ TypeScript lúc compile; dữ liệu mạng
  // vẫn là unknown và phải được kiểm tra trước khi đi vào auth state.
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<CurrentUserResponse>;
  return (
    typeof candidate.subject === "string" &&
    candidate.subject.trim().length > 0 &&
    (candidate.email === null || typeof candidate.email === "string") &&
    typeof candidate.tenantId === "string" &&
    candidate.tenantId.trim().length > 0 &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === "string") &&
    (candidate.employeeId === null ||
      typeof candidate.employeeId === "string")
  );
};

const sameRoles = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((role) => right.includes(role));

/**
 * Tạo loader đối chiếu principal do backend trả về với các claim đã xác thực.
 * Bất kỳ sai lệch subject, tenant hoặc role nào đều hủy phiên để không tiếp tục
 * chạy ứng dụng với hai nguồn phân quyền không đồng nhất.
 */
export const createCurrentUserLoader = ({
  apiClient,
  clearSession,
}: CreateCurrentUserLoaderOptions) =>
  async (identity: AuthIdentity): Promise<CurrentUser> => {
    const response = await apiClient.instance.get<unknown>("/api/me");
    if (!isCurrentUserResponse(response.data)) {
      await clearSession();
      throw new AuthSessionExpiredError();
    }

    const roles = normalizeJwtRoles(undefined, response.data.roles);
    // `/api/me` là nguồn dữ liệu nghiệp vụ, còn token là biên bảo mật. Hai phía
    // phải mô tả đúng cùng một principal trước khi identity được đưa cho Refine.
    const boundaryMatches =
      response.data.subject === identity.id &&
      response.data.tenantId === identity.tenantId &&
      sameRoles(roles, identity.roles);

    if (!boundaryMatches) {
      await clearSession();
      throw new AuthSessionExpiredError();
    }

    const tenant = {
      id: response.data.tenantId,
      tenantKey: response.data.tenantId,
      tenantName: response.data.tenantId,
    };

    return {
      id: identity.id,
      openId: identity.id,
      name: identity.name,
      tenantId: identity.tenantId,
      roles,
      tenantKey: tenant.tenantKey,
      tenantName: tenant.tenantName,
      tenants: [tenant],
      ...(identity.avatar ? { avatar: identity.avatar } : {}),
      ...(response.data.email
        // Ưu tiên email mới nhất từ backend, fallback sang claim nếu API không
        // cung cấp để UI vẫn hiển thị được identity tối thiểu.
        ? { email: response.data.email }
        : identity.email
          ? { email: identity.email }
          : {}),
      ...(response.data.employeeId
        ? { employeeId: response.data.employeeId }
        : {}),
    };
  };
