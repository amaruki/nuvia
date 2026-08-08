/**
 * Chapter reads — paginated list with CSV filters/search, and single-chapter
 * fetch with leadership and sub-chapter population.
 */

import { and, asc, count, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { chapter, chapterMember } from "@/db/schema";
import type { Chapter, ChapterStatus } from "@/types/chapter.types";
import { toUiChapter, UI_TO_DB_STATUS } from "./mappers";
import { loadMembersByChapter, toUiLeadership } from "./membership";
import type { ChapterListFilters, DbChapterStatus, Paginated } from "./types";

function paginate(page?: number, limit?: number): { page: number; limit: number; offset: number } {
  const safePage = Math.max(1, Math.trunc(page ?? 1));
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit ?? 20)));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function csvValues(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function buildListWhere(filters: ChapterListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  const statuses = csvValues(filters.status)
    ?.map((value) => UI_TO_DB_STATUS[value as ChapterStatus])
    .filter((value): value is DbChapterStatus => value !== undefined);
  if (statuses && statuses.length > 0) {
    clauses.push(inArray(chapter.status, statuses));
  }

  const regions = csvValues(filters.region);
  if (regions) clauses.push(inArray(chapter.region, regions));

  const countries = csvValues(filters.country);
  if (countries) clauses.push(inArray(chapter.country, countries));

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    const searchClause = or(
      ilike(chapter.name, term),
      ilike(chapter.displayName, term),
      ilike(chapter.city, term),
      ilike(chapter.region, term),
    );
    if (searchClause) clauses.push(searchClause);
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export async function listChapters(filters: ChapterListFilters = {}): Promise<Paginated<Chapter>> {
  const { page, limit, offset } = paginate(filters.page, filters.limit);
  const where = buildListWhere(filters);

  const [rows, totalRows] = await Promise.all([
    db.select().from(chapter).where(where).orderBy(asc(chapter.name)).limit(limit).offset(offset),
    db.select({ value: count() }).from(chapter).where(where),
  ]);
  const total = totalRows[0]?.value ?? 0;

  // One batched roster fetch for the page; the dashboard filters and
  // overview cards both read leadership off the listed chapters.
  const membersByChapter = await loadMembersByChapter(rows.map((row) => row.id));

  const items = rows.map((row) =>
    toUiChapter(row, (membersByChapter.get(row.id) ?? []).map(toUiLeadership), []),
  );

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const row = await db.select().from(chapter).where(eq(chapter.id, id)).limit(1);
  if (row.length === 0) return null;

  const [memberRows, subRows] = await Promise.all([
    db
      .select()
      .from(chapterMember)
      .where(eq(chapterMember.chapterId, id))
      .orderBy(asc(chapterMember.role), asc(chapterMember.name)),
    db
      .select({ id: chapter.id })
      .from(chapter)
      .where(eq(chapter.parentChapterId, id))
      .orderBy(asc(chapter.name)),
  ]);

  return toUiChapter(
    row[0],
    memberRows.map(toUiLeadership),
    subRows.map((sub) => sub.id),
  );
}
