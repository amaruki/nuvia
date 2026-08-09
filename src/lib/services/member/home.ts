/**
 * UI-31 (+ UI-32 first bullet) — member home reads.
 *
 * The member-scoped read service behind the role-aware member dashboard home
 * (`/dashboard` for non-admin roles) and the `/dashboard/my/*` surfaces.
 * Server components call these directly — no API route hop, no session-based
 * privilege guesswork: every function takes the authenticated user id and
 * reads exactly that user's rows.
 *
 * Honesty contract (planning doc UI-31): only real data is shown, empty
 * states are honest, and nothing is fabricated:
 * - `getMembershipCard` derives status through the single ADR-0014 rule
 *   (`deriveMemberStatus`) and returns null when the user has no
 *   subscription, which the UI renders as "Not a member yet" + join CTA;
 * - registrations, applications, posts and comments are filtered to the
 *   caller's own rows with the statuses that actually exist in the schema —
 *   forum surfaces include the user's own moderation-pending items so they
 *   can be labeled "awaiting review" instead of silently disappearing;
 * - `getLatestAnnouncement` applies the same audience gate the UI-32 member
 *   announcement inbox pins: ANNOUNCEMENT + PUBLISHED + visibility
 *   PUBLIC|MEMBERS_ONLY + publishedAt <= now, newest first.
 */

import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  content,
  event,
  eventRegistration,
  forumCategory,
  forumComment,
  forumPost,
  membershipSubscription,
  membershipTier,
  user,
} from "@/db/schema";
import type {
  Content,
  EventRegistration,
  ForumComment,
  ForumPost,
  MembershipSubscription,
} from "@/db/schema";
import { deriveMemberStatus, type MemberStatus } from "@/lib/services/membership-status.service";
import { listApplicationsForUser } from "@/lib/services/job";
import type { JobApplicationDto } from "@/types/jobs.types";

// ── Membership card ─────────────────────────────────────────────────────────

/**
 * Real membership facts for the card: derived status (never stored), the
 * tier's display identity, and the renewal-relevant dates. `null` means the
 * user has no subscription row at all — render the honest non-member state.
 */
export interface MembershipCardData {
  memberStatus: MemberStatus;
  subscriptionStatus: MembershipSubscription["status"];
  tierDisplayName: string | null;
  tierBillingCycle: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Latest subscription (newest first, matching the subscription engine's own
 * ordering) joined to its tier, with status derived via ADR-0014.
 */
export async function getMembershipCard(
  userId: string,
  now: Date = new Date(),
): Promise<MembershipCardData | null> {
  const rows = await db
    .select({
      subscription: membershipSubscription,
      tierDisplayName: membershipTier.displayName,
      tierBillingCycle: membershipTier.billingCycle,
    })
    .from(membershipSubscription)
    .leftJoin(membershipTier, eq(membershipSubscription.tierId, membershipTier.id))
    .where(eq(membershipSubscription.userId, userId))
    .orderBy(desc(membershipSubscription.createdAt), desc(membershipSubscription.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    memberStatus: deriveMemberStatus(row.subscription, now),
    subscriptionStatus: row.subscription.status,
    tierDisplayName: row.tierDisplayName,
    tierBillingCycle: row.tierBillingCycle,
    currentPeriodStart: row.subscription.currentPeriodStart,
    currentPeriodEnd: row.subscription.currentPeriodEnd,
    trialEnd: row.subscription.trialEnd,
    cancelAtPeriodEnd: row.subscription.cancelAtPeriodEnd,
  };
}

// ── Event registrations ─────────────────────────────────────────────────────

/**
 * One of the user's registrations with the joined event facts the card needs
 * (name, dates, link target). The event FK is NOT NULL and cascades, so the
 * inner join cannot drop rows.
 */
export interface MyEventRegistrationItem {
  registrationId: string;
  status: EventRegistration["status"];
  registeredAt: Date;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventStartTime: Date;
  eventEndTime: Date;
  eventLocation: string | null;
}

/** Member-scoped: exactly this user's registrations, newest first. */
export async function listMyEventRegistrations(userId: string): Promise<MyEventRegistrationItem[]> {
  return db
    .select({
      registrationId: eventRegistration.id,
      status: eventRegistration.status,
      registeredAt: eventRegistration.registeredAt,
      eventId: event.id,
      eventTitle: event.title,
      eventSlug: event.slug,
      eventStartTime: event.startTime,
      eventEndTime: event.endTime,
      eventLocation: event.location,
    })
    .from(eventRegistration)
    .innerJoin(event, eq(eventRegistration.eventId, event.id))
    .where(eq(eventRegistration.userId, userId))
    .orderBy(desc(eventRegistration.registeredAt), desc(eventRegistration.id));
}

// ── Job applications ────────────────────────────────────────────────────────

/**
 * The same read GET /api/v1/jobs/applications/mine serves (the planning doc
 * pins this surface to that endpoint's data).
 */
export async function listMyJobApplications(userId: string): Promise<JobApplicationDto[]> {
  return listApplicationsForUser(userId);
}

// ── Forum activity ──────────────────────────────────────────────────────────

/**
 * Own forum thread. PUBLISHED and own PENDING_REVIEW rows surface — drafts
 * and hidden content never do. `categorySlug` is the thread link's category
 * segment (`/forums/<category>/<post>`).
 */
export interface MyForumPostItem {
  id: string;
  title: string;
  status: ForumPost["status"];
  createdAt: Date;
  replyCount: number;
  categorySlug: string | null;
  categoryDisplayName: string | null;
}

export async function listMyForumPosts(userId: string): Promise<MyForumPostItem[]> {
  return db
    .select({
      id: forumPost.id,
      title: forumPost.title,
      status: forumPost.status,
      createdAt: forumPost.createdAt,
      replyCount: forumPost.replyCount,
      categorySlug: forumCategory.name,
      categoryDisplayName: forumCategory.displayName,
    })
    .from(forumPost)
    .leftJoin(forumCategory, eq(forumPost.categoryId, forumCategory.id))
    .where(
      and(eq(forumPost.userId, userId), inArray(forumPost.status, ["PUBLISHED", "PENDING_REVIEW"])),
    )
    .orderBy(desc(forumPost.createdAt), desc(forumPost.id));
}

/**
 * Own forum comment with enough parent context to gate the thread link:
 * only comments on PUBLISHED posts with a resolvable category link through.
 */
export interface MyForumCommentItem {
  id: string;
  content: string;
  status: ForumComment["status"];
  createdAt: Date;
  postId: string;
  postTitle: string;
  postStatus: ForumPost["status"];
  categorySlug: string | null;
}

export async function listMyForumComments(userId: string): Promise<MyForumCommentItem[]> {
  return db
    .select({
      id: forumComment.id,
      content: forumComment.content,
      status: forumComment.status,
      createdAt: forumComment.createdAt,
      postId: forumPost.id,
      postTitle: forumPost.title,
      postStatus: forumPost.status,
      categorySlug: forumCategory.name,
    })
    .from(forumComment)
    .innerJoin(forumPost, eq(forumComment.postId, forumPost.id))
    .leftJoin(forumCategory, eq(forumPost.categoryId, forumCategory.id))
    .where(
      and(eq(forumComment.userId, userId), inArray(forumComment.status, ["PUBLISHED", "PENDING"])),
    )
    .orderBy(desc(forumComment.createdAt), desc(forumComment.id));
}

// ── Latest announcement (UI-32 widget) ──────────────────────────────────────

/**
 * The single newest audience-ready announcement. `visibility` travels along
 * so the widget can pick an honest read-view link: PUBLIC items resolve on
 * /news/<slug>; MEMBERS_ONLY items do not, so the widget links those to the
 * announcements inbox instead.
 */
export interface LatestAnnouncementData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date;
  visibility: Content["visibility"];
  authorName: string | null;
}

export async function getLatestAnnouncement(
  now: Date = new Date(),
): Promise<LatestAnnouncementData | null> {
  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt,
      publishedAt: content.publishedAt,
      visibility: content.visibility,
      authorName: user.name,
    })
    .from(content)
    .leftJoin(user, and(eq(content.authorId, user.id), isNull(user.deletedAt)))
    .where(
      and(
        eq(content.type, "ANNOUNCEMENT"),
        eq(content.status, "PUBLISHED"),
        inArray(content.visibility, ["PUBLIC", "MEMBERS_ONLY"]),
        lte(content.publishedAt, now),
      ),
    )
    .orderBy(desc(content.publishedAt), desc(content.id))
    .limit(1);

  const row = rows[0];
  if (!row || row.publishedAt === null) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt,
    visibility: row.visibility,
    authorName: row.authorName ?? null,
  };
}
