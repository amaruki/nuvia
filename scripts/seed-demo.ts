/**
 * Demo-mode seed (UI-39, stage 1 — docs/planning/03-frontend-improvement-plan.md
 * L137-141): fill a demo instance with audience-facing content so the
 * product shows itself with data in it.
 *
 * Everything audience-facing is created THROUGH THE EXISTING SERVICES —
 * createEvent, createJobPosting, createContentItem, forum createCategory/
 * createPost, createChapter, createCommittee, createCourse/issueCertificate,
 * createTier, updateOrganization — so seeded rows exercise exactly the same
 * validation, status mapping and audit behavior as request-driven writes.
 * Only reference tables with no write service (job categories/types/
 * locations/companies, event categories) get direct inserts.
 *
 * Accounts: three personas under the reserved *.nuvia.test domain —
 * aria (moderator, content author), bruno (member, certificate recipient)
 * and the disposable demo login (custom "demo" role). The disposable
 * account's password is crypto-random, rotated on every run, printed to
 * stdout exactly once and never logged anywhere else. Seeded admins from
 * scripts/seed.ts are never touched and never reused here.
 *
 * The companion reset job (scripts/reset-demo.ts) is meant for a daily cron,
 * e.g.:
 *
 *   0 4 * * * cd /app && DEMO_MODE=true bun run scripts/reset-demo.ts
 */
import { randomBytes } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";

import { db } from "@/db/client";
import {
  account,
  activeDevice,
  certificate,
  chapter,
  committee,
  company,
  content,
  course,
  customRole,
  event,
  eventCategory,
  forumCategory,
  forumPost,
  jobCategory,
  jobPosting,
  jobType,
  location,
  membershipTier,
  organization,
  session,
  user,
  userLoginActivity,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  DEMO_DOMAIN,
  DEMO_ROLE,
  DEMO_USER_EMAIL,
  DEMO_USER_NAME,
  DEMO_USER_USERNAME,
} from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { createChapter } from "@/lib/services/chapter";
import { createCommittee } from "@/lib/services/committee";
import { createContentItem } from "@/lib/services/content";
import { createEvent } from "@/lib/services/event-write";
import { createPost, type ForumActor } from "@/lib/services/forum";
import { createJobPosting } from "@/lib/services/job";
import { createCourse, issueCertificate } from "@/lib/services/learning";
import { createTier } from "@/lib/services/membership-tier.service";
import {
  invalidateOrganizationCache,
  ORGANIZATION_DEFAULTS,
  ORGANIZATION_ID,
  updateOrganization,
} from "@/lib/services/organization.service";

export interface DemoSeedResult {
  email: string;
  username: string;
  password: string;
}

/** Read-only permission set for the demo custom role — nothing admin-flavored. */
const DEMO_ROLE_PERMISSIONS = [
  "events:read",
  "content:read",
  "forum:read",
  "jobs:read",
  "learning:read",
  "chapters:read",
  "committees:read",
  "awards:read",
  "organization:read",
];

const ARIA_EMAIL = `aria@${DEMO_DOMAIN}`;
const BRUNO_EMAIL = `bruno@${DEMO_DOMAIN}`;

/** Crypto-random strong password; every character class guaranteed. */
export function generateDemoPassword(): string {
  const classes = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*-_=+",
  ];
  const alphabet = classes.join("");
  const bytes = randomBytes(28);
  const chars: string[] = [];
  classes.forEach((cls, index) => {
    chars.push(cls[bytes[index] % cls.length]);
  });
  for (let i = classes.length; i < 24; i += 1) {
    chars.push(alphabet[bytes[i] % alphabet.length]);
  }
  // Fisher-Yates with fresh randomness so the guaranteed characters are not
  // pinned to the front.
  const shuffle = randomBytes(24);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = shuffle[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// personas
// ---------------------------------------------------------------------------

async function createPersona(options: {
  email: string;
  username: string;
  name: string;
  role: string;
  password: string;
}): Promise<string> {
  await auth.api.signUpEmail({
    body: {
      name: options.name,
      email: options.email,
      password: options.password,
      username: options.username,
    },
  });
  const created = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, options.email))
    .limit(1);
  if (created.length === 0) throw new Error(`Demo persona not created: ${options.email}`);
  await db
    .update(user)
    .set({ role: options.role, emailVerified: true })
    .where(eq(user.id, created[0].id));
  return created[0].id;
}

// ---------------------------------------------------------------------------
// wipe — removes ONLY demo-namespace rows (slugs/titles/emails are namespaced)
// ---------------------------------------------------------------------------

export async function wipeDemo(): Promise<void> {
  const demoUsers = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `%@${DEMO_DOMAIN}`));
  const demoUserIds = demoUsers.map((row) => row.id);

  if (demoUserIds.length > 0) {
    await db.delete(forumPost).where(inArray(forumPost.userId, demoUserIds));
  }
  await db.delete(forumCategory).where(like(forumCategory.name, "Demo%"));
  await db.delete(certificate).where(like(certificate.studentEmail, `%@${DEMO_DOMAIN}`));
  await db.delete(course).where(like(course.title, "Demo:%"));
  await db.delete(jobPosting).where(like(jobPosting.slug, "demo-%"));
  await db.delete(jobCategory).where(like(jobCategory.name, "demo-%"));
  await db.delete(jobType).where(like(jobType.name, "demo-%"));
  await db.delete(location).where(like(location.name, "demo-%"));
  await db.delete(company).where(like(company.name, "demo-%"));
  await db.delete(event).where(like(event.slug, "demo-%"));
  await db.delete(eventCategory).where(like(eventCategory.name, "Demo%"));
  await db.delete(content).where(like(content.slug, "demo-%"));
  await db.delete(chapter).where(like(chapter.name, "demo-%"));
  await db.delete(committee).where(like(committee.name, "demo-%"));
  await db.delete(membershipTier).where(like(membershipTier.name, "demo-%"));
  await db.delete(customRole).where(eq(customRole.name, DEMO_ROLE));

  if (demoUserIds.length > 0) {
    await db.delete(userLoginActivity).where(inArray(userLoginActivity.userId, demoUserIds));
    await db.delete(session).where(inArray(session.userId, demoUserIds));
    await db.delete(account).where(inArray(account.userId, demoUserIds));
    await db.delete(activeDevice).where(inArray(activeDevice.userId, demoUserIds));
    await db.delete(user).where(inArray(user.id, demoUserIds));
  }

  // Restore the organization singleton so a wiped instance doesn't keep
  // demo branding.
  await db
    .update(organization)
    .set({ ...ORGANIZATION_DEFAULTS })
    .where(eq(organization.id, ORGANIZATION_ID));
  invalidateOrganizationCache();
}

// ---------------------------------------------------------------------------
// content stages
// ---------------------------------------------------------------------------

async function seedOrganization(actorId: string): Promise<void> {
  await updateOrganization(
    {
      name: "Nuvia Demo",
      legalName: null,
      logo: null,
      website: null,
      supportEmail: null,
      locale: ORGANIZATION_DEFAULTS.locale,
      currency: ORGANIZATION_DEFAULTS.currency,
      timezone: ORGANIZATION_DEFAULTS.timezone,
    },
    actorId,
  );
  invalidateOrganizationCache();
}

async function seedTiers(): Promise<void> {
  await createTier({
    name: "demo-free",
    displayName: "Demo Free",
    description: "Sample free tier for exploring the demo instance.",
    price: "0.00",
    billingCycle: "yearly",
    isDefault: true,
    sortOrder: 0,
  });
  await createTier({
    name: "demo-professional",
    displayName: "Demo Professional",
    description: "Sample professional tier with member benefits.",
    price: "12.00",
    billingCycle: "monthly",
    features: ["Event discounts", "Members-only forums"],
    sortOrder: 1,
  });
  await createTier({
    name: "demo-organization",
    displayName: "Demo Organization",
    description: "Sample organizational membership.",
    price: "120.00",
    billingCycle: "yearly",
    features: ["5 seats", "Chapter directory listing"],
    sortOrder: 2,
  });
}

async function seedEvents(actorId: string): Promise<void> {
  for (const [name, description] of [
    ["Demo Conference", "Annual gathering of the demo community."],
    ["Demo Workshop", "Hands-on sessions run on the demo instance."],
    ["Demo Social", "Casual meetups for demo members."],
  ] as const) {
    await db
      .insert(eventCategory)
      .values({ name, displayName: name, description, isActive: true })
      .onConflictDoNothing({ target: eventCategory.name });
  }

  const base = {
    description:
      "A sample event seeded for the demo instance. Register, explore, and try the flows. Data resets daily.",
    timezone: "UTC",
    isFree: true,
    isVirtual: false,
    currency: "USD",
    allowWaitlist: true,
    requiresApproval: false,
    tags: ["demo"],
  };

  await createEvent(
    {
      ...base,
      title: "Demo Community Meetup",
      slug: "demo-community-meetup",
      category: "Demo Social",
      type: "MEETUP",
      format: "IN_PERSON",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      startTime: daysFromNow(7),
      endTime: daysFromNow(7.1),
      location: "Riverside Community Hall",
    },
    actorId,
  );
  await createEvent(
    {
      ...base,
      title: "Demo Annual Conference",
      slug: "demo-annual-conference",
      category: "Demo Conference",
      type: "CONFERENCE",
      format: "HYBRID",
      status: "REGISTRATION_OPEN",
      visibility: "PUBLIC",
      startTime: daysFromNow(30),
      endTime: daysFromNow(32),
      registrationStart: daysFromNow(-1),
      registrationEnd: daysFromNow(20),
      location: "Demo Convention Center",
    },
    actorId,
  );
  await createEvent(
    {
      ...base,
      title: "Demo Members Summit",
      slug: "demo-members-summit",
      category: "Demo Conference",
      type: "KEYNOTE",
      format: "VIRTUAL",
      status: "IN_PROGRESS",
      visibility: "MEMBERS_ONLY",
      startTime: daysFromNow(-1),
      endTime: daysFromNow(1),
      isVirtual: true,
      virtualUrl: "https://example.test/demo-summit",
    },
    actorId,
  );
  await createEvent(
    {
      ...base,
      title: "Demo Workshop Series",
      slug: "demo-workshop-series",
      category: "Demo Workshop",
      type: "WORKSHOP",
      format: "VIRTUAL",
      status: "PUBLISHED",
      visibility: "MEMBERS_ONLY",
      startTime: daysFromNow(14),
      endTime: daysFromNow(14.1),
      isVirtual: true,
      virtualUrl: "https://example.test/demo-workshop",
    },
    actorId,
  );
}

async function seedJobs(actorId: string): Promise<void> {
  const [category] = await db
    .insert(jobCategory)
    .values({ name: "demo-programs", displayName: "Demo Programs" })
    .returning();
  const [type] = await db
    .insert(jobType)
    .values({ name: "demo-full-time", displayName: "Full-time (demo)" })
    .returning();
  const [place] = await db
    .insert(location)
    .values({ name: "demo-remote", displayName: "Remote (demo)", remote: true })
    .returning();
  const [employer] = await db
    .insert(company)
    .values({
      name: "demo-acme",
      displayName: "Acme Demo Corp",
      description: "A sample employer on the demo instance.",
    })
    .returning();

  const deadlines = [30, 60];
  const titles = ["Demo Program Manager", "Demo Community Coordinator"];
  for (let i = 0; i < titles.length; i += 1) {
    await createJobPosting(
      {
        title: titles[i],
        description:
          "Sample job posting seeded for the demo instance. Applications are welcome. Everything resets daily.",
        categoryId: category.id,
        typeId: type.id,
        locationId: place.id,
        companyId: employer.id,
        status: "PUBLISHED",
        employmentType: "FULL_TIME",
        experienceLevel: i === 0 ? "MID_LEVEL" : "ENTRY_LEVEL",
        isRemote: true,
        isFeatured: false,
        currency: "USD",
        applicationDeadline: daysFromNow(deadlines[i]),
        tags: ["demo"],
      },
      actorId,
    );
  }
}

async function seedContent(actorId: string): Promise<void> {
  await createContentItem(
    "articles",
    {
      title: "Welcome to the Nuvia demo",
      slug: "demo-welcome",
      excerpt: "What this demo instance is and how to explore it.",
      content:
        "This instance is seeded with sample content so you can explore every audience-facing module. All data resets daily.",
      status: "published",
      visibility: "public",
    },
    actorId,
  );
  await createContentItem(
    "articles",
    {
      title: "How the demo seed works",
      slug: "demo-seed-overview",
      excerpt:
        "The seed script builds events, jobs, articles and forums through the real services.",
      content:
        "Every row you see was created through the same services the API uses, so what works here works in production.",
      status: "published",
      visibility: "public",
    },
    actorId,
  );
  await createContentItem(
    "announcements",
    {
      title: "Demo instance resets daily",
      slug: "demo-reset-notice",
      excerpt: "Your changes are safe to experiment with. The instance resets every day.",
      content: "This is a shared demo instance. Data resets daily, so feel free to try anything.",
      status: "published",
      visibility: "public",
    },
    actorId,
  );
}

async function seedForums(ariaActor: ForumActor): Promise<void> {
  const [general] = await db
    .insert(forumCategory)
    .values({
      name: "Demo General",
      displayName: "Demo General",
      description: "Open discussion on the demo instance.",
      isActive: true,
      isPrivate: false,
      sortOrder: 0,
    })
    .returning();

  const posts: Array<{ title: string; content: string }> = [
    {
      title: "Demo: introduce yourself",
      content: "Welcome to the demo instance! This is a sample published discussion thread.",
    },
    {
      title: "Demo: tips for exploring the product",
      content: "Try registering for an event, browsing the job board, and reading the articles.",
    },
  ];
  for (const post of posts) {
    await createPost({ categoryId: general.id, ...post, status: "PUBLISHED" }, ariaActor);
  }
  // The moderator persona publishes a third thread directly — createPost only
  // accepts PUBLISHED from actors carrying forum:moderate.
  await createPost(
    {
      categoryId: general.id,
      title: "Demo: member question about tiers",
      content: "What does the sample professional tier include?",
      status: "PUBLISHED",
    },
    ariaActor,
  );
}

async function seedChaptersAndCommittees(actorId: string): Promise<void> {
  await createChapter(
    {
      name: "demo-chapter-riverside",
      displayName: "Riverside Demo Chapter",
      description: "A sample chapter seeded for the demo instance.",
      status: "active",
      parentChapterId: null,
      location: {
        address: "12 Sample Street",
        city: "Riverside",
        state: "CA",
        country: "US",
        postalCode: "92501",
        timezone: "America/Los_Angeles",
        region: "West",
      },
      contactInfo: {
        email: `chapter@${DEMO_DOMAIN}`,
        address: "12 Sample Street, Riverside, CA",
      },
      socialMedia: {},
      settings: {
        allowOnlineRegistration: true,
        requireApproval: false,
        membershipDues: 0,
        meetingFrequency: "monthly",
        autoRenewMembership: false,
        sendReminders: true,
        publicDirectory: true,
      },
    },
    actorId,
  );

  await createCommittee(
    {
      name: "demo-committee-programs",
      displayName: "Demo Programs Committee",
      description: "A sample committee seeded for the demo instance.",
      purpose: "Plans and reviews the sample programming shown across the demo instance.",
      status: "active",
      type: "standing",
      charter: {
        missionStatement: "Keep the demo instance populated with believable sample programming.",
        responsibilities: ["Curate sample events", "Review sample content"],
        authorityLevel: "advisory",
        decisionMakingProcess: "Consensus at the monthly sample meeting.",
        reportingStructure: "Reports to the demo organization admin.",
      },
      contactInfo: { email: `programs@${DEMO_DOMAIN}` },
    },
    actorId,
  );
}

async function seedLearning(actorId: string, ariaEmail: string, brunoEmail: string): Promise<void> {
  const created = await createCourse(
    {
      title: "Demo: Getting Started with Nuvia",
      description:
        "A sample onboarding course seeded for the demo instance, complete with a certificate.",
      category: "Onboarding",
      level: "Beginner",
      duration: "2h",
    },
    actorId,
  );
  await issueCertificate(
    {
      courseId: created.id,
      studentName: "Bruno Demo",
      studentEmail: brunoEmail,
      grade: "Pass",
    },
    ariaEmail,
  );
}

// ---------------------------------------------------------------------------
// public entry points
// ---------------------------------------------------------------------------

export async function seedDemo(): Promise<DemoSeedResult> {
  if (!isDemoMode()) {
    throw new Error("seedDemo() refuses to run: DEMO_MODE must be 'true' to seed demo content.");
  }

  await wipeDemo();

  // Custom role row for the demo account (read-only permission set).
  await db
    .insert(customRole)
    .values({
      name: DEMO_ROLE,
      displayName: "Demo Visitor",
      description: "Read-only visitor on a demo instance (UI-39); data resets daily.",
      permissions: DEMO_ROLE_PERMISSIONS,
      isSystem: false,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: customRole.name,
      set: { permissions: DEMO_ROLE_PERMISSIONS, isActive: true },
    });

  const password = generateDemoPassword();
  const ariaId = await createPersona({
    email: ARIA_EMAIL,
    username: "aria_demo",
    name: "Aria Demo",
    role: "moderator",
    password: generateDemoPassword(),
  });
  await createPersona({
    email: BRUNO_EMAIL,
    username: "bruno_demo",
    name: "Bruno Demo",
    role: "member",
    password: generateDemoPassword(),
  });
  await createPersona({
    email: DEMO_USER_EMAIL,
    username: DEMO_USER_USERNAME,
    name: DEMO_USER_NAME,
    role: DEMO_ROLE,
    password,
  });

  const ariaActor: ForumActor = {
    id: ariaId,
    role: "moderator",
    permissions: ["forum:moderate", "forum:read"],
  };

  await seedOrganization(ariaId);
  await seedTiers();
  await seedEvents(ariaId);
  await seedJobs(ariaId);
  await seedContent(ariaId);
  await seedForums(ariaActor);
  await seedChaptersAndCommittees(ariaId);
  await seedLearning(ariaId, ARIA_EMAIL, BRUNO_EMAIL);

  console.log("Demo seed complete — audience-facing content is live.");
  console.log("Demo login credential (rotates on every reset — save it now):");
  console.log(`  email:    ${DEMO_USER_EMAIL}`);
  console.log(`  password: ${password}`);

  return { email: DEMO_USER_EMAIL, username: DEMO_USER_USERNAME, password };
}

/** Daily reset: wipe demo residue, reseed, rotate the credential. */
export async function resetDemo(): Promise<DemoSeedResult> {
  if (!isDemoMode()) {
    throw new Error("resetDemo() refuses to run: DEMO_MODE must be 'true' to reset demo content.");
  }
  console.log("Resetting demo instance (wipe + reseed + credential rotation)...");
  return seedDemo();
}

// CLI entry — `bun run scripts/seed-demo.ts` / `scripts/reset-demo.ts` via
// the wrapper script of the same shape.
if (import.meta.main) {
  resetDemo()
    .catch((error) => {
      console.error("Demo reset failed:", error);
      process.exit(1);
    })
    .finally(() => process.exit(0));
}
