import { useGetIdentity } from "@refinedev/core";

import type { CurrentUser } from "../../types/auth";

export const useCurrentUser = () =>
  useGetIdentity<CurrentUser>({
    queryOptions: {
      staleTime: 30_000,
    },
  });
