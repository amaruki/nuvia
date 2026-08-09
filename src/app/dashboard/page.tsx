/**
 * Role-aware dashboard entry point (UI-31).
 *
 * Server component that routes the visitor to the right home surface:
 * - unauthenticated  → the original signed-in prompt (unchanged);
 * - admin/superadmin → the existing admin dashboard, extracted verbatim into
 *                      `AdminDashboardView` so its widgets are untouched;
 * - everyone else    → the member home (membership card, registrations,
 *                      applications, forum activity, announcements).
 *
 * The role check mirrors the widget gate inside `AdminDashboardView`
 * (`admin` / `superadmin`), so both surfaces agree on who is an admin.
 */

import { getCurrentUser } from "@/lib/rbac";
import { AdminDashboardView } from "./_components/admin-dashboard-view";
import { SignedOutView } from "./_components/signed-out-view";
import { MemberHome } from "./my/_components/member-home";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SignedOutView />;
  }

  if (user.role === "admin" || user.role === "superadmin") {
    return <AdminDashboardView />;
  }

  return <MemberHome userId={user.id} />;
}
