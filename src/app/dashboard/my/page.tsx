/**
 * UI-31 — member home surface (`/dashboard/my`).
 *
 * Server component per ADR-0006: session-gated, reads the member's own home
 * data directly from the member service (no client fetch, no intermediate
 * route). Anyone with a session — members and admins alike — sees their own
 * member home here; the admin overview stays at `/dashboard`.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { MemberHome } from "./_components/member-home";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <PageHeader
        title="My home"
        description="Your membership, event registrations, job applications, forum activity, and the latest announcements."
      />
      <MemberHome userId={user.id} />
    </div>
  );
}
