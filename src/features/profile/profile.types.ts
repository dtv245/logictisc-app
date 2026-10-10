import type { CurrentUser } from "@/types/auth.types";
import type { Tenant } from "@/types/tenant.types";

export interface ProfileSummaryProps {
  user: CurrentUser;
  tenant?: Tenant;
}
