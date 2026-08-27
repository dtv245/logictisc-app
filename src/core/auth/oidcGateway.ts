/**
 * Adapter Authorization Code + PKCE dựa trên oidc-client-ts.
 *
 * OIDC transaction state (state/nonce/PKCE verifier) dùng sessionStorage,
 * còn User chứa access/refresh token chỉ nằm trong memory store.
 */

import {
  InMemoryWebStorage,
  UserManager,
  WebStorageStateStore,
  type User,
  type UserManagerSettings,
} from "oidc-client-ts";

import type {
  AuthRuntimeSettings,
  OidcGateway,
  OidcLoginResult,
  OidcProfileSnapshot,
  OidcUserSnapshot,
} from "./types";

const DEFAULT_RETURN_TO = "/";

interface LoginRequestState {
  readonly returnTo: string;
}

export const normalizeLocalReturnTo = (
  candidate: unknown,
  fallback = DEFAULT_RETURN_TO,
): string => {
  if (typeof candidate !== "string") {
    return fallback;
  }

  const trimmedCandidate = candidate.trim();

  if (
    !trimmedCandidate.startsWith("/") ||
    trimmedCandidate.startsWith("//")
  ) {
    return fallback;
  }

  try {
    let decodedCandidate = trimmedCandidate;

    // React Router/browser có thể chuẩn hóa encoded slash hoặc backslash ở
    // bước sau. Decode lặp hữu hạn để chặn cả payload encode hai lần.
    for (let decodePass = 0; decodePass < 3; decodePass += 1) {
      if (
        decodedCandidate.includes("\\") ||
        decodedCandidate.startsWith("//")
      ) {
        return fallback;
      }

      const nextCandidate = decodeURIComponent(decodedCandidate);
      if (nextCandidate === decodedCandidate) {
        break;
      }
      decodedCandidate = nextCandidate;
    }

    if (
      decodedCandidate.includes("\\") ||
      decodedCandidate.startsWith("//")
    ) {
      return fallback;
    }

    const internalOrigin = new URL("https://internal.invalid");
    const resolvedUrl = new URL(decodedCandidate, internalOrigin);

    return resolvedUrl.origin === internalOrigin.origin
      ? `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
      : fallback;
  } catch {
    return fallback;
  }
};

const getLoginReturnTo = (state: unknown): string => {
  if (
    typeof state !== "object" ||
    state === null ||
    !("returnTo" in state)
  ) {
    return DEFAULT_RETURN_TO;
  }

  return normalizeLocalReturnTo(state.returnTo);
};

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const toProfileSnapshot = (user: User): OidcProfileSnapshot => {
  const name = toOptionalString(user.profile.name);
  const preferredUsername = toOptionalString(
    user.profile.preferred_username,
  );
  const email = toOptionalString(user.profile.email);
  const picture = toOptionalString(user.profile.picture);

  return {
    subject: user.profile.sub,
    ...(name ? { name } : {}),
    ...(preferredUsername ? { preferredUsername } : {}),
    ...(email ? { email } : {}),
    ...(picture ? { picture } : {}),
  };
};

const toUserSnapshot = (user: User): OidcUserSnapshot => ({
  accessToken: user.access_token,
  ...(typeof user.expires_at === "number"
    ? { expiresAt: user.expires_at }
    : {}),
  profile: toProfileSnapshot(user),
});

const createUserManagerSettings = (
  settings: AuthRuntimeSettings,
  transientStateStorage: Storage,
): UserManagerSettings => {
  const managerSettings: UserManagerSettings = {
    authority: settings.authority,
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: "code",
    scope: settings.scopes.join(" "),
    // oidc-client-ts bật PKCE mặc định cho code flow; giữ false tường minh
    // để config sau này không vô tình hạ cấp flow.
    disablePKCE: false,
    automaticSilentRenew: false,
    monitorSession: false,
    loadUserInfo: false,
    stateStore: new WebStorageStateStore({
      store: transientStateStorage,
    }),
    userStore: new WebStorageStateStore({
      store: new InMemoryWebStorage(),
    }),
  };

  if (settings.silentRedirectUri) {
    managerSettings.silent_redirect_uri = settings.silentRedirectUri;
  }

  if (settings.postLogoutRedirectUri) {
    managerSettings.post_logout_redirect_uri =
      settings.postLogoutRedirectUri;
  }

  return managerSettings;
};

/**
 * Tạo gateway với storage tạm thời được inject để có thể dùng cùng
 * `window.sessionStorage` ở browser và storage cô lập trong unit test.
 */
export const createOidcGateway = (
  settings: AuthRuntimeSettings,
  transientStateStorage: Storage,
): OidcGateway => {
  const userManager = new UserManager(
    createUserManagerSettings(settings, transientStateStorage),
  );

  return {
    startLogin: async (returnTo) => {
      const state: LoginRequestState = {
        returnTo: normalizeLocalReturnTo(returnTo),
      };

      // UserManager tạo và kiểm tra OAuth state, nonce cùng PKCE verifier.
      await userManager.signinRedirect({ state });
    },

    completeLogin: async (callbackUrl) => {
      // Callback này xác thực state/nonce trước khi trả User.
      const user = await userManager.signinRedirectCallback(callbackUrl);
      if (!user) {
        throw new Error("OIDC_CALLBACK_MISSING_USER");
      }

      const result: OidcLoginResult = {
        user: toUserSnapshot(user),
        returnTo: getLoginReturnTo(user.state),
      };

      return result;
    },

    getUser: async () => {
      const user = await userManager.getUser();
      return user ? toUserSnapshot(user) : null;
    },

    renewUser: async () => {
      const user = await userManager.signinSilent();
      if (!user) {
        throw new Error("OIDC_RENEW_MISSING_USER");
      }

      return toUserSnapshot(user);
    },

    removeUser: async () => {
      await userManager.removeUser();
    },

    logout: async () => {
      let endSessionEndpoint: string | undefined;

      try {
        endSessionEndpoint =
          await userManager.metadataService.getEndSessionEndpoint();
      } catch {
        // Discovery lỗi không được ngăn logout cục bộ.
      }

      if (!endSessionEndpoint) {
        await userManager.removeUser();
        return false;
      }

      try {
        // Đây là end-session endpoint của Identity Server, không phải
        // `/logout` mặc định của Spring API.
        await userManager.signoutRedirect();
        return true;
      } catch {
        await userManager.removeUser();
        return false;
      }
    },
  };
};

export const createBrowserOidcGateway = (
  settings: AuthRuntimeSettings,
): OidcGateway => createOidcGateway(settings, window.sessionStorage);
