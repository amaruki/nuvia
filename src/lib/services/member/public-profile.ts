/**
 * UI-28 — public member directory & profile (decision D7: opt-in,
 * privacy-by-default).
 *
 * This is the ONLY read path allowed to surface user rows on public pages.
 * It deliberately does not reuse the admin member projection
 * (`src/lib/services/member/columns.ts`): that projection carries email,
 * emailVerified and role, all of which sit on the plan's never-public list
 * (exposure audit: `users.email`, `emailVerified`, `passwordHash`,
 * `emailVerificationToken`, `role`, `deletedAt`, auth internals). Every
 * function below selects an explicit allow-list of columns; nothing is ever
 * passed through wholesale.
 *
 * Visibility rules:
 *  - a user appears in the directory / has a public profile only with
 *    `profilePublic = true` (default false) and `deletedAt IS NULL`
 *  - RBAC `users.role` is never rendered; the organizational role shown on a
 *    profile is the chapter/committee leadership title (skipped when the
 *    member holds none)
 *  - chapter affiliations only from ACTIVE chapters, committee affiliations
 *    only from active committees; the join row must be active
 */
import { and, asc, count, eq, ilike, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db/client";
import { chapter, chapterMember, committee, committeeMember, user } from "@/db/schema";

// ---------------------------------------------------------------------------
// Public projection types
// ---------------------------------------------------------------------------

/** A social/external link, normalized from both stored shapes. */
export type PublicExternalLink = {
  platform: string;
  url: string;
  /** Display handle/label; absent when the member stored none. */
  label?: string;
};

/** Chapter or committee membership shown on a public profile. */
export type PublicAffiliation = {
  kind: "chapter" | "committee";
  unitId: string;
  unitName: string;
  /** Leadership title ("President", "Founding Chair"); null when none. */
  title: string | null;
};

/** Directory card projection — intentionally small. */
export type PublicMemberCard = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  affiliations: PublicAffiliation[];
};

/** Full public profile projection (directory card + links + join date). */
export type PublicProfile = PublicMemberCard & {
  externalLinks: PublicExternalLink[];
  joinedAt: Date;
};

export type PublicMemberListResult = {
  members: PublicMemberCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** UI-30 organizer credit: name/avatar always, profile link only when opted in. */
export type OrganizerCredit = {
  id: string;
  name: string;
  avatar: string | null;
  /** true → /members/[id] exists and may be linked. */
  profilePublic: boolean;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Columns a public reader may ever touch, and nothing else. */
const PUBLIC_USER_COLUMNS = {
  id: user.id,
  name: user.name,
  displayName: user.displayName,
  image: user.image,
  profilePhoto: user.profilePhoto,
  bio: user.bio,
  externalLinks: user.externalLinks,
  createdAt: user.createdAt,
} as const;

const visibleUser = and(eq(user.profilePublic, true), isNull(user.deletedAt));

export async function listPublicMembers(
  params: {
    query?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<PublicMemberListResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 24)));

  const trimmedQuery = params.query?.trim();
  const conditions = trimmedQuery
    ? and(
        visibleUser,
        or(
          ilike(user.name, `%${trimmedQuery}%`),
          ilike(user.displayName, `%${trimmedQuery}%`),
          ilike(user.bio, `%${trimmedQuery}%`),
        ),
      )
    : visibleUser;

  const [totalRow] = await db.select({ value: count() }).from(user).where(conditions);
  const total = totalRow?.value ?? 0;

  const rows =
    total === 0
      ? []
      : await db
          .select(PUBLIC_USER_COLUMNS)
          .from(user)
          .where(conditions)
          .orderBy(asc(user.displayName), asc(user.name), asc(user.id))
          .offset((page - 1) * limit)
          .limit(limit);

  const affiliationsByUser = await loadAffiliations(rows.map((row) => row.id));

  return {
    members: rows.map((row) => toCard(row, affiliationsByUser.get(row.id) ?? [])),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const [row] = await db
    .select(PUBLIC_USER_COLUMNS)
    .from(user)
    .where(and(eq(user.id, id), visibleUser));

  if (!row) return null;

  const affiliationsByUser = await loadAffiliations([row.id]);
  return {
    ...toCard(row, affiliationsByUser.get(row.id) ?? []),
    externalLinks: parseExternalLinks(row.externalLinks),
    joinedAt: row.createdAt,
  };
}

/**
 * UI-30: credit for an event organizer. Returned regardless of opt-in — the
 * organizer's name stays visible on their event — but `profilePublic` tells
 * the caller whether the name may link to /members/[id].
 */
export async function getOrganizerCredit(
  organizerId: string | null | undefined,
): Promise<OrganizerCredit | null> {
  if (!organizerId) return null;

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      image: user.image,
      profilePhoto: user.profilePhoto,
      profilePublic: user.profilePublic,
    })
    .from(user)
    .where(and(eq(user.id, organizerId), isNull(user.deletedAt)));

  if (!row) return null;

  return {
    id: row.id,
    name: row.displayName ?? row.name,
    avatar: row.image ?? row.profilePhoto ?? null,
    profilePublic: row.profilePublic,
  };
}

// ---------------------------------------------------------------------------
// Affiliations (batched per page so the directory stays O(1) queries + 2)
// ---------------------------------------------------------------------------

/** Chapter officer roles → display titles. ADMIN/MEMBER carry no title. */
const CHAPTER_LEADERSHIP_TITLES: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
};

/** Committee roles → display titles. A plain "member" carries no title. */
const COMMITTEE_LEADERSHIP_TITLES: Record<string, string> = {
  chair: "Chair",
  co_chair: "Co-Chair",
  secretary: "Secretary",
  treasurer: "Treasurer",
  advisor: "Advisor",
};

async function loadAffiliations(userIds: string[]): Promise<Map<string, PublicAffiliation[]>> {
  const byUser = new Map<string, PublicAffiliation[]>();
  if (userIds.length === 0) return byUser;

  const push = (userId: string, affiliation: PublicAffiliation): void => {
    const list = byUser.get(userId);
    if (list) {
      list.push(affiliation);
    } else {
      byUser.set(userId, [affiliation]);
    }
  };

  const chapterRows = await db
    .select({
      userId: chapterMember.userId,
      role: chapterMember.role,
      title: chapterMember.title,
      unitId: chapter.id,
      unitName: chapter.displayName,
    })
    .from(chapterMember)
    .innerJoin(chapter, eq(chapter.id, chapterMember.chapterId))
    .where(
      and(
        inArray(chapterMember.userId, userIds),
        eq(chapterMember.isActive, true),
        eq(chapter.status, "ACTIVE"),
      ),
    );

  for (const row of chapterRows) {
    if (!row.userId) continue;
    push(row.userId, {
      kind: "chapter",
      unitId: row.unitId,
      unitName: row.unitName,
      title: row.title ?? CHAPTER_LEADERSHIP_TITLES[row.role] ?? null,
    });
  }

  const committeeRows = await db
    .select({
      userId: committeeMember.userId,
      role: committeeMember.role,
      title: committeeMember.title,
      unitId: committee.id,
      unitName: committee.displayName,
    })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .where(
      and(
        inArray(committeeMember.userId, userIds),
        eq(committeeMember.isActive, true),
        eq(committee.status, "active"),
      ),
    );

  for (const row of committeeRows) {
    if (!row.userId) continue;
    push(row.userId, {
      kind: "committee",
      unitId: row.unitId,
      unitName: row.unitName,
      title: row.title ?? COMMITTEE_LEADERSHIP_TITLES[row.role] ?? null,
    });
  }

  for (const affiliations of byUser.values()) {
    affiliations.sort((a, b) => a.unitName.localeCompare(b.unitName));
  }
  return byUser;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

interface PublicUserRowShape {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
  profilePhoto: string | null;
  bio: string | null;
  externalLinks: unknown;
  createdAt: Date;
}

function toCard(row: PublicUserRowShape, affiliations: PublicAffiliation[]): PublicMemberCard {
  return {
    id: row.id,
    name: row.displayName ?? row.name,
    avatar: row.image ?? row.profilePhoto ?? null,
    bio: row.bio,
    affiliations,
  };
}

/**
 * Two shapes exist in the column: the newer array of
 * `{ platform, url, username }` objects written by the dashboard social-links
 * form, and a legacy `Record<platform, string | { url, label }>`. Normalize
 * both; anything malformed is dropped rather than rendered.
 */
export function parseExternalLinks(raw: unknown): PublicExternalLink[] {
  const links: PublicExternalLink[] = [];

  const pushLink = (platform: unknown, url: unknown, label: unknown): void => {
    if (typeof platform !== "string" || typeof url !== "string") return;
    if (!/^(https?|mailto):/i.test(url)) return;
    links.push({
      platform,
      url,
      ...(typeof label === "string" && label.length > 0 ? { label } : {}),
    });
  };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item === null || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      pushLink(record.platform, record.url, record.username ?? record.label);
    }
    return links;
  }

  if (raw !== null && typeof raw === "object") {
    for (const [platform, value] of Object.entries(raw)) {
      if (typeof value === "string") {
        pushLink(platform, value, undefined);
      } else if (value !== null && typeof value === "object") {
        const record = value as Record<string, unknown>;
        pushLink(platform, record.url, record.label);
      }
    }
  }

  return links;
}
