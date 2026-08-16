import { eq, getTableColumns, ilike } from "drizzle-orm";

import { db } from "@/db/client";
import { content, contentCategory, user } from "@/db/schema";

import {
  COLLECTION_DEFAULT_CATEGORY,
  COLLECTION_DEFAULT_UI_TYPE,
  DB_STATUS_TO_UI,
  DB_VISIBILITY_TO_UI,
  type AuthorFragment,
  type ContentCollection,
  type ContentInput,
  type ContentRow,
  type UiStatus,
  type UiVisibility,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 200) || "untitled"
  );
}

export function toDate(value: string | number | Date | null | undefined): Date | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function slugExists(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.slug, slug))
    .limit(1);
  return rows.length > 0;
}

export async function resolveAuthorId(
  requestedId: string | undefined,
  actorId: string,
): Promise<string> {
  if (requestedId) {
    const rows = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, requestedId))
      .limit(1);
    if (rows.length > 0) return requestedId;
  }
  return actorId;
}

export async function resolveCategoryId(name: string | undefined): Promise<string | null> {
  if (!name) return null;
  const rows = await db
    .select({ id: contentCategory.id })
    .from(contentCategory)
    .where(ilike(contentCategory.name, name.trim()))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Strip undefined values so metadata JSON stays compact. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result as Partial<T>;
}

/** Extract the UI round-trip payload from validated input. */
export function buildUiPayload(input: ContentInput): Record<string, unknown> {
  return compact({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    status: input.status,
    visibility: input.visibility,
    authorId: input.authorId,
    coAuthorIds: input.coAuthorIds,
    reviewerId: input.reviewerId,
    tagIds: input.tagIds,
    type: input.type,
    category: input.category,
    difficulty: input.difficulty,
    format: input.format,
    featuredImage: input.featuredImage,
    gallery: input.gallery,
    attachments: input.attachments,
    seo: input.seo,
    publishedAt: toDate(input.publishedAt as string | undefined)?.toISOString(),
    scheduledFor: toDate(input.scheduledFor as string | undefined)?.toISOString(),
    reviewedAt: toDate(input.reviewedAt as string | undefined)?.toISOString(),
    expiresAt: toDate(input.expiresAt as string | undefined)?.toISOString(),
    allowedRoles: input.allowedRoles,
    allowedChapters: input.allowedChapters,
    allowedCommittees: input.allowedCommittees,
    targetAudience: input.targetAudience,
    targetChapters: input.targetChapters,
    targetCommittees: input.targetCommittees,
    isUrgent: input.isUrgent,
    requiresAcknowledgment: input.requiresAcknowledgment,
    acknowledgmentCount: input.acknowledgmentCount,
    sendEmailNotification: input.sendEmailNotification,
    sendPushNotification: input.sendPushNotification,
    displayOnHomepage: input.displayOnHomepage,
    displayInDashboard: input.displayInDashboard,
    commentsEnabled: input.commentsEnabled,
    sharingEnabled: input.sharingEnabled,
    downloadEnabled: input.downloadEnabled,
    isFeatured: input.isFeatured,
    isPinned: input.isPinned,
    priority: input.priority,
    version: input.version,
    language: input.language,
  });
}

function buildAuthor(
  row: AuthorFragment,
  uiAuthorId?: string,
  includeEmail?: boolean,
): Record<string, unknown> {
  const name = row.author_name ?? row.author_email ?? "Unknown Author";
  return {
    id: uiAuthorId ?? "",
    name,
    username: name.toLowerCase().replace(/\s+/g, "."),
    // Issue #8: author emails are PII; only editorial callers (content
    // publishers/managers) receive them. Member-tier readers get none.
    email: includeEmail ? (row.author_email ?? "") : "",
    avatarUrl: row.author_image ?? row.author_profile_photo ?? undefined,
    role: row.author_role ?? undefined,
  };
}

const zeroMetrics = {
  views: 0,
  downloads: 0,
  shares: 0,
  comments: 0,
  likes: 0,
  bookmarks: 0,
  averageReadTime: 0,
  bounceRate: 0,
  engagementScore: 0,
};

/** Map a joined content row into the UI item shape (plain JSON-safe dates). */
export function rowToItem(
  row: ContentRow,
  collection: ContentCollection,
  options: { includeAuthorEmail?: boolean } = {},
): Record<string, unknown> {
  const metadata = (row.metadata ?? {}) as { ui?: Record<string, unknown> };
  const ui = metadata.ui ?? {};
  const uiStatus = (ui.status as UiStatus | undefined) ?? DB_STATUS_TO_UI[row.status] ?? "draft";
  const uiVisibility =
    (ui.visibility as UiVisibility | undefined) ?? DB_VISIBILITY_TO_UI[row.visibility] ?? "public";
  const body = row.content ?? "";
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  const item: Record<string, unknown> = {
    ...ui,
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? ui.excerpt ?? "",
    content: body,
    status: uiStatus,
    visibility: uiVisibility,
    type: ui.type ?? COLLECTION_DEFAULT_UI_TYPE[collection],
    category: ui.category ?? row.category_name ?? COLLECTION_DEFAULT_CATEGORY[collection],
    author: buildAuthor(row, row.authorId ?? undefined, options.includeAuthorEmail),
    tags: Array.isArray(row.tags)
      ? row.tags.map((name) => ({ id: name, name, color: "#6B7280", count: 0 }))
      : [],
    featuredImage: row.featuredImage ?? undefined,
    publishedAt: row.publishedAt?.toISOString() ?? undefined,
    scheduledFor: ui.scheduledFor ?? undefined,
    reviewedAt: (ui.reviewedAt as string | undefined) ?? undefined,
    lastModified: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    readTime: Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
    estimatedReadingSpeed: 200,
    seo: ui.seo ?? { title: row.title, description: row.excerpt ?? "", keywords: [] },
    metrics: ui.metrics ?? zeroMetrics,
    version: (ui.version as number | undefined) ?? 1,
    language: (ui.language as string | undefined) ?? "en",
    commentsEnabled: (ui.commentsEnabled as boolean | undefined) ?? true,
    sharingEnabled: (ui.sharingEnabled as boolean | undefined) ?? true,
    downloadEnabled: (ui.downloadEnabled as boolean | undefined) ?? collection === "publications",
    isFeatured: (ui.isFeatured as boolean | undefined) ?? false,
    isPinned: (ui.isPinned as boolean | undefined) ?? false,
    priority: (ui.priority as number | undefined) ?? 50,
    allowedRoles: (ui.allowedRoles as string[] | undefined) ?? [],
    allowedChapters: (ui.allowedChapters as string[] | undefined) ?? [],
    allowedCommittees: (ui.allowedCommittees as string[] | undefined) ?? [],
  };

  if (collection === "announcements") {
    item.targetAudience = (ui.targetAudience as string | undefined) ?? "all_members";
    item.targetChapters = (ui.targetChapters as string[] | undefined) ?? [];
    item.targetCommittees = (ui.targetCommittees as string[] | undefined) ?? [];
    item.expiresAt = (ui.expiresAt as string | undefined) ?? undefined;
    item.isUrgent = (ui.isUrgent as boolean | undefined) ?? false;
    item.requiresAcknowledgment = (ui.requiresAcknowledgment as boolean | undefined) ?? false;
    item.acknowledgmentCount = (ui.acknowledgmentCount as number | undefined) ?? 0;
    item.sendEmailNotification = (ui.sendEmailNotification as boolean | undefined) ?? false;
    item.sendPushNotification = (ui.sendPushNotification as boolean | undefined) ?? false;
    item.displayOnHomepage = (ui.displayOnHomepage as boolean | undefined) ?? false;
    item.displayInDashboard = (ui.displayInDashboard as boolean | undefined) ?? true;
  }

  return item;
}

export async function selectContentRow(id: string): Promise<ContentRow | null> {
  const rows = await db
    .select({
      ...getTableColumns(content),
      category_name: contentCategory.name,
      author_name: user.name,
      author_email: user.email,
      author_image: user.image,
      author_profile_photo: user.profilePhoto,
      author_role: user.role,
    })
    .from(content)
    .leftJoin(contentCategory, eq(content.categoryId, contentCategory.id))
    .leftJoin(user, eq(content.authorId, user.id))
    .where(eq(content.id, id))
    .limit(1);
  return (rows[0] as ContentRow | undefined) ?? null;
}
