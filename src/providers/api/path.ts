/**
 * Validates API URLs before Axios combines them with the runtime base URL.
 *
 * Feature routes must remain relative to the configured API origin; rejecting
 * absolute URLs prevents custom requests from silently leaving that boundary.
 */

export const normalizeApiBaseUrl = (value: string): string => {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("INVALID_API_BASE_URL");
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    throw new Error("INVALID_API_BASE_URL");
  }

  return parsed.toString().replace(/\/+$/, "");
};

export const assertRelativeApiPath = (path: string): string => {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("?") ||
    path.includes("#")
  ) {
    throw new Error("INVALID_API_PATH");
  }

  const segments = path.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.toLowerCase() === "%2e" ||
        segment.toLowerCase() === "%2e%2e",
    )
  ) {
    throw new Error("INVALID_API_PATH");
  }

  return path;
};

export const joinApiItemPath = (
  collectionPath: string,
  id: string | number,
): string =>
  `${assertRelativeApiPath(collectionPath).replace(/\/+$/, "")}/${encodeURIComponent(
    String(id),
  )}`;
