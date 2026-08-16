/**
 * UI-31 (+ UI-32 first bullet) — member home surfaces.
 *
 * Exercises src/lib/services/member/home.ts, the member-scoped read service
 * behind /dashboard/my/* and the role-aware member dashboard home:
 *
 *   - getMembershipCard(userId) — real status via deriveMemberStatus
 *     (ADR-0014), real tier + renewal dates; null when no subscription
 *     (the UI then renders the honest "Not a member yet" + join CTA);
 *   - listMyEventRegistrations(userId) — member-scoped: exactly this user's
 *     rows, with event name/date/status joined from the events table;
 *   - listMyForumPosts(userId) — own PUBLISHED + own PENDING_REVIEW only
 *     (DRAFT/HIDDEN/etc. never), with category slug for thread links;
 *   - listMyForumComments(userId) — own PUBLISHED + own PENDING only, with
 *     the parent post's title + status so the UI can gate thread links;
 *   - listMyJobApplications(userId) — the same read as
 *     GET /api/v1/jobs/applications/mine (listApplicationsForUser);
 *   - getLatestAnnouncement(now) — the audience gate pinned by the UI-32
 *     member-announcements suite: ANNOUNCEMENT + PUBLISHED + visibility
 *     PUBLIC|MEMBERS_ONLY + publishedAt <= now, newest first.
 *
 * Fixtures follow the tests/news-public-read.test.ts pattern: a RUN_ID
 * isolates every row this file creates and afterAll removes them in FK
 * order, so the file is self-cleaning against the shared test database.
 * Seeds go through drizzle directly — read-path tests need no session.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  company,
  content,
  event,
  eventCategory,
  eventRegistration,
  forumCategory,
  forumComment,
  forumPost,
  jobApplication,
  jobCategory,
  jobPosting,
  jobType,
  location,
  membershipSubscription,
  membershipTier,
  user,
} from "@/db/schema";
import {
  getLatestAnnouncement,
  getMembershipCard,
  listMyEventRegistrations,
  listMyForumComments,
  listMyForumPosts,
  listMyJobApplications,
} from "@/lib/services/member/home";

type ContentInsert = typeof content.$inferInsert;

// ── Fixture scaffolding ─────────────────────────────────────────────────────

const DAY = 86_400_000;
const HOUR = 3_600_000;
const RUN_ID = `ui31-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const NOW = new Date();

const ids = {
  users: [] as string[],
  tiers: [] as string[],
  subscriptions: [] as string[],
  eventCategories: [] as string[],
  events: [] as string[],
  registrations: [] as string[],
  forumCategories: [] as string[],
  forumPosts: [] as string[],
  forumComments: [] as string[],
  jobRefs: [] as string[],
  jobPostings: [] as string[],
  jobApplications: [] as string[],
  content: [] as string[],
};

async function seedUser(label: string) {
  const row = await db
    .insert(user)
    .values({
      username: `${label}-${RUN_ID}`,
      email: `${label}-${RUN_ID}@example.com`,
      name: `UI-31 ${label}`,
      role: "user",
    })
    .returning();
  ids.users.push(row[0].id);
  return row[0];
}

// ── Seed ────────────────────────────────────────────────────────────────────

let memberA: { id: string };
let memberB: { id: string };
let memberC: { id: string };
let memberD: { id: string };
let author: { id: string };

let tier: { id: string; displayName: string; billingCycle: string };

const seeds = {
  subA: undefined as undefined | { id: string; currentPeriodEnd: Date },
  subB: undefined as undefined | { id: string; currentPeriodEnd: Date },
  subC: undefined as undefined | { id: string; currentPeriodEnd: Date },
  eventUpcoming: undefined as
    | undefined
    | { id: string; slug: string; title: string; startTime: Date },
  eventPast: undefined as undefined | { id: string; slug: string; title: string; startTime: Date },
  regUpcoming: undefined as undefined | { id: string; status: string },
  regPast: undefined as undefined | { id: string; status: string },
  forumCatSlug: "",
  forumCatDisplay: "",
  postPublished: undefined as undefined | { id: string; title: string },
  postPending: undefined as undefined | { id: string; title: string },
  commentPublished: undefined as undefined | { id: string; content: string },
  commentPending: undefined as undefined | { id: string; content: string },
  jobA: undefined as undefined | { id: string; title: string },
  applicationA: undefined as undefined | { id: string; status: string },
  announcementNew: undefined as
    | undefined
    | { id: string; title: string; slug: string; publishedAt: Date },
};

beforeAll(async () => {
  memberA = await seedUser("member-a");
  memberB = await seedUser("member-b");
  memberC = await seedUser("member-c");
  memberD = await seedUser("member-d");
  author = await seedUser("author");

  // ── Membership ──
  const [tierRow] = await db
    .insert(membershipTier)
    .values({
      name: `ui31-tier-${RUN_ID}`,
      displayName: `UI-31 Tier ${RUN_ID}`,
      description: "Test tier for member home",
      price: "120.00",
      billingCycle: "yearly",
      features: [],
      benefits: [],
      permissions: [],
    })
    .returning();
  ids.tiers.push(tierRow.id);
  tier = { id: tierRow.id, displayName: tierRow.displayName, billingCycle: tierRow.billingCycle };

  const subAEnd = new Date(NOW.getTime() + 355 * DAY);
  const [subARow] = await db
    .insert(membershipSubscription)
    .values({
      userId: memberA.id,
      tierId: tier.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(NOW.getTime() - 10 * DAY),
      currentPeriodEnd: subAEnd,
      cancelAtPeriodEnd: false,
    })
    .returning();
  ids.subscriptions.push(subARow.id);
  seeds.subA = { id: subARow.id, currentPeriodEnd: subAEnd };

  const subBEnd = new Date(NOW.getTime() + 5 * DAY);
  const [subBRow] = await db
    .insert(membershipSubscription)
    .values({
      userId: memberB.id,
      tierId: tier.id,
      status: "CANCELED",
      currentPeriodStart: new Date(NOW.getTime() - 30 * DAY),
      currentPeriodEnd: subBEnd,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(NOW.getTime() - 1 * DAY),
    })
    .returning();
  ids.subscriptions.push(subBRow.id);
  seeds.subB = { id: subBRow.id, currentPeriodEnd: subBEnd };

  const subCEnd = new Date(NOW.getTime() - 2 * DAY);
  const [subCRow] = await db
    .insert(membershipSubscription)
    .values({
      userId: memberC.id,
      tierId: tier.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(NOW.getTime() - 367 * DAY),
      currentPeriodEnd: subCEnd,
    })
    .returning();
  ids.subscriptions.push(subCRow.id);
  seeds.subC = { id: subCRow.id, currentPeriodEnd: subCEnd };

  // ── Events + registrations ──
  const [eventCatRow] = await db
    .insert(eventCategory)
    .values({ name: `ui31-events-${RUN_ID}`, displayName: `UI-31 Events ${RUN_ID}` })
    .returning();
  ids.eventCategories.push(eventCatRow.id);

  const upcomingStart = new Date(NOW.getTime() + 7 * DAY);
  const [eventUpcomingRow] = await db
    .insert(event)
    .values({
      title: `UI-31 Upcoming Meetup ${RUN_ID}`,
      slug: `ui31-upcoming-${RUN_ID}`,
      description: "Upcoming event",
      categoryId: eventCatRow.id,
      type: "MEETUP",
      format: "IN_PERSON",
      status: "REGISTRATION_OPEN",
      visibility: "PUBLIC",
      timezone: "UTC",
      startTime: upcomingStart,
      endTime: new Date(upcomingStart.getTime() + 2 * HOUR),
      location: "Test Hall",
      createdBy: author.id,
    })
    .returning();
  ids.events.push(eventUpcomingRow.id);
  seeds.eventUpcoming = {
    id: eventUpcomingRow.id,
    slug: eventUpcomingRow.slug,
    title: eventUpcomingRow.title,
    startTime: upcomingStart,
  };

  const pastStart = new Date(NOW.getTime() - 7 * DAY);
  const [eventPastRow] = await db
    .insert(event)
    .values({
      title: `UI-31 Past Workshop ${RUN_ID}`,
      slug: `ui31-past-${RUN_ID}`,
      description: "Past event",
      categoryId: eventCatRow.id,
      type: "WORKSHOP",
      format: "VIRTUAL",
      status: "COMPLETED",
      visibility: "PUBLIC",
      timezone: "UTC",
      startTime: pastStart,
      endTime: new Date(pastStart.getTime() + 2 * HOUR),
      createdBy: author.id,
    })
    .returning();
  ids.events.push(eventPastRow.id);
  seeds.eventPast = {
    id: eventPastRow.id,
    slug: eventPastRow.slug,
    title: eventPastRow.title,
    startTime: pastStart,
  };

  const [regUpcomingRow] = await db
    .insert(eventRegistration)
    .values({ userId: memberA.id, eventId: eventUpcomingRow.id, status: "CONFIRMED" })
    .returning();
  ids.registrations.push(regUpcomingRow.id);
  seeds.regUpcoming = { id: regUpcomingRow.id, status: "CONFIRMED" };

  const [regPastRow] = await db
    .insert(eventRegistration)
    .values({ userId: memberA.id, eventId: eventPastRow.id, status: "ATTENDED" })
    .returning();
  ids.registrations.push(regPastRow.id);
  seeds.regPast = { id: regPastRow.id, status: "ATTENDED" };

  // Isolation fixture: member-b's registration on the same upcoming event.
  const [regBRow] = await db
    .insert(eventRegistration)
    .values({ userId: memberB.id, eventId: eventUpcomingRow.id, status: "PENDING" })
    .returning();
  ids.registrations.push(regBRow.id);

  // ── Forum ──
  seeds.forumCatSlug = `ui31-forum-${RUN_ID}`;
  seeds.forumCatDisplay = `UI-31 Forum ${RUN_ID}`;
  const [forumCatRow] = await db
    .insert(forumCategory)
    .values({ name: seeds.forumCatSlug, displayName: seeds.forumCatDisplay })
    .returning();
  ids.forumCategories.push(forumCatRow.id);

  const [postPublishedRow] = await db
    .insert(forumPost)
    .values({
      categoryId: forumCatRow.id,
      userId: memberA.id,
      title: `UI-31 published post ${RUN_ID}`,
      content: "Published body",
      status: "PUBLISHED",
    })
    .returning();
  ids.forumPosts.push(postPublishedRow.id);
  seeds.postPublished = { id: postPublishedRow.id, title: postPublishedRow.title };

  const [postPendingRow] = await db
    .insert(forumPost)
    .values({
      categoryId: forumCatRow.id,
      userId: memberA.id,
      title: `UI-31 pending post ${RUN_ID}`,
      content: "Pending body",
      status: "PENDING_REVIEW",
    })
    .returning();
  ids.forumPosts.push(postPendingRow.id);
  seeds.postPending = { id: postPendingRow.id, title: postPendingRow.title };

  // Excluded statuses for member-a: DRAFT and HIDDEN must never surface.
  const [postDraftRow] = await db
    .insert(forumPost)
    .values({
      categoryId: forumCatRow.id,
      userId: memberA.id,
      title: `UI-31 draft post ${RUN_ID}`,
      content: "Draft body",
      status: "DRAFT",
    })
    .returning();
  ids.forumPosts.push(postDraftRow.id);
  const [postHiddenRow] = await db
    .insert(forumPost)
    .values({
      categoryId: forumCatRow.id,
      userId: memberA.id,
      title: `UI-31 hidden post ${RUN_ID}`,
      content: "Hidden body",
      status: "HIDDEN",
    })
    .returning();
  ids.forumPosts.push(postHiddenRow.id);

  // Isolation fixture: member-b's pending post must not appear for member-a.
  const [postBRow] = await db
    .insert(forumPost)
    .values({
      categoryId: forumCatRow.id,
      userId: memberB.id,
      title: `UI-31 member-b post ${RUN_ID}`,
      content: "Member b body",
      status: "PENDING_REVIEW",
    })
    .returning();
  ids.forumPosts.push(postBRow.id);

  const [commentPublishedRow] = await db
    .insert(forumComment)
    .values({
      postId: postPublishedRow.id,
      userId: memberA.id,
      content: `UI-31 published comment ${RUN_ID}`,
      status: "PUBLISHED",
    })
    .returning();
  ids.forumComments.push(commentPublishedRow.id);
  seeds.commentPublished = { id: commentPublishedRow.id, content: commentPublishedRow.content };

  const [commentPendingRow] = await db
    .insert(forumComment)
    .values({
      postId: postPublishedRow.id,
      userId: memberA.id,
      content: `UI-31 pending comment ${RUN_ID}`,
      status: "PENDING",
    })
    .returning();
  ids.forumComments.push(commentPendingRow.id);
  seeds.commentPending = { id: commentPendingRow.id, content: commentPendingRow.content };

  // Excluded: HIDDEN comment; isolation: member-b's PENDING comment.
  const [commentHiddenRow] = await db
    .insert(forumComment)
    .values({
      postId: postPublishedRow.id,
      userId: memberA.id,
      content: `UI-31 hidden comment ${RUN_ID}`,
      status: "HIDDEN",
    })
    .returning();
  ids.forumComments.push(commentHiddenRow.id);
  const [commentBRow] = await db
    .insert(forumComment)
    .values({
      postId: postPublishedRow.id,
      userId: memberB.id,
      content: `UI-31 member-b comment ${RUN_ID}`,
      status: "PENDING",
    })
    .returning();
  ids.forumComments.push(commentBRow.id);

  // ── Jobs ──
  const [jobCatRow] = await db
    .insert(jobCategory)
    .values({ name: `ui31-jobs-${RUN_ID}`, displayName: `UI-31 Jobs ${RUN_ID}` })
    .returning();
  ids.jobRefs.push(jobCatRow.id);
  const [jobTypeRow] = await db
    .insert(jobType)
    .values({ name: `ui31-jt-${RUN_ID}`, displayName: `UI-31 Type ${RUN_ID}` })
    .returning();
  ids.jobRefs.push(jobTypeRow.id);
  const [locationRow] = await db
    .insert(location)
    .values({ name: `ui31-loc-${RUN_ID}`, displayName: `UI-31 Loc ${RUN_ID}` })
    .returning();
  ids.jobRefs.push(locationRow.id);
  const [companyRow] = await db
    .insert(company)
    .values({ name: `ui31-co-${RUN_ID}`, displayName: `UI-31 Co ${RUN_ID}` })
    .returning();
  ids.jobRefs.push(companyRow.id);

  const [jobPostingRow] = await db
    .insert(jobPosting)
    .values({
      title: `UI-31 Role ${RUN_ID}`,
      slug: `ui31-role-${RUN_ID}`,
      description: "Job description",
      categoryId: jobCatRow.id,
      typeId: jobTypeRow.id,
      locationId: locationRow.id,
      companyId: companyRow.id,
      postedBy: author.id,
      status: "PUBLISHED",
      employmentType: "FULL_TIME",
      experienceLevel: "MID_LEVEL",
    })
    .returning();
  ids.jobPostings.push(jobPostingRow.id);
  seeds.jobA = { id: jobPostingRow.id, title: jobPostingRow.title };

  const [applicationARow] = await db
    .insert(jobApplication)
    .values({ jobId: jobPostingRow.id, userId: memberA.id, status: "PENDING" })
    .returning();
  ids.jobApplications.push(applicationARow.id);
  seeds.applicationA = { id: applicationARow.id, status: "PENDING" };

  // Isolation fixture: member-b's application on the same posting.
  const [applicationBRow] = await db
    .insert(jobApplication)
    .values({ jobId: jobPostingRow.id, userId: memberB.id, status: "REVIEWING" })
    .returning();
  ids.jobApplications.push(applicationBRow.id);

  // ── Announcements (UI-32 widget) ──
  const olderPublishedAt = new Date(NOW.getTime() - 2 * DAY);
  const [announcementOldRow] = await db
    .insert(content)
    .values({
      title: `UI-31 old announcement ${RUN_ID}`,
      slug: `ui31-ann-old-${RUN_ID}`,
      content: "Old announcement body",
      type: "ANNOUNCEMENT",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      authorId: author.id,
      publishedAt: olderPublishedAt,
    })
    .returning();
  ids.content.push(announcementOldRow.id);

  const newestPublishedAt = new Date(NOW.getTime() - 1 * HOUR);
  const [announcementNewRow] = await db
    .insert(content)
    .values({
      title: `UI-31 newest announcement ${RUN_ID}`,
      slug: `ui31-ann-new-${RUN_ID}`,
      content: "Newest announcement body",
      excerpt: `UI-31 excerpt ${RUN_ID}`,
      type: "ANNOUNCEMENT",
      status: "PUBLISHED",
      visibility: "MEMBERS_ONLY",
      authorId: author.id,
      publishedAt: newestPublishedAt,
    })
    .returning();
  ids.content.push(announcementNewRow.id);
  seeds.announcementNew = {
    id: announcementNewRow.id,
    title: announcementNewRow.title,
    slug: announcementNewRow.slug,
    publishedAt: newestPublishedAt,
  };

  // Hidden rows: draft, future-published, narrower visibility, other types.
  const hiddenAnnouncements: ContentInsert[] = [
    {
      title: `UI-31 draft announcement ${RUN_ID}`,
      slug: `ui31-ann-draft-${RUN_ID}`,
      content: "Draft",
      type: "ANNOUNCEMENT",
      status: "DRAFT",
      visibility: "PUBLIC",
      authorId: author.id,
      publishedAt: null,
    },
    {
      title: `UI-31 future announcement ${RUN_ID}`,
      slug: `ui31-ann-future-${RUN_ID}`,
      content: "Future",
      type: "ANNOUNCEMENT",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      authorId: author.id,
      publishedAt: new Date(NOW.getTime() + 3 * DAY),
    },
    {
      title: `UI-31 premium announcement ${RUN_ID}`,
      slug: `ui31-ann-premium-${RUN_ID}`,
      content: "Premium only",
      type: "ANNOUNCEMENT",
      status: "PUBLISHED",
      visibility: "PREMIUM_MEMBERS",
      authorId: author.id,
      publishedAt: olderPublishedAt,
    },
    {
      title: `UI-31 private announcement ${RUN_ID}`,
      slug: `ui31-ann-private-${RUN_ID}`,
      content: "Private",
      type: "ANNOUNCEMENT",
      status: "PUBLISHED",
      visibility: "PRIVATE",
      authorId: author.id,
      publishedAt: olderPublishedAt,
    },
    {
      title: `UI-31 stray article ${RUN_ID}`,
      slug: `ui31-ann-article-${RUN_ID}`,
      content: "Article body",
      type: "ARTICLE",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      authorId: author.id,
      publishedAt: newestPublishedAt,
    },
  ];
  const hiddenRows = await db.insert(content).values(hiddenAnnouncements).returning();
  for (const row of hiddenRows) ids.content.push(row.id);
});

// ── Teardown (FK order) ─────────────────────────────────────────────────────

afterAll(async () => {
  if (ids.jobApplications.length)
    await db.delete(jobApplication).where(inArray(jobApplication.id, ids.jobApplications));
  if (ids.jobPostings.length)
    await db.delete(jobPosting).where(inArray(jobPosting.id, ids.jobPostings));
  if (ids.jobRefs.length) {
    await db.delete(company).where(inArray(company.id, ids.jobRefs));
    await db.delete(location).where(inArray(location.id, ids.jobRefs));
    await db.delete(jobType).where(inArray(jobType.id, ids.jobRefs));
    await db.delete(jobCategory).where(inArray(jobCategory.id, ids.jobRefs));
  }
  if (ids.forumComments.length)
    await db.delete(forumComment).where(inArray(forumComment.id, ids.forumComments));
  if (ids.forumPosts.length)
    await db.delete(forumPost).where(inArray(forumPost.id, ids.forumPosts));
  if (ids.forumCategories.length)
    await db.delete(forumCategory).where(inArray(forumCategory.id, ids.forumCategories));
  if (ids.registrations.length)
    await db.delete(eventRegistration).where(inArray(eventRegistration.id, ids.registrations));
  if (ids.events.length) await db.delete(event).where(inArray(event.id, ids.events));
  if (ids.eventCategories.length)
    await db.delete(eventCategory).where(inArray(eventCategory.id, ids.eventCategories));
  if (ids.content.length) await db.delete(content).where(inArray(content.id, ids.content));
  if (ids.subscriptions.length)
    await db
      .delete(membershipSubscription)
      .where(inArray(membershipSubscription.id, ids.subscriptions));
  if (ids.tiers.length)
    await db.delete(membershipTier).where(inArray(membershipTier.id, ids.tiers));
  if (ids.users.length) await db.delete(user).where(inArray(user.id, ids.users));
});

// ── Suites ──────────────────────────────────────────────────────────────────

describe("getMembershipCard (UI-31 membership card)", () => {
  test("returns real status, tier and renewal date for an ACTIVE subscription", async () => {
    const card = await getMembershipCard(memberA.id);
    expect(card).not.toBeNull();
    expect(card!.memberStatus).toBe("active");
    expect(card!.subscriptionStatus).toBe("ACTIVE");
    // Real data only: the tier name and renewal date are exactly what was
    // seeded — nothing hardcoded or fabricated in the service.
    expect(card!.tierDisplayName).toBe(tier.displayName);
    expect(card!.tierBillingCycle).toBe(tier.billingCycle);
    expect(card!.currentPeriodEnd!.getTime()).toBe(seeds.subA!.currentPeriodEnd.getTime());
    expect(card!.cancelAtPeriodEnd).toBe(false);
  });

  test("derives in_grace for a CANCELED subscription inside its paid period", async () => {
    const card = await getMembershipCard(memberB.id);
    expect(card).not.toBeNull();
    expect(card!.memberStatus).toBe("in_grace");
    expect(card!.cancelAtPeriodEnd).toBe(true);
    expect(card!.currentPeriodEnd!.getTime()).toBe(seeds.subB!.currentPeriodEnd.getTime());
  });

  test("derives expired when the period end is in the past", async () => {
    const card = await getMembershipCard(memberC.id);
    expect(card).not.toBeNull();
    expect(card!.memberStatus).toBe("expired");
    expect(card!.currentPeriodEnd!.getTime()).toBe(seeds.subC!.currentPeriodEnd.getTime());
  });

  test("returns null when the user has no subscription (honest non-member state)", async () => {
    const card = await getMembershipCard(memberD.id);
    expect(card).toBeNull();
  });
});

describe("listMyEventRegistrations (UI-31 my events)", () => {
  test("lists exactly this user's registrations with joined event data", async () => {
    const rows = await listMyEventRegistrations(memberA.id);
    expect(rows).toHaveLength(2);

    const upcoming = rows.find((r) => r.registrationId === seeds.regUpcoming!.id);
    expect(upcoming).toBeDefined();
    expect(upcoming!.status).toBe("CONFIRMED");
    expect(upcoming!.eventId).toBe(seeds.eventUpcoming!.id);
    expect(upcoming!.eventTitle).toBe(seeds.eventUpcoming!.title);
    expect(upcoming!.eventSlug).toBe(seeds.eventUpcoming!.slug);
    expect(upcoming!.eventStartTime!.getTime()).toBe(seeds.eventUpcoming!.startTime.getTime());

    const past = rows.find((r) => r.registrationId === seeds.regPast!.id);
    expect(past).toBeDefined();
    expect(past!.status).toBe("ATTENDED");
    expect(past!.eventTitle).toBe(seeds.eventPast!.title);
  });

  test("never includes other users' registrations", async () => {
    const rows = await listMyEventRegistrations(memberA.id);
    const eventIds = new Set(rows.map((r) => r.eventId));
    // Both of member-a's events are theirs, but the count proves member-b's
    // PENDING registration on the same upcoming event did not leak in.
    expect(rows).toHaveLength(2);
    expect(eventIds.has(seeds.eventUpcoming!.id)).toBe(true);
  });
});

describe("listMyForumPosts (UI-31 my forum posts)", () => {
  test("returns own PUBLISHED + own PENDING_REVIEW posts with category link data", async () => {
    const posts = await listMyForumPosts(memberA.id);
    expect(posts).toHaveLength(2);
    const published = posts.find((p) => p.id === seeds.postPublished!.id);
    const pending = posts.find((p) => p.id === seeds.postPending!.id);
    expect(published).toBeDefined();
    expect(published!.title).toBe(seeds.postPublished!.title);
    expect(published!.status).toBe("PUBLISHED");
    expect(published!.categorySlug).toBe(seeds.forumCatSlug);
    expect(pending).toBeDefined();
    expect(pending!.status).toBe("PENDING_REVIEW");
  });

  test("excludes own DRAFT/HIDDEN posts and other users' posts", async () => {
    const posts = await listMyForumPosts(memberA.id);
    const titles = posts.map((p) => p.title);
    for (const title of titles) {
      expect(title).not.toContain("draft");
      expect(title).not.toContain("hidden");
      expect(title).not.toContain("member-b");
    }
  });
});

describe("listMyForumComments (UI-31 my forum comments)", () => {
  test("returns own PUBLISHED + own PENDING comments with parent post context", async () => {
    const comments = await listMyForumComments(memberA.id);
    expect(comments).toHaveLength(2);

    const published = comments.find((c) => c.id === seeds.commentPublished!.id);
    expect(published).toBeDefined();
    expect(published!.content).toBe(seeds.commentPublished!.content);
    expect(published!.status).toBe("PUBLISHED");
    expect(published!.postTitle).toBe(seeds.postPublished!.title);
    expect(published!.postStatus).toBe("PUBLISHED");
    expect(published!.categorySlug).toBe(seeds.forumCatSlug);

    const pending = comments.find((c) => c.id === seeds.commentPending!.id);
    expect(pending).toBeDefined();
    expect(pending!.status).toBe("PENDING");
  });

  test("excludes HIDDEN comments and other users' comments", async () => {
    const comments = await listMyForumComments(memberA.id);
    for (const comment of comments) {
      expect(comment.content).not.toContain("hidden");
      expect(comment.content).not.toContain("member-b");
    }
  });
});

describe("listMyJobApplications (UI-31 my job applications)", () => {
  test("returns exactly this user's applications, same read as /api/v1/jobs/applications/mine", async () => {
    const applications = await listMyJobApplications(memberA.id);
    expect(applications).toHaveLength(1);
    expect(applications[0].id).toBe(seeds.applicationA!.id);
    expect(applications[0].jobId).toBe(seeds.jobA!.id);
    expect(applications[0].jobTitle).toBe(seeds.jobA!.title);
    expect(applications[0].status).toBe("PENDING");
  });

  test("never includes other users' applications", async () => {
    const applications = await listMyJobApplications(memberA.id);
    expect(applications).toHaveLength(1);
  });
});

describe("getLatestAnnouncement (UI-32 widget)", () => {
  test("returns the newest audience-ready announcement", async () => {
    const latest = await getLatestAnnouncement(memberA.id);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(seeds.announcementNew!.id);
    expect(latest!.title).toBe(seeds.announcementNew!.title);
    expect(latest!.slug).toBe(seeds.announcementNew!.slug);
    expect(latest!.publishedAt.getTime()).toBe(seeds.announcementNew!.publishedAt.getTime());
    expect(latest!.authorName).toBe("UI-31 author");
  });

  test("respects the injected clock: a now before every publish date yields null", async () => {
    const none = await getLatestAnnouncement(memberA.id, new Date(NOW.getTime() - 30 * DAY));
    expect(none).toBeNull();
  });
});
