/**
 * UI-28 — Member directory & public profile (decision D7: opt-in,
 * private by default).
 *
 * Covers the public-safe read path `src/lib/services/member/public-profile.ts`
 * and the `/members/[id]` page contract:
 *
 *  - the directory lists only users who opted in (`profilePublic`); users at
 *    the default (flag off) never appear
 *  - `getPublicProfile` returns null until the member opts in, then returns
 *    the profile
 *  - the projection NEVER contains never-public fields (plan §3 exposure
 *    audit: users.email, emailVerified, passwordHash, emailVerificationToken,
 *    role, deletedAt, and auth internals such as tokens) — asserted both as
 *    key absence anywhere in the result and as value absence of seeded data
 *  - directory search + pagination
 *  - `/members/[id]` for a non-opted-in (or missing/soft-deleted) user is a
 *    404: the page throws NEXT_NOT_FOUND
 *  - affiliations carry chapter/committee leadership titles — never the RBAC
 *    `users.role`
 *  - UI-30: organizer credit resolves for both opted-in (link) and private
 *    (plain text) organizers; the job-detail company link uses the company
 *    website only when the schema holds one
 */
import { afterAll, describe, expect, test } from "bun:test";
import { auth } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { chapter, chapterMember, committee, committeeMember, company, user } from "@/db/schema";
import {
  getOrganizerCredit,
  getPublicProfile,
  listPublicMembers,
} from "@/lib/services/member/public-profile";
import MemberProfilePage from "@/app/(public)/members/[id]/page";
import { getCompanyLinkTarget } from "@/app/(public)/jobs/[id]/_components/company-link";

const RUN_ID = crypto.randomUUID().slice(0, 8);

/** Every seeded display name carries this marker so queries stay scoped. */
const MARK = `pp${RUN_ID}`;

const seededUserIds: string[] = [];
const seededChapterIds: string[] = [];
const seededCommitteeIds: string[] = [];
const seededCompanyIds: string[] = [];

interface SeedUserOptions {
  profilePublic?: boolean;
  deletedAt?: Date;
  bio?: string | null;
  displayName?: string;
  externalLinks?: unknown;
}

async function seedUser(slug: string, options: SeedUserOptions = {}): Promise<string> {
  const stamp = crypto.randomUUID().slice(0, 8);
  const [row] = await db
    .insert(user)
    .values({
      username: `${MARK}-${slug}-${stamp}`,
      email: `${MARK}-${slug}-${stamp}@example.invalid`,
      name: `${MARK} ${slug}`,
      displayName: options.displayName ?? `${MARK} ${slug}`,
      bio: options.bio ?? null,
      externalLinks: (options.externalLinks ?? null) as never,
      profilePublic: options.profilePublic ?? false,
      passwordHash: `fake-hash-${MARK}`,
      ...(options.deletedAt ? { deletedAt: options.deletedAt } : {}),
    })
    .returning({ id: user.id });
  seededUserIds.push(row.id);
  return row.id;
}

/** Keys that must never appear anywhere inside a public projection. */
const NEVER_PUBLIC_KEYS = [
  "email",
  "emailVerified",
  "email_verified",
  "passwordHash",
  "password_hash",
  "password",
  "emailVerificationToken",
  "email_verification_token",
  "role",
  "deletedAt",
  "deleted_at",
  "username",
  "token",
  "tokens",
  "ipAddress",
  "userAgent",
  "sessions",
  "accounts",
];

function collectKeys(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, into);
    return;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    for (const [key, nested] of Object.entries(value)) {
      into.add(key);
      collectKeys(nested, into);
    }
  }
}

function assertNeverPublic(result: unknown, secrets: string[]): void {
  const keys = new Set<string>();
  collectKeys(result, keys);
  for (const forbidden of NEVER_PUBLIC_KEYS) {
    expect(keys.has(forbidden)).toBe(false);
  }
  const serialized = JSON.stringify(result);
  for (const secret of secrets) {
    expect(serialized).not.toContain(secret);
  }
}

let privateUserId: string;
let publicUserId: string;
let laterOptInUserId: string;
let softDeletedUserId: string;

afterAll(async () => {
  if (seededUserIds.length > 0) {
    await db.delete(chapterMember).where(inArray(chapterMember.userId, seededUserIds));
    await db.delete(committeeMember).where(inArray(committeeMember.userId, seededUserIds));
    if (seededChapterIds.length > 0) {
      await db.delete(chapter).where(inArray(chapter.id, seededChapterIds));
    }
    if (seededCommitteeIds.length > 0) {
      await db.delete(committee).where(inArray(committee.id, seededCommitteeIds));
    }
    if (seededCompanyIds.length > 0) {
      await db.delete(company).where(inArray(company.id, seededCompanyIds));
    }
    await db.delete(user).where(inArray(user.id, seededUserIds));
  }
});

describe("UI-28 public member directory & profile", () => {
  test("hidden by default: the directory returns only opted-in users", async () => {
    privateUserId = await seedUser("private-anna");
    publicUserId = await seedUser("public-bruno", {
      profilePublic: true,
      bio: `${MARK} founding member and treasurer`,
      externalLinks: [
        { platform: "github", url: "https://github.com/octocat", username: "octocat" },
      ],
    });

    const result = await listPublicMembers({ query: MARK });
    const ids = result.members.map((member) => member.id);

    expect(ids).toContain(publicUserId);
    expect(ids).not.toContain(privateUserId);
    expect(result.total).toBe(result.members.length);
  });

  test("profile is returned only after the member opts in", async () => {
    laterOptInUserId = await seedUser("later-carla");

    expect(await getPublicProfile(laterOptInUserId)).toBeNull();

    await db.update(user).set({ profilePublic: true }).where(eq(user.id, laterOptInUserId));

    const profile = await getPublicProfile(laterOptInUserId);
    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(laterOptInUserId);
    expect(profile?.name).toBe(`${MARK} later-carla`);
  });

  test("soft-deleted users stay hidden even when opted in", async () => {
    softDeletedUserId = await seedUser("deleted-dora", {
      profilePublic: true,
      deletedAt: new Date(),
    });

    expect(await getPublicProfile(softDeletedUserId)).toBeNull();

    const result = await listPublicMembers({ query: MARK });
    expect(result.members.map((member) => member.id)).not.toContain(softDeletedUserId);
  });

  test("projection never contains never-public fields", async () => {
    const secrets = [`${MARK}@`, `fake-hash-${MARK}`];

    const profile = await getPublicProfile(publicUserId);
    expect(profile).not.toBeNull();
    assertNeverPublic(profile, secrets);

    const directory = await listPublicMembers({ query: MARK });
    expect(directory.members.length).toBeGreaterThan(0);
    assertNeverPublic(directory.members, secrets);

    // The public projection is an allow-list: exactly the D7-visible surface.
    for (const member of directory.members) {
      expect(Object.keys(member).sort()).toEqual(
        ["affiliations", "avatar", "bio", "id", "name"].sort(),
      );
    }
    expect(Object.keys(profile!).sort()).toEqual(
      ["affiliations", "avatar", "bio", "externalLinks", "id", "joinedAt", "name"].sort(),
    );
  });

  test("directory search matches name and bio, case-insensitively", async () => {
    const byName = await listPublicMembers({ query: MARK.toUpperCase() });
    expect(byName.total).toBeGreaterThan(0);

    const byBio = await listPublicMembers({ query: `founding member and treasurer` });
    expect(byBio.members.map((member) => member.id)).toContain(publicUserId);

    const noMatch = await listPublicMembers({ query: `no-such-member-${RUN_ID}` });
    expect(noMatch.total).toBe(0);
    expect(noMatch.members).toEqual([]);
  });

  test("directory paginates", async () => {
    for (const slug of ["paged-one", "paged-two", "paged-three", "paged-four"]) {
      await seedUser(slug, { profilePublic: true });
    }

    const first = await listPublicMembers({ query: `${MARK} paged-`, page: 1, limit: 2 });
    expect(first.total).toBe(4);
    expect(first.totalPages).toBe(2);
    expect(first.members).toHaveLength(2);

    const second = await listPublicMembers({ query: `${MARK} paged-`, page: 2, limit: 2 });
    expect(second.members).toHaveLength(2);

    const firstIds = new Set(first.members.map((member) => member.id));
    for (const member of second.members) {
      expect(firstIds.has(member.id)).toBe(false);
    }

    const beyond = await listPublicMembers({ query: `${MARK} paged-`, page: 99, limit: 2 });
    expect(beyond.members).toEqual([]);
  });

  test("affiliations show chapter/committee leadership titles, never users.role", async () => {
    const stamp = crypto.randomUUID().slice(0, 8);
    const [activeChapter] = await db
      .insert(chapter)
      .values({
        name: `chapter-${MARK}-${stamp}`,
        displayName: `${MARK} Active Chapter`,
        status: "ACTIVE",
        createdBy: "seed@example.invalid",
      })
      .returning({ id: chapter.id });
    seededChapterIds.push(activeChapter.id);

    const [inactiveChapter] = await db
      .insert(chapter)
      .values({
        name: `chapter-inactive-${MARK}-${stamp}`,
        displayName: `${MARK} Inactive Chapter`,
        status: "INACTIVE",
        createdBy: "seed@example.invalid",
      })
      .returning({ id: chapter.id });
    seededChapterIds.push(inactiveChapter.id);

    const [activeCommittee] = await db
      .insert(committee)
      .values({
        name: `committee-${MARK}-${stamp}`,
        displayName: `${MARK} Active Committee`,
        purpose: "test committee",
        status: "active",
        contactEmail: `committee-${stamp}@example.invalid`,
        createdBy: publicUserId,
      })
      .returning({ id: committee.id });
    seededCommitteeIds.push(activeCommittee.id);

    await db.insert(chapterMember).values([
      {
        chapterId: activeChapter.id,
        userId: publicUserId,
        role: "PRESIDENT",
        name: `${MARK} public-bruno`,
        email: `${MARK}-bruno-${stamp}@example.invalid`,
        isActive: true,
      },
      {
        chapterId: inactiveChapter.id,
        userId: publicUserId,
        role: "PRESIDENT",
        name: `${MARK} public-bruno`,
        email: `${MARK}-bruno-${stamp}@example.invalid`,
        isActive: true,
      },
    ]);
    await db.insert(committeeMember).values({
      committeeId: activeCommittee.id,
      userId: publicUserId,
      role: "member",
      title: "Founding Chair",
      name: `${MARK} public-bruno`,
      email: `${MARK}-bruno-${stamp}@example.invalid`,
      isActive: true,
    });

    const profile = await getPublicProfile(publicUserId);
    expect(profile).not.toBeNull();

    const chapterAffiliation = profile!.affiliations.find((a) => a.unitId === activeChapter.id);
    expect(chapterAffiliation).toBeDefined();
    expect(chapterAffiliation?.kind).toBe("chapter");
    expect(chapterAffiliation?.unitName).toBe(`${MARK} Active Chapter`);
    expect(chapterAffiliation?.title).toBe("President");

    const committeeAffiliation = profile!.affiliations.find((a) => a.unitId === activeCommittee.id);
    expect(committeeAffiliation).toBeDefined();
    expect(committeeAffiliation?.kind).toBe("committee");
    expect(committeeAffiliation?.title).toBe("Founding Chair");

    // INACTIVE units never surface on a public profile.
    expect(profile!.affiliations.find((a) => a.unitId === inactiveChapter.id)).toBeUndefined();
  });

  test("/members/[id] is not found for a non-opted-in user", async () => {
    const hidden = await renderProfilePage(privateUserId);
    expect(hidden.element).toBeNull();
    expect(notFoundDigest(hidden.error)).toBe(true);

    const publicRender = await renderProfilePage(publicUserId);
    expect(publicRender.error).toBeNull();
    expect(publicRender.element).not.toBeNull();
  });

  test("/members/[id] is not found for a missing id", async () => {
    const missing = await renderProfilePage(`no-such-id-${RUN_ID}`);
    expect(missing.element).toBeNull();
    expect(notFoundDigest(missing.error)).toBe(true);
  });

  test("opt-in persists through the better-auth profile update path", async () => {
    const email = `pp-toggle-${RUN_ID}@example.test`;
    const username = `pp-toggle-${RUN_ID}`;

    const signUp = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "10.28.28.7",
        },
        body: JSON.stringify({
          email,
          password: "TestPassw0rd!",
          name: `${MARK} Toggle`,
          username,
        }),
      }),
    );
    const signUpBody = (await signUp.json()) as { user?: { id: string } };
    expect(signUp.ok).toBe(true);
    expect(signUpBody.user?.id).toBeString();
    const toggleUserId = signUpBody.user!.id;
    seededUserIds.push(toggleUserId);

    const cookie = signUp.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

    // Default off right after sign-up (D7: opt-in, not opt-out).
    const [fresh] = await db
      .select({ profilePublic: user.profilePublic })
      .from(user)
      .where(eq(user.id, toggleUserId));
    expect(fresh.profilePublic).toBe(false);

    // The dashboard toggle persists through the same updateUser path the
    // dashboard action uses (auth.api.updateUser → POST /api/auth/update-user).
    const update = await auth.handler(
      new Request("http://localhost:3000/api/auth/update-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          "x-forwarded-for": "10.28.28.7",
        },
        body: JSON.stringify({ profilePublic: true }),
      }),
    );
    expect(update.ok).toBe(true);

    const [afterOptIn] = await db
      .select({ profilePublic: user.profilePublic })
      .from(user)
      .where(eq(user.id, toggleUserId));
    expect(afterOptIn.profilePublic).toBe(true);

    // ...and the service starts surfacing the profile.
    const profile = await getPublicProfile(toggleUserId);
    expect(profile?.id).toBe(toggleUserId);
  });
});

describe("UI-30 linked entities", () => {
  test("organizer credit: name/avatar for everyone, link flag only when opted in", async () => {
    const privateCredit = await getOrganizerCredit(privateUserId);
    expect(privateCredit).not.toBeNull();
    expect(privateCredit?.profilePublic).toBe(false);
    expect(privateCredit?.name).toBe(`${MARK} private-anna`);

    const publicCredit = await getOrganizerCredit(publicUserId);
    expect(publicCredit).not.toBeNull();
    expect(publicCredit?.profilePublic).toBe(true);
    expect(publicCredit?.name).toBe(`${MARK} public-bruno`);

    assertNeverPublic([privateCredit, publicCredit], [`${MARK}@`, `fake-hash-${MARK}`]);
  });

  test("company link resolves the website only when the schema has one", async () => {
    const stamp = crypto.randomUUID().slice(0, 8);
    const [withWebsite] = await db
      .insert(company)
      .values({
        name: `company-${MARK}-${stamp}`,
        displayName: `${MARK} Company`,
        website: "https://example.com/about",
      })
      .returning({ id: company.id });
    seededCompanyIds.push(withWebsite.id);

    const [withoutWebsite] = await db
      .insert(company)
      .values({
        name: `company-plain-${MARK}-${stamp}`,
        displayName: `${MARK} Plain Company`,
        website: null,
      })
      .returning({ id: company.id });
    seededCompanyIds.push(withoutWebsite.id);

    expect(await getCompanyLinkTarget(withWebsite.id)).toBe("https://example.com/about");
    expect(await getCompanyLinkTarget(withoutWebsite.id)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function renderProfilePage(id: string): Promise<{
  element: unknown;
  error: unknown;
}> {
  try {
    const element = await MemberProfilePage({ params: Promise.resolve({ id }) });
    return { element, error: null };
  } catch (error) {
    return { element: null, error };
  }
}

function notFoundDigest(error: unknown): boolean {
  const digest = (error as { digest?: string } | null)?.digest;
  // Next throws `notFound()` as an error carrying a 404 digest
  // ("NEXT_HTTP_ERROR_FALLBACK;404" in Next 16; older builds used
  // "NEXT_NOT_FOUND").
  return (
    typeof digest === "string" &&
    (digest.includes("NEXT_HTTP_ERROR_FALLBACK;404") || digest.includes("NEXT_NOT_FOUND"))
  );
}
