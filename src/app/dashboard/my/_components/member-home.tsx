/**
 * UI-31 (+ UI-32) — member home composition.
 *
 * Server component that reads the member's real home data directly from
 * `src/lib/services/member/home.ts` (no intermediate API route) and lays out
 * the member-facing surfaces: membership card, event registrations, job
 * applications, forum activity, and the latest announcement.
 *
 * Used by both the role-aware `/dashboard` (member branch) and the dedicated
 * `/dashboard/my` surface.
 */

import {
  getMembershipCard,
  listMyEventRegistrations,
  listMyJobApplications,
  listMyForumPosts,
  listMyForumComments,
  getLatestAnnouncement,
} from "@/lib/services/member/home";
import { MemberMembershipWidget } from "@/components/dashboard/widgets/member-membership-widget";
import { MemberRegistrationsWidget } from "@/components/dashboard/widgets/member-registrations-widget";
import { MemberApplicationsWidget } from "@/components/dashboard/widgets/member-applications-widget";
import { MemberForumActivityWidget } from "@/components/dashboard/widgets/member-forum-activity-widget";
import { MemberAnnouncementWidget } from "@/components/dashboard/widgets/member-announcement-widget";

interface MemberHomeProps {
  userId: string;
}

export async function MemberHome({ userId }: MemberHomeProps) {
  const [card, registrations, applications, posts, comments, announcement] = await Promise.all([
    getMembershipCard(userId),
    listMyEventRegistrations(userId),
    listMyJobApplications(userId),
    listMyForumPosts(userId),
    listMyForumComments(userId),
    getLatestAnnouncement(userId),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <MemberMembershipWidget card={card} />
        <MemberAnnouncementWidget announcement={announcement} />
      </div>
      <div className="space-y-6 lg:col-span-2">
        <MemberRegistrationsWidget registrations={registrations} />
        <MemberApplicationsWidget applications={applications} />
        <MemberForumActivityWidget posts={posts} comments={comments} />
      </div>
    </div>
  );
}
