/**
 * Compose resource descriptors exported by implemented feature modules.
 *
 * Phase 0 intentionally has no business resource. Each later phase adds one
 * descriptor only after its API contract and tests are complete.
 */

import type { IResourceItem } from "@refinedev/core";

export const appResources: IResourceItem[] = [];
