/**
 * Khai báo duy nhất các route Phase 0 và kiểm soát redirect nội bộ.
 */

export const routes = {
  root: "/",
  login: "/login",
  authCallback: "/auth/callback",
  forbidden: "/forbidden",
  diagnostics: "/diagnostics",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export function safeInternalPath(
  candidate: string | null | undefined,
  fallback: AppRoute = routes.diagnostics,
): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(candidate);
    if (decoded.includes("\\") || decoded.startsWith("//")) {
      return fallback;
    }

    const base = new URL("https://internal.invalid");
    const target = new URL(decoded, base);
    return target.origin === base.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
