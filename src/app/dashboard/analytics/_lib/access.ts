import { getRequiredRolesForPath, isRoleAllowedForPath } from "@/lib/dashboard-access";
import { getCurrentUser } from "@/lib/rbac";

export interface AnalyticsAccessDenied {
  state: "signed-out" | "forbidden";
  allowedRoles: readonly string[];
}

export interface AnalyticsAccess {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
}

/**
 * Gate shared by every analytics page (UI-23). navigation-data's per-path
 * role lists are the single source of truth — the same lists the sidebar
 * uses — so a page can never drift from what the nav claims about it. The
 * RBAC analytics-read permission is deliberately NOT consulted here: the
 * moderator role owns content analytics in navigation-data yet lacks it.
 */
export async function requireAnalyticsAccess(
  pagePath: string,
): Promise<AnalyticsAccess | AnalyticsAccessDenied> {
  const user = await getCurrentUser();
  if (user && isRoleAllowedForPath(pagePath, user.role)) {
    return { user };
  }
  return {
    state: user ? "forbidden" : "signed-out",
    allowedRoles: getRequiredRolesForPath(pagePath) ?? [],
  };
}
