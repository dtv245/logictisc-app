/**
 * Chuẩn hóa cách tạo Refine resource config và CRUD routes.
 */

import { createElement, type ComponentType } from "react";
import type { IResourceItem } from "@refinedev/core";

interface CreateResourceConfigParams {
  icon: ComponentType;
  label: string;
  name: string;
  routes: {
    create: string;
    edit: string;
    list: string;
    show: string;
  };
}

export const createResourceConfig = ({
  icon,
  label,
  name,
  routes,
}: CreateResourceConfigParams): IResourceItem => ({
  name,
  ...routes,
  meta: {
    canDelete: true,
    icon: createElement(icon),
    label,
  },
});
