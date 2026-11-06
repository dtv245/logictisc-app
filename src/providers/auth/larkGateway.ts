/**
 * Lark OAuth gateway — backend ký state, frontend ràng buộc state với tab
 * đăng nhập bằng sessionStorage và đối chiếu state trước khi gọi callback.
 *
 * Backend giữ App ID/Secret, xác minh Lark identity và phát hành JWT nội bộ.
 * Frontend lấy authorization URL, ràng buộc state trong sessionStorage, rồi
 * gửi callback bằng POST JSON sau khi xác minh state trong tab hiện tại.
 */

import { normalizeLocalReturnTo } from "./oidcGateway";
import type { LarkAuthLoginResponse } from "../../types/auth.types";
import type { OidcUserSnapshot } from "../../types/authSession.types";

const LARK_STATE_KEY = "lark_auth_state";

const getAuthorizationData = (value: unknown): { authorizationUrl: string } | null => {
  if (typeof value !== "object" || value === null) return null;
  const envelope = value as { data?: unknown };
  const candidate = (envelope.data ?? value) as { authorizationUrl?: unknown };
  return typeof candidate.authorizationUrl === "string"
    ? { authorizationUrl: candidate.authorizationUrl }
    : null;
};

const getLoginResponseData = (value: unknown): unknown => {
  if (typeof value !== "object" || value === null || !("data" in value)) return value;
  return (value as { data: unknown }).data;
};

/**
 * Shape của response từ backend `/auth/lark/callback`.
 *
 * Backend trả về một JWT nội bộ có claim tenant và role đã được ánh xạ,
 * cùng profile tối thiểu để frontend dựng identity mà không cần thêm
 * một lần gọi `/api/me` ngay trong callback.
 */
export interface LarkCallbackResponse {
  readonly accessToken: string;
  readonly tokenType: "Bearer";
  readonly expiresIn: number;
  readonly subject: string;
  readonly tenantId: string;
  readonly roles: readonly string[];
  readonly name?: string;
  readonly email?: string;
  readonly picture?: string;
  /**
   * Đường dẫn nội bộ cần khôi phục sau khi đăng nhập. Backend trả về giá trị
   * đã decode từ `state` param để đảm bảo tính nhất quán. Nếu thiếu, frontend
   * dùng `/` làm fallback.
   */
  readonly returnTo?: string;
}

export const isLarkCallbackResponse = (
  value: unknown,
): value is LarkCallbackResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<LarkCallbackResponse>;
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.trim().length > 0 &&
    candidate.tokenType === "Bearer" &&
    typeof candidate.expiresIn === "number" &&
    candidate.expiresIn > 0 &&
    typeof candidate.subject === "string" &&
    candidate.subject.trim().length > 0 &&
    typeof candidate.tenantId === "string" &&
    candidate.tenantId.trim().length > 0 &&
    Array.isArray(candidate.roles) &&
    candidate.roles.every((role) => typeof role === "string")
  );
};

export interface LarkGatewayOptions {
  /**
   * URL login backend hiện có. Gateway đổi suffix `/login` thành `/authorize`
   * để lấy authorization URL có state do backend ký.
   */
  readonly loginUrl: string;
  /** URL POST backend xử lý callback theo DTO LarkCallbackRequest. */
  readonly callbackUrl: string;
  /**
   * Adapter để thực hiện HTTP call tới backend. Mặc định dùng `fetch`
   * native để tránh phụ thuộc vào Axios trong gateway thuần auth.
   */
  readonly fetchImpl?: typeof fetch;
  /**
   * Adapter để thao tác sessionStorage (inject trong test).
   */
  readonly storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  /**
   * Adapter để đọc URL hiện tại trong browser (inject trong test).
   */
  readonly locationHref?: () => string;
  /**
   * Adapter để thực hiện redirect (inject trong test).
   */
  readonly redirect?: (url: string) => void;
}

export interface LarkLoginResult {
  readonly user: OidcUserSnapshot;
  readonly auth: LarkAuthLoginResponse;
  readonly returnTo: string;
}

export interface LarkGateway {
  startLogin: (returnTo: string) => Promise<void>;
  completeLogin: () => Promise<LarkLoginResult>;
}

/**
 * Tạo gateway đóng gói hai pha Lark OAuth mà không để App Secret xuất hiện
 * ở frontend — mọi thao tác nhạy cảm do backend thực hiện.
 */
export const createLarkGateway = (options: LarkGatewayOptions): LarkGateway => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const storage = options.storage ?? window.sessionStorage;
  const getHref = options.locationHref ?? (() => window.location.href);
  const doRedirect =
    options.redirect ?? ((url: string) => { window.location.href = url; });

  return {
    startLogin: async (returnTo: string) => {
      const normalizedReturnTo = normalizeLocalReturnTo(returnTo);
      storage.removeItem(LARK_STATE_KEY);
      const authorizeUrl = new URL(options.loginUrl);
      authorizeUrl.pathname = authorizeUrl.pathname.replace(/\/login\/?$/, "/authorize");
      authorizeUrl.search = "";
      authorizeUrl.searchParams.set("returnTo", normalizedReturnTo);

      const response = await fetchImpl(authorizeUrl.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`LARK_AUTHORIZE_HTTP_${response.status}`);
      const authorizeData = getAuthorizationData(await response.json());
      if (!authorizeData) throw new Error("LARK_AUTHORIZE_INVALID_RESPONSE");

      const larkAuthorizationUrl = new URL(authorizeData.authorizationUrl);
      const backendState = larkAuthorizationUrl.searchParams.get("state");
      if (!backendState) throw new Error("LARK_AUTHORIZE_STATE_MISSING");
      storage.setItem(LARK_STATE_KEY, backendState);
      doRedirect(larkAuthorizationUrl.toString());
    },

    completeLogin: async (): Promise<LarkLoginResult> => {
      const currentHref = getHref();
      const currentUrl = new URL(currentHref);

      // Xác minh state để ngăn CSRF: nếu state không khớp, từ chối callback.
      const incomingState = currentUrl.searchParams.get("state") ?? "";
      const storedState = storage.getItem(LARK_STATE_KEY) ?? "";
      if (!incomingState || !storedState || incomingState !== storedState) {
        storage.removeItem(LARK_STATE_KEY);
        throw new Error("LARK_CALLBACK_STATE_MISMATCH");
      }
      // Consume the browser binding before the network call. If the request
      // outcome is unknown, the user starts a fresh OAuth transaction.
      storage.removeItem(LARK_STATE_KEY);

      const response = await fetchImpl(options.callbackUrl, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          code: currentUrl.searchParams.get("code"),
          state: incomingState,
          error: currentUrl.searchParams.get("error"),
          errorDescription:
            currentUrl.searchParams.get("error_description") ??
            currentUrl.searchParams.get("errorDescription"),
        }),
      });

      if (!response.ok) {
        let errorMessage = `LARK_CALLBACK_HTTP_${response.status}`;
        try {
          const body = (await response.json()) as unknown;
          if (
            typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof (body as Record<string, unknown>)["message"] === "string"
          ) {
            errorMessage = (body as { message: string }).message;
          }
        } catch {
          // Không parse được JSON — giữ mã lỗi mặc định.
        }
        throw new Error(errorMessage);
      }

      const data: unknown = getLoginResponseData(await response.json());

      if (!isLarkCallbackResponse(data)) {
        throw new Error("LARK_CALLBACK_INVALID_RESPONSE");
      }

      const returnTo = normalizeLocalReturnTo(
        data.returnTo ?? "/",
      );

      const expiresAt =
        Math.floor(Date.now() / 1_000) + data.expiresIn;

      const user: OidcUserSnapshot = {
        accessToken: data.accessToken,
        expiresAt,
        profile: {
          subject: data.subject,
          ...(data.name ? { name: data.name } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.picture ? { picture: data.picture } : {}),
        },
      };

      const auth: LarkAuthLoginResponse = {
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        expiresIn: data.expiresIn,
        subject: data.subject,
        email: data.email ?? "",
        tenantId: data.tenantId,
        roles: [...data.roles],
      };

      return { user, auth, returnTo };
    },
  };
};
