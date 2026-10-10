/**
 * Lark OAuth gateway — điều phối hai pha redirect/callback với backend.
 *
 * Backend chịu trách nhiệm toàn bộ luồng OAuth phía Lark (App ID, App Secret,
 * xác minh token Lark, ánh xạ user/tenant/role) và trả về access token nội bộ
 * sau khi callback hoàn tất. Frontend chỉ cần:
 *   1. Redirect tới backend login URL (phase 1).
 *   2. Gửi URL callback lên backend để đổi lấy JWT (phase 2).
 */

import { normalizeLocalReturnTo } from "./oidcGateway";
import type { OidcUserSnapshot } from "../../types/authSession.types";

const LARK_STATE_KEY = "lark_auth_state";

/**
 * Cấu trúc state nhúng vào URL redirect để khôi phục đường dẫn sau callback.
 * Được serialize thành base64url và truyền qua query-param `state`.
 */
interface LarkAuthState {
  readonly returnTo: string;
}

const encodeLarkState = (state: LarkAuthState): string =>
  btoa(JSON.stringify(state));

const decodeLarkState = (encoded: string): LarkAuthState => {
  const decoded = JSON.parse(atob(encoded)) as unknown;
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as Record<string, unknown>)["returnTo"] !== "string"
  ) {
    return { returnTo: "/" };
  }
  return { returnTo: normalizeLocalReturnTo((decoded as { returnTo: unknown })["returnTo"]) };
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
    candidate.subject.trim().length > 0
  );
};

export interface LarkGatewayOptions {
  /**
   * URL backend khởi tạo Lark OAuth redirect (ví dụ:
   * `https://api.example.com/auth/lark/login`). Backend nhận thêm query param
   * `state` chứa encoded returnTo.
   */
  readonly loginUrl: string;
  /**
   * URL backend xử lý Lark OAuth callback (ví dụ:
   * `https://api.example.com/auth/lark/callback`). Frontend forward toàn bộ
   * query string của trang callback này.
   */
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
  readonly returnTo: string;
}

export interface LarkGateway {
  startLogin: (returnTo: string) => void;
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
    startLogin: (returnTo: string) => {
      const normalizedReturnTo = normalizeLocalReturnTo(returnTo);
      const state: LarkAuthState = { returnTo: normalizedReturnTo };
      const encodedState = encodeLarkState(state);

      // Lưu state vào sessionStorage để đối chiếu sau callback phòng CSRF.
      storage.setItem(LARK_STATE_KEY, encodedState);

      const loginUrl = new URL(options.loginUrl);
      loginUrl.searchParams.set("state", encodedState);
      doRedirect(loginUrl.toString());
    },

    completeLogin: async (): Promise<LarkLoginResult> => {
      const currentHref = getHref();
      const callbackUrlObj = new URL(options.callbackUrl);

      // Forward toàn bộ query params của trang callback (code, state, error…)
      // lên backend để backend tự xử lý xác minh và token exchange.
      const currentUrl = new URL(currentHref);
      for (const [key, value] of currentUrl.searchParams.entries()) {
        callbackUrlObj.searchParams.set(key, value);
      }

      // Xác minh state để ngăn CSRF: nếu state không khớp, từ chối callback.
      const incomingState = currentUrl.searchParams.get("state") ?? "";
      const storedState = storage.getItem(LARK_STATE_KEY) ?? "";
      storage.removeItem(LARK_STATE_KEY);

      if (!incomingState || !storedState || incomingState !== storedState) {
        throw new Error("LARK_CALLBACK_STATE_MISMATCH");
      }

      const response = await fetchImpl(callbackUrlObj.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
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

      const data: unknown = await response.json();

      if (!isLarkCallbackResponse(data)) {
        throw new Error("LARK_CALLBACK_INVALID_RESPONSE");
      }

      const returnTo = normalizeLocalReturnTo(
        data.returnTo ?? decodeLarkState(storedState).returnTo,
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

      return { user, returnTo };
    },
  };
};
