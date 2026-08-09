/**
 * Content analytics aggregates (UI-23) — volume by type, publication
 * cadence, and category usage, all computed from the `content` and
 * `content_categories` tables. Rows in the DELETED status never count;
 * cadence buckets only PUBLISHED items with a real publishedAt.
 */

import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { content, contentCategory } from "@/db/schema";
import {
  eachUtcMonth,
  eachUtcWeek,
  utcMonthKey,
  utcMonthLabel,
  utcWeekLabel,
  utcWeekStart,
} from "./analytics-range";

const DAY_MS = 86_400_000;
const DEFAULT_CADENCE_DAYS = 90;
const CONTENT_SCAN_ROWS = 10_000;
const TOP_CATEGORY_COUNT = 8;
/** Windows wider than this bucket cadence by month instead of week. */
const WEEK_BUCKET_MAX_DAYS = 120;

export interface ContentTypeCount {
  type: string;
  count: number;
}

export interface ContentCadencePoint {
  period: string;
  label: string;
  published: number;
}

export interface ContentCategoryUsage {
  name: string;
  count: number;
}

export interface ContentAnalytics {
  /** Non-deleted content rows. */
  total: number;
  published: number;
  drafts: number;
  byType: ContentTypeCount[];
  /** Publication buckets across the window; empty months/weeks are included. */
  cadence: ContentCadencePoint[];
  cadenceBucket: "week" | "month";
  topCategories: ContentCategoryUsage[];
}

export async function getContentAnalytics(opts?: {
  since?: Date;
  now?: Date;
}): Promise<ContentAnalytics> {
  const now = opts?.now ?? new Date();
  const since = opts?.since ?? new Date(now.getTime() - DEFAULT_CADENCE_DAYS * DAY_MS);
  const windowDays = (now.getTime() - since.getTime()) / DAY_MS;
  const cadenceBucket: "week" | "month" = windowDays > WEEK_BUCKET_MAX_DAYS ? "month" : "week";

  const [rows, publishedRows] = await Promise.all([
    db
      .select({ type: content.type, status: content.status, categoryId: content.categoryId })
      .from(content)
      .limit(CONTENT_SCAN_ROWS),
    db
      .select({ publishedAt: content.publishedAt })
      .from(content)
      .where(and(eq(content.status, "PUBLISHED"), gte(content.publishedAt, since)))
      .limit(CONTENT_SCAN_ROWS),
  ]);

  let total = 0;
  let published = 0;
  let drafts = 0;
  const typeCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  let uncategorized = 0;

  for (const row of rows) {
    if (row.status === "DELETED") continue;
    total += 1;
    if (row.status === "PUBLISHED") published += 1;
    if (row.status === "DRAFT") drafts += 1;
    typeCounts.set(row.type, (typeCounts.get(row.type) ?? 0) + 1);
    if (row.categoryId) {
      categoryCounts.set(row.categoryId, (categoryCounts.get(row.categoryId) ?? 0) + 1);
    } else {
      uncategorized += 1;
    }
  }

  const byType: ContentTypeCount[] = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Cadence — continuous bucket series so an empty stretch renders as zero.
  const cadence: ContentCadencePoint[] = [];
  if (cadenceBucket === "month") {
    const counts = new Map<string, number>();
    for (const row of publishedRows) {
      if (!row.publishedAt) continue;
      const key = utcMonthKey(row.publishedAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const key of eachUtcMonth(since, now)) {
      cadence.push({ period: key, label: utcMonthLabel(key), published: counts.get(key) ?? 0 });
    }
  } else {
    const counts = new Map<number, number>();
    for (const row of publishedRows) {
      if (!row.publishedAt) continue;
      const start = utcWeekStart(row.publishedAt).getTime();
      counts.set(start, (counts.get(start) ?? 0) + 1);
    }
    for (const start of eachUtcWeek(since, now)) {
      cadence.push({
        period: new Date(start).toISOString(),
        label: utcWeekLabel(new Date(start)),
        published: counts.get(start) ?? 0,
      });
    }
  }

  // Top categories — resolve display names for the counted ids only.
  const topCategories: ContentCategoryUsage[] = [];
  if (categoryCounts.size > 0) {
    const categoryRows = await db
      .select({ id: contentCategory.id, displayName: contentCategory.displayName })
      .from(contentCategory)
      .where(inArray(contentCategory.id, [...categoryCounts.keys()]));
    const namesById = new Map(categoryRows.map((row) => [row.id, row.displayName]));
    for (const [categoryId, count] of categoryCounts) {
      topCategories.push({ name: namesById.get(categoryId) ?? "Unknown category", count });
    }
  }
  if (uncategorized > 0) {
    topCategories.push({ name: "Uncategorized", count: uncategorized });
  }
  topCategories.sort((a, b) => b.count - a.count);

  return {
    total,
    published,
    drafts,
    byType,
    cadence,
    cadenceBucket,
    topCategories: topCategories.slice(0, TOP_CATEGORY_COUNT),
  };
}
