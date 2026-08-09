/**
 * Public chapter reads — ring-0 projection for the `/chapters` pages
 * (plan item UI-29; exposure audit row "Chapters and committees"; D15).
 *
 * Audience-ready state mapping: `chapters.status` is the ChapterStatus pg
 * enum ("ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED"). ONLY "ACTIVE" is
 * audience-ready (R1); every other state stays backoffice-only.
 *
 * Ring 0 has no auth gate — these functions ARE the security boundary:
 * - The status filter lives in the SQL; the detail read re-checks it.
 * - Projections are field allow-lists (R2). Roster rows (chapter_members)
 *   contribute names/titles/roles of ACTIVE officers only: roster emails and
 *   phones are on the never-public list and are never even selected, regular
 *   MEMBER rows and inactive officers are filtered out entirely (D15:
 *   leadership names public, rosters private).
 */

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapter, chapterMember } from "@/db/schema";
import type { ChapterRole, ChapterSettings, ChapterSocialMedia } from "@/types/chapter.types";
import { toUiContactInfo, toUiSettings } from "./mappers";
import { DB_TO_UI_ROLE, ROLE_TITLE_FALLBACK } from "./membership";
import type { DbChapterRole } from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Officer roles rendered as leadership. MEMBER rows are regular roster and
 * stay private (D15). The rank orders officers for display.
 */
const LEADERSHIP_RANK: Record<string, number> = {
  PRESIDENT: 0,
  VICE_PRESIDENT: 1,
  SECRETARY: 2,
  TREASURER: 3,
  ADMIN: 4,
};

// ---------------------------------------------------------------------------
// Public projection types (field allow-lists, R2)
// ---------------------------------------------------------------------------

export interface PublicChapterLeader {
  name: string;
  title: string;
  role: ChapterRole;
}

export interface PublicChapterSummary {
  id: string;
  displayName: string;
  description?: string;
  city: string;
  region: string;
  country: string;
  memberCount: number;
  establishedDate: Date;
}

export interface PublicChapterContact {
  email: string;
  address: string;
  phone?: string;
  website?: string;
}

export interface PublicChapterMeeting {
  frequency: ChapterSettings["meetingFrequency"];
  day?: string;
  time?: string;
}

export interface PublicChapter extends PublicChapterSummary {
  state: string;
  contact: PublicChapterContact;
  meeting: PublicChapterMeeting;
  socialMedia: ChapterSocialMedia;
  leadership: PublicChapterLeader[];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Public chapter list — ACTIVE chapters only (R1), ordered by display name.
 * Called from the `/chapters` server component; never from `/api/v1`.
 */
export async function listPublicChapters(): Promise<PublicChapterSummary[]> {
  const rows = await db
    .select({
      id: chapter.id,
      displayName: chapter.displayName,
      description: chapter.description,
      city: chapter.city,
      region: chapter.region,
      country: chapter.country,
      memberCount: chapter.memberCount,
      establishedDate: chapter.establishedDate,
      createdAt: chapter.createdAt,
    })
    .from(chapter)
    .where(eq(chapter.status, "ACTIVE"))
    .orderBy(asc(chapter.displayName));

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    city: row.city ?? "",
    region: row.region ?? "",
    country: row.country ?? "",
    memberCount: row.memberCount,
    establishedDate: row.establishedDate ?? row.createdAt,
  }));
}

/**
 * Public chapter detail — returns null for unknown ids and for any chapter
 * that is not ACTIVE, so non-audience-ready units are unreachable (R1).
 */
export async function getPublicChapter(id: string): Promise<PublicChapter | null> {
  if (!UUID_RE.test(id)) return null;

  const rows = await db
    .select()
    .from(chapter)
    .where(and(eq(chapter.id, id), eq(chapter.status, "ACTIVE")))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  // Allow-listed roster read: name/title/role of active members only.
  // Emails and phones are never selected for ring 0.
  const officerRows = await db
    .select({
      name: chapterMember.name,
      title: chapterMember.title,
      role: chapterMember.role,
    })
    .from(chapterMember)
    .where(and(eq(chapterMember.chapterId, id), eq(chapterMember.isActive, true)))
    .orderBy(asc(chapterMember.name));

  const leadership: PublicChapterLeader[] = officerRows
    .filter((member) => member.role in LEADERSHIP_RANK)
    .sort((a, b) => LEADERSHIP_RANK[a.role] - LEADERSHIP_RANK[b.role])
    .map((member) => {
      const role = DB_TO_UI_ROLE[member.role as DbChapterRole] ?? "member";
      return {
        name: member.name,
        title: member.title ?? ROLE_TITLE_FALLBACK[role],
        role,
      };
    });

  const settings = toUiSettings(row.settings);
  const contactInfo = toUiContactInfo(row.contactInfo);

  return {
    id: row.id,
    displayName: row.displayName,
    ...(row.description ? { description: row.description } : {}),
    city: row.city ?? "",
    region: row.region ?? "",
    country: row.country ?? "",
    state: row.state ?? "",
    memberCount: row.memberCount,
    establishedDate: row.establishedDate ?? row.createdAt,
    contact: {
      email: contactInfo.email,
      address: contactInfo.address,
      ...(contactInfo.phone ? { phone: contactInfo.phone } : {}),
      ...(contactInfo.website ? { website: contactInfo.website } : {}),
    },
    meeting: {
      frequency: settings.meetingFrequency,
      ...(settings.meetingDay ? { day: settings.meetingDay } : {}),
      ...(settings.meetingTime ? { time: settings.meetingTime } : {}),
    },
    socialMedia: (row.socialMedia ?? {}) as ChapterSocialMedia,
    leadership,
  };
}
