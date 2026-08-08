/**
 * Membership helpers — `chapter_members` rows map to UI leadership. The DB
 * role enum is SCREAMING_SNAKE, the UI role lowercase.
 */

import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { chapterMember } from "@/db/schema";
import type { ChapterLeadership, ChapterRole } from "@/types/chapter.types";
import type { ChapterMemberRow, DbChapterRole } from "./types";

export const DB_TO_UI_ROLE: Record<DbChapterRole, ChapterRole> = {
  PRESIDENT: "president",
  VICE_PRESIDENT: "vice_president",
  SECRETARY: "secretary",
  TREASURER: "treasurer",
  ADMIN: "admin",
  MEMBER: "member",
};

export const ROLE_TITLE_FALLBACK: Record<ChapterRole, string> = {
  president: "President",
  vice_president: "Vice President",
  secretary: "Secretary",
  treasurer: "Treasurer",
  admin: "Chapter Admin",
  member: "Member",
};

export function toUiLeadership(row: ChapterMemberRow): ChapterLeadership {
  const role = DB_TO_UI_ROLE[row.role as DbChapterRole] ?? "member";
  return {
    id: row.id,
    userId: row.userId ?? "",
    name: row.name,
    email: row.email,
    role,
    title: row.title ?? ROLE_TITLE_FALLBACK[role],
    startDate: row.startDate ?? row.createdAt,
    endDate: row.endDate ?? undefined,
    isActive: row.isActive,
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
  };
}

/**
 * One batched roster fetch for a page of chapters; the dashboard filters
 * and overview cards both read leadership off the listed chapters, so this
 * avoids an N+1.
 */
export async function loadMembersByChapter(
  chapterIds: string[],
): Promise<Map<string, ChapterMemberRow[]>> {
  const membersByChapter = new Map<string, ChapterMemberRow[]>();
  if (chapterIds.length === 0) return membersByChapter;

  const memberRows = await db
    .select()
    .from(chapterMember)
    .where(inArray(chapterMember.chapterId, chapterIds));
  for (const memberRow of memberRows) {
    const bucket = membersByChapter.get(memberRow.chapterId);
    if (bucket) bucket.push(memberRow);
    else membersByChapter.set(memberRow.chapterId, [memberRow]);
  }
  return membersByChapter;
}
