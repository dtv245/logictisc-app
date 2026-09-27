/**
 * Kiểm thử LarkGateway: redirect pha 1, CSRF state, callback pha 2 và
 * các trường hợp lỗi phổ biến.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createLarkGateway,
  isLarkCallbackResponse,
} from "@providers/auth/larkGateway";

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

const LARK_LOGIN_URL = "https://api.test/auth/lark/login";
const LARK_CALLBACK_URL = "https://api.test/auth/lark/callback";

interface FakeStorageData {
  [key: string]: string;
}

const createFakeStorage = (
  initial: FakeStorageData = {},
): Pick<Storage, "getItem" | "setItem" | "removeItem"> & {
  data: FakeStorageData;
} => {
  const data: FakeStorageData = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
  };
};

const createSuccessResponse = (
  body: unknown,
  status = 200,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const createErrorResponse = (
  body: unknown,
  status: number,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const VALID_LARK_RESPONSE = {
  accessToken: "lark.jwt.token",
  tokenType: "Bearer" as const,
  expiresIn: 3600,
  subject: "user-abc-123",
  name: "Nguyen Van A",
  email: "a@example.com",
  returnTo: "/loads",
};

// ---------------------------------------------------------------------------
// isLarkCallbackResponse
// ---------------------------------------------------------------------------

describe("isLarkCallbackResponse", () => {
  it("accepts a valid response", () => {
    expect(isLarkCallbackResponse(VALID_LARK_RESPONSE)).toBe(true);
  });

  it("rejects missing accessToken", () => {
    expect(
      isLarkCallbackResponse({ ...VALID_LARK_RESPONSE, accessToken: "" }),
    ).toBe(false);
  });

  it("rejects wrong tokenType", () => {
    expect(
      isLarkCallbackResponse({
        ...VALID_LARK_RESPONSE,
        tokenType: "Basic",
      }),
    ).toBe(false);
  });

  it("rejects missing subject", () => {
    expect(
      isLarkCallbackResponse({ ...VALID_LARK_RESPONSE, subject: "" }),
    ).toBe(false);
  });

  it("rejects null and non-objects", () => {
    expect(isLarkCallbackResponse(null)).toBe(false);
    expect(isLarkCallbackResponse("string")).toBe(false);
    expect(isLarkCallbackResponse(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// startLogin
// ---------------------------------------------------------------------------

describe("LarkGateway.startLogin", () => {
  it("redirects to the login URL with encoded state", () => {
    const storage = createFakeStorage();
    const redirect = vi.fn();
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      redirect,
    });

    gateway.startLogin("/trips/42?tab=stops");

    expect(redirect).toHaveBeenCalledOnce();
    const redirectedUrl = new URL(redirect.mock.calls[0][0] as string);
    expect(redirectedUrl.origin + redirectedUrl.pathname).toBe(LARK_LOGIN_URL);
    expect(redirectedUrl.searchParams.has("state")).toBe(true);
  });

  it("persists the state to session storage before redirecting", () => {
    const storage = createFakeStorage();
    const redirect = vi.fn();
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      redirect,
    });

    gateway.startLogin("/dashboard");

    expect(Object.keys(storage.data)).toHaveLength(1);
    const storedValue = Object.values(storage.data)[0];
    expect(typeof storedValue).toBe("string");
  });

  it("normalizes open-redirect returnTo before embedding it in state", () => {
    const storage = createFakeStorage();
    const redirect = vi.fn();
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      redirect,
    });

    // Absolute URLs must be rejected and replaced with the fallback path.
    gateway.startLogin("https://attacker.example/steal");

    const redirectedUrl = new URL(redirect.mock.calls[0][0] as string);
    const state = redirectedUrl.searchParams.get("state")!;
    const decoded = JSON.parse(atob(state)) as { returnTo: string };
    expect(decoded.returnTo).toBe("/");
  });
});

// ---------------------------------------------------------------------------
// completeLogin — success
// ---------------------------------------------------------------------------

describe("LarkGateway.completeLogin — success", () => {
  let storage: ReturnType<typeof createFakeStorage>;
  let fetchImpl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Simulate having gone through startLogin first so state exists.
    storage = createFakeStorage();
    const redirect = vi.fn();
    const tempGateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      redirect,
    });
    tempGateway.startLogin("/loads");

    fetchImpl = vi.fn().mockResolvedValue(createSuccessResponse(VALID_LARK_RESPONSE));
  });

  it("returns user snapshot and returnTo on success", async () => {
    const storedState = Object.values(storage.data)[0]!;
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl,
      locationHref: () =>
        `https://app.test/auth/callback?code=AUTH_CODE&state=${encodeURIComponent(storedState)}`,
    });

    const result = await gateway.completeLogin();

    expect(result.user.accessToken).toBe(VALID_LARK_RESPONSE.accessToken);
    expect(result.user.profile.subject).toBe(VALID_LARK_RESPONSE.subject);
    expect(result.returnTo).toBe(VALID_LARK_RESPONSE.returnTo);
  });

  it("forwards code and state query params to the backend callback URL", async () => {
    const storedState = Object.values(storage.data)[0]!;
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl,
      locationHref: () =>
        `https://app.test/auth/callback?code=MY_CODE&state=${encodeURIComponent(storedState)}`,
    });

    await gateway.completeLogin();

    const calledUrl = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("code")).toBe("MY_CODE");
    expect(calledUrl.searchParams.get("state")).toBe(storedState);
  });

  it("removes state from storage after callback", async () => {
    const storedState = Object.values(storage.data)[0]!;
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl,
      locationHref: () =>
        `https://app.test/auth/callback?code=CODE&state=${encodeURIComponent(storedState)}`,
    });

    await gateway.completeLogin();

    expect(Object.keys(storage.data)).toHaveLength(0);
  });

  it("uses state-decoded returnTo when backend omits it", async () => {
    const responseWithoutReturnTo = {
      ...VALID_LARK_RESPONSE,
      returnTo: undefined,
    };
    const storedState = Object.values(storage.data)[0]!;
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl: vi.fn().mockResolvedValue(
        createSuccessResponse(responseWithoutReturnTo),
      ),
      locationHref: () =>
        `https://app.test/auth/callback?code=CODE&state=${encodeURIComponent(storedState)}`,
    });

    const result = await gateway.completeLogin();

    // returnTo should come from the state that was set during startLogin("/loads")
    expect(result.returnTo).toBe("/loads");
  });
});

// ---------------------------------------------------------------------------
// completeLogin — CSRF / state errors
// ---------------------------------------------------------------------------

describe("LarkGateway.completeLogin — CSRF protection", () => {
  it("throws LARK_CALLBACK_STATE_MISMATCH when state param is missing", async () => {
    const storage = createFakeStorage({ lark_auth_state: "some-state" });
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl: vi.fn(),
      locationHref: () => "https://app.test/auth/callback?code=CODE",
    });

    await expect(gateway.completeLogin()).rejects.toThrow(
      "LARK_CALLBACK_STATE_MISMATCH",
    );
  });

  it("throws LARK_CALLBACK_STATE_MISMATCH when state does not match storage", async () => {
    const storage = createFakeStorage({ lark_auth_state: "stored-state" });
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl: vi.fn(),
      locationHref: () =>
        "https://app.test/auth/callback?code=CODE&state=different-state",
    });

    await expect(gateway.completeLogin()).rejects.toThrow(
      "LARK_CALLBACK_STATE_MISMATCH",
    );
  });

  it("throws LARK_CALLBACK_STATE_MISMATCH when no state exists in storage", async () => {
    const storage = createFakeStorage();
    const gateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl: vi.fn(),
      locationHref: () =>
        "https://app.test/auth/callback?code=CODE&state=some-state",
    });

    await expect(gateway.completeLogin()).rejects.toThrow(
      "LARK_CALLBACK_STATE_MISMATCH",
    );
  });
});

// ---------------------------------------------------------------------------
// completeLogin — HTTP / response errors
// ---------------------------------------------------------------------------

describe("LarkGateway.completeLogin — backend errors", () => {
  let storage: ReturnType<typeof createFakeStorage>;

  beforeEach(() => {
    storage = createFakeStorage();
    const redirect = vi.fn();
    const tempGateway = createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      redirect,
    });
    tempGateway.startLogin("/dashboard");
  });

  const makeGateway = (fetchImpl: ReturnType<typeof vi.fn>) => {
    const storedState = Object.values(storage.data)[0]!;
    return createLarkGateway({
      loginUrl: LARK_LOGIN_URL,
      callbackUrl: LARK_CALLBACK_URL,
      storage,
      fetchImpl,
      locationHref: () =>
        `https://app.test/auth/callback?code=CODE&state=${encodeURIComponent(storedState)}`,
    });
  };

  it("throws LARK_CALLBACK_HTTP_401 for unauthorized response", async () => {
    const gateway = makeGateway(
      vi.fn().mockResolvedValue(
        createErrorResponse({ message: "UNAUTHORIZED" }, 401),
      ),
    );

    await expect(gateway.completeLogin()).rejects.toThrow(
      "UNAUTHORIZED",
    );
  });

  it("throws LARK_CALLBACK_HTTP_<status> for non-JSON error responses", async () => {
    const gateway = makeGateway(
      vi.fn().mockResolvedValue(
        new Response("Internal Server Error", { status: 500 }),
      ),
    );

    await expect(gateway.completeLogin()).rejects.toThrow(
      "LARK_CALLBACK_HTTP_500",
    );
  });

  it("throws LARK_CALLBACK_INVALID_RESPONSE when backend returns malformed data", async () => {
    const gateway = makeGateway(
      vi.fn().mockResolvedValue(
        createSuccessResponse({ tokenType: "Bearer", expiresIn: 3600 }),
      ),
    );

    await expect(gateway.completeLogin()).rejects.toThrow(
      "LARK_CALLBACK_INVALID_RESPONSE",
    );
  });
});
