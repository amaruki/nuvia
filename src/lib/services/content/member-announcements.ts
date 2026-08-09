/**
 * UI-32 — Member announcement outlets (decision D11: the content module owns
 * announcements). Two audience-facing read paths over the `content` table's
 * ANNOUNCEMENT rows, modeled on public-news.ts (UI-26). The security boundary
 * lives HERE, not in the content:read-gated admin API:
 *
 *   1. listMemberAnnouncements — the /dashboard/announcements member inbox:
 *      PUBLISHED announcements whose visibility is MEMBERS_ONLY or wider
 *      (i.e. PUBLIC) and whose publishedAt has passed, newest first,
 *      paginated.
 *   2. listEventAnnouncements — the event-page banner: the same audience
 *      gate (narrowed to PUBLIC for anonymous viewers of public event
 *      pages), plus event targeting and expiry.
 *
 * SAFETY (same discipline as public-news.ts):
 *   - the filter admits only audience-ready rows;
 *   - the projections are field allow-lists — the `metadata` blob
 *     (backoffice UI payloads), author emails, and internal
 *     status/visibility columns are never selected, so they cannot leak.
 *
 * GAP (UI-32, reported): the content schema has NO event-targeting field —
 * no eventId/relatedEventId column, and createAnnouncementSchema accepts no
 * such key (zod strips unknown properties). The closest real mechanism is
 * the existing `metadata.ui` targeting slot the backoffice already uses for
 * chapters and committees (targetChapters/targetCommittees), so
 * listEventAnnouncements keys on `metadata.ui.targetEventId` and honors
 * `metadata.ui.expiresAt`. Until the backoffice learns to write that key
 * (one createAnnouncementSchema field + form control — deliberately NOT a
 * schema change this wave), no row can carry it and event banners render
 * empty. tests/member-announcements.test.ts proves the read path against
 * directly-seeded rows.
 */

import { and, count, desc, eq, gt, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { content, user } from "@/db/schema";

// ── Filters ─────────────────────────────────────────────────────────────────

/**
 * Audience-ready conditions shared by both read paths. "Member visibility"
 * means PUBLIC or MEMBERS_ONLY per the planning matrix; for anonymous
 * viewers only PUBLIC qualifies. PREMIUM_MEMBERS is deliberately excluded —
 * the inbox spec is "MEMBERS_ONLY or wider" — and a premium member simply
 * sees the same member feed (narrower rows stay backoffice-only).
 */
function audienceReadyConditions(viewerIsAuthenticated: boolean): SQL[] {
  return [
    eq(content.type, "ANNOUNCEMENT"),
    eq(content.status, "PUBLISHED"),
    inArray(content.visibility, viewerIsAuthenticated ? ["PUBLIC", "MEMBERS_ONLY"] : ["PUBLIC"]),
    lte(content.publishedAt, new Date()),
  ];
}

/**
 * Event targeting: metadata.ui.targetEventId (the gap mechanism, see module
 * header). The slot is stored by jsonb, so this reads the text out in SQL.
 */
const targetEventId = sql<string | null>`${content.metadata}->'ui'->>'targetEventId'`;

/**
 * Banner expiry: metadata.ui.expiresAt is stored as an ISO-8601 UTC string
 * (buildUiPayload writes .toISOString()), so lexicographic comparison
 * against another ISO string is chronological.
 */
const bannerExpiresAt = sql<string | null>`${content.metadata}->'ui'->>'expiresAt'`;

/**
 * Same join/public-projection shape as public-news.ts: author resolves only
 * while the user row is not soft-deleted, so display identity never leaks
 * off a deleted account.
 */
const authorJoin = and(eq(content.authorId, user.id), isNull(user.deletedAt));

// ── Pagination (same clamp semantics as public-news.paginate) ───────────────

function paginate(page: number | undefined, limit: number | undefined) {
  const p = Math.max(1, Math.trunc(page ?? 1));
  const l = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: p, limit: l, offset: (p - 1) * l };
}

// ── Projections ─────────────────────────────────────────────────────────────

export interface MemberAnnouncementAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface MemberAnnouncement {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  publishedAt: Date;
  author: MemberAnnouncementAuthor | null;
}

export interface PaginatedMemberAnnouncements {
  items: MemberAnnouncement[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Banner projection is deliberately minimal: title + excerpt are all a
 * banner renders, and no link is emitted — MEMBERS_ONLY rows have no public
 * detail route to link to, so a link would be dishonest for them. */
export interface EventAnnouncement {
  id: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date;
}

type InboxRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  publishedAt: Date | null;
  author_id: string | null;
  author_name: string | null;
  author_profile_photo: string | null;
};

type BannerRow = {
  id: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
};

function toAuthor(row: {
  author_id: string | null;
  author_name: string | null;
  author_profile_photo: string | null;
}): MemberAnnouncementAuthor | null {
  if (!row.author_name) return null;
  return {
    id: row.author_id ?? "",
    name: row.author_name,
    image: row.author_profile_photo,
  };
}

function toMemberAnnouncement(row: InboxRow): MemberAnnouncement {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    // PUBLISHED rows in this feed always carry publishedAt (the date gate
    // already filtered on it); the schema keeps it nullable, so fall back.
    publishedAt: row.publishedAt ?? new Date(0),
    author: toAuthor(row),
  };
}

function toEventAnnouncement(row: BannerRow): EventAnnouncement {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.publishedAt ?? new Date(0),
  };
}

// ── Read paths ──────────────────────────────────────────────────────────────

/**
 * Member inbox feed. Ring-1: every authenticated user may read it (the proxy
 * gates /dashboard/** to login; no nav entry or role is required). Filters
 * strictly on status PUBLISHED + publishedAt passed + member visibility —
 * per the UI-32 contract — and projects only the member-safe allow-list.
 *
 * Note: metadata.ui.expiresAt is deliberately NOT a filter here. The inbox
 * is the announcement archive (past notifications stay readable); expiry
 * retires event banners only.
 */
export async function listMemberAnnouncements(filters: {
  page?: number;
  limit?: number;
}): Promise<PaginatedMemberAnnouncements> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = and(...audienceReadyConditions(true));

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: content.id,
        title: content.title,
        slug: content.slug,
        excerpt: content.excerpt,
        content: content.content,
        publishedAt: content.publishedAt,
        author_id: user.id,
        author_name: user.name,
        author_profile_photo: user.profilePhoto,
      })
      .from(content)
      .leftJoin(user, authorJoin)
      .where(where)
      .orderBy(desc(content.publishedAt), desc(content.id))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(content).where(where),
  ]);

  const total = totalResult[0]?.value ?? 0;
  return {
    items: rows.map(toMemberAnnouncement),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Announcements targeting a specific event, for the event-page banner.
 *
 * viewer.authenticated narrows visibility: public event pages are readable
 * anonymously, so anonymous viewers get PUBLIC rows only; signed-in viewers
 * additionally get MEMBERS_ONLY rows. Expired rows (metadata.ui.expiresAt in
 * the past) are retired even while they stay PUBLISHED. Rows are ordered
 * newest first and capped at 5 so a mis-seeded stack cannot overwhelm the
 * event detail — the cap is announced here, not silent.
 */
export async function listEventAnnouncements(
  eventId: string,
  viewer: { authenticated: boolean },
): Promise<EventAnnouncement[]> {
  if (!eventId) return [];

  const where = and(
    ...audienceReadyConditions(viewer.authenticated),
    eq(targetEventId, eventId),
    or(isNull(bannerExpiresAt), gt(bannerExpiresAt, new Date().toISOString())),
  );

  const rows = await db
    .select({
      id: content.id,
      title: content.title,
      excerpt: content.excerpt,
      publishedAt: content.publishedAt,
    })
    .from(content)
    .where(where)
    .orderBy(desc(content.publishedAt), desc(content.id))
    .limit(5);

  return rows.map(toEventAnnouncement);
}
