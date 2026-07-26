/**
 * Chuẩn hóa endpoint cho auth, tenant và Refine resources.
 */

import type { MetaQuery } from "@refinedev/core";

import { env } from "../../config/env";

export const endpoints = {
  auth: {
    larkLogin: env.larkLoginUrl,
    login: env.authLoginPath,
    logout: env.authLogoutPath,
    me: env.authMePath,
  },
  tenant: {
    switch: env.tenantSwitchPath,
  },
} as const;

const normalizePath = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

export const getResourceEndpoint = (
  resource: string,
  meta?: MetaQuery,
): string => {
  const configuredEndpoint = meta?.endpoint;

  if (typeof configuredEndpoint === "string" && configuredEndpoint.length > 0) {
    return normalizePath(configuredEndpoint);
  }

  const encodedSegments = resource
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent);

  return `/${encodedSegments.join("/")}`;
};

export const getResourceItemEndpoint = (
  resource: string,
  id: string | number,
  meta?: MetaQuery,
): string => `${getResourceEndpoint(resource, meta)}/${encodeURIComponent(id)}`;
