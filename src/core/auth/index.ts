/**
 * Public API của lớp OIDC authentication.
 */

export {
  browserLocationAdapter,
  createAuthProvider,
  type AuthProviderOptions,
} from "./authProvider";
export {
  AccessTokenValidationError,
  createRemoteJwkAccessTokenVerifier,
  validateVerifiedAccessTokenClaims,
  type AccessTokenValidationCode,
  type VerifiedClaimsValidationOptions,
} from "./jwtVerifier";
export {
  createBrowserOidcGateway,
  createOidcGateway,
  normalizeLocalReturnTo,
} from "./oidcGateway";
export {
  AuthSessionExpiredError,
  AuthSessionManager,
  type AuthSessionListener,
  type AuthSessionManagerOptions,
} from "./sessionManager";
export {
  LOGISTICS_API_AUDIENCE,
  type AccessTokenVerifier,
  type AuthIdentity,
  type AuthRuntimeSettings,
  type AuthSessionSnapshot,
  type BrowserLocationAdapter,
  type OidcGateway,
  type OidcLoginResult,
  type OidcProfileSnapshot,
  type OidcUserSnapshot,
  type VerifiedAccessToken,
} from "./types";
