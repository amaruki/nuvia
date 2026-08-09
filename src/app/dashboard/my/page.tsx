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
import { MemberHome } from "./_components/member-home";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My home</h1>
        <p className="text-sm text-muted-foreground">
          Your membership, event registrations, job applications, forum activity, and the latest
          announcements.
        </p>
      </header>
      <MemberHome userId={user.id} />
    </div>
  );
}
