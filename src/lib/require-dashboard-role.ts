import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/rbac";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";

/**
 * For pages that need the same role gate as proxy.ts applies to
 * /dashboard/**, but live outside that matcher (see TODO.md M1: three
 * event-management pages under the (public) route group that are
 * reachable by anyone since proxy.ts's matcher never covers /events/**).
 *
 * `rolesPath` is the /dashboard/** path whose navigation-data.ts roles
 * this page should be held to — lets pages outside /dashboard reuse the
 * same source of truth instead of a third copy of a roles list.
 */
export async function requireDashboardRole(rolesPath: string): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(rolesPath)}`);
  }

  if (!isRoleAllowedForPath(rolesPath, user.role)) {
    redirect("/dashboard?error=forbidden");
  }
}
