import { and, asc, count, desc, eq, getTableColumns, ilike, inArray, or } from "drizzle-orm";

import { db } from "@/db/client";
import { content, contentCategory, user } from "@/db/schema";
import type {
  CategoryListQuery,
  ContentListQuery,
  CreateAnnouncementInput,
  CreateArticleInput,
  CreateCategoryInput,
  CreatePublicationInput,
  UpdateAnnouncementInput,
  UpdateArticleInput,
  UpdateCategoryInput,
  UpdatePublicationInput,
} from "@/lib/validation/content.validation";

/**
 * Content service — the single data-access layer for articles, publications,
 * and announcements (all rows live in the `content` table, discriminated by
 * the `type` column) plus the content category taxonomy.
 *
 * UI-only fields that have no dedicated column round-trip through
 * `content.metadata.ui` so clients get back exactly what they stored.
 */

export type ContentCollection = "articles" | "publications" | "announcements";

const COLLECTION_DB_TYPE: Record<ContentCollection, "ARTICLE" | "PUBLICATION" | "ANNOUNCEMENT"> = {
  articles: "ARTICLE",
  publications: "PUBLICATION",
  announcements: "ANNOUNCEMENT",
};

/**
 * Extract a postgres error code. drizzle wraps the driver error in
 * DrizzleQueryError, so walk the cause chain until a code surfaces.
 */
function pgErrorCode(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ("code" in current && typeof current.code === "string") return current.code;
    current = "cause" in current ? (current as { cause?: unknown }).cause : null;
  }
  return null;
}

const COLLECTION_DEFAULT_UI_TYPE: Record<ContentCollection, string> = {
  articles: "article",
  publications: "whitepaper",
  announcements: "system",
};

const COLLECTION_DEFAULT_CATEGORY: Record<ContentCollection, string> = {
  articles: "General",
  publications: "Reports",
  announcements: "General",
};

type UiStatus = "draft" | "review" | "published" | "archived" | "scheduled";
type UiVisibility = "public" | "members_only" | "premium_only" | "chapter_only" | "committee_only";

const UI_STATUS_TO_DB: Record<UiStatus, "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"> = {
  draft: "DRAFT",
  review: "DRAFT",
  published: "PUBLISHED",
  archived: "ARCHIVED",
  scheduled: "SCHEDULED",
};

const DB_STATUS_TO_UI: Record<string, UiStatus> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "archived",
  SCHEDULED: "scheduled",
};

const UI_VISIBILITY_TO_DB: Record<
  UiVisibility,
  "PUBLIC" | "MEMBERS_ONLY" | "PREMIUM_MEMBERS" | "SPECIFIC_ROLES" | "PRIVATE"
> = {
  public: "PUBLIC",
  members_only: "MEMBERS_ONLY",
  premium_only: "PREMIUM_MEMBERS",
  chapter_only: "SPECIFIC_ROLES",
  committee_only: "SPECIFIC_ROLES",
};

const DB_VISIBILITY_TO_UI: Record<string, UiVisibility> = {
  PUBLIC: "public",
  MEMBERS_ONLY: "members_only",
  PREMIUM_MEMBERS: "premium_only",
  SPECIFIC_ROLES: "members_only",
  PRIVATE: "public",
};

// ── Errors ──────────────────────────────────────────────────────────────────

export class ContentApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** RFC 9457 problem slug, resolved against APP_URL by src/lib/http.ts. */
    public readonly slug: string,
    public readonly title: string,
  ) {
    super(message);
    this.name = "ContentApiError";
  }

  static notFound(what = "Content"): ContentApiError {
    return new ContentApiError(`${what} not found`, 404, "not-found", "Not found");
  }

  static conflict(message: string): ContentApiError {
    return new ContentApiError(message, 409, "conflict", "Conflict");
  }

  static internal(): ContentApiError {
    return new ContentApiError(
      "An unexpected error occurred",
      500,
      "internal-error",
      "Internal server error",
    );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugify(input: string): string {
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

function toDate(value: string | number | Date | null | undefined): Date | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function slugExists(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.slug, slug))
    .limit(1);
  return rows.length > 0;
}

async function resolveAuthorId(requestedId: string | undefined, actorId: string): Promise<string> {
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

async function resolveCategoryId(name: string | undefined): Promise<string | null> {
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

type ContentInput = (
  | CreateArticleInput
  | UpdateArticleInput
  | CreatePublicationInput
  | UpdatePublicationInput
  | CreateAnnouncementInput
  | UpdateAnnouncementInput
) &
  Record<string, unknown>;

/** Extract the UI round-trip payload from validated input. */
function buildUiPayload(input: ContentInput): Record<string, unknown> {
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

type AuthorFragment = {
  author_name: string | null;
  author_email: string | null;
  author_image: string | null;
  author_profile_photo: string | null;
  author_role: string | null;
};

function buildAuthor(row: AuthorFragment, uiAuthorId?: string): Record<string, unknown> {
  const name = row.author_name ?? row.author_email ?? "Unknown Author";
  return {
    id: uiAuthorId ?? "",
    name,
    username: name.toLowerCase().replace(/\s+/g, "."),
    email: row.author_email ?? "",
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

type ContentRow = typeof content.$inferSelect & {
  category_name: string | null;
} & AuthorFragment;

/** Map a joined content row into the UI item shape (plain JSON-safe dates). */
function rowToItem(row: ContentRow, collection: ContentCollection): Record<string, unknown> {
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
    author: buildAuthor(row, row.authorId ?? undefined),
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

async function selectContentRow(id: string): Promise<ContentRow | null> {
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

async function insertContent(
  collection: ContentCollection,
  input: ContentInput,
  actorId: string,
): Promise<Record<string, unknown>> {
  const dbType = COLLECTION_DB_TYPE[collection];
  const ui = buildUiPayload(input);
  const status = (input.status ?? "draft") as UiStatus;
  const visibility = (input.visibility ?? "public") as UiVisibility;

  const authorId = await resolveAuthorId(input.authorId, actorId);
  const categoryId = await resolveCategoryId(input.category);

  const now = new Date();
  const publishedAt =
    status === "published" ? (toDate(input.publishedAt) ?? now) : toDate(input.publishedAt);

  // Slug: honor an explicit slug, otherwise derive one. On collision, retry
  // derived slugs with a short random suffix; explicit slugs surface a 409.
  const explicitSlug = input.slug?.trim();
  let slug = explicitSlug || slugify(input.title ?? "untitled");
  for (let attempt = 0; ; attempt += 1) {
    if (!(await slugExists(slug))) break;
    if (explicitSlug) {
      throw ContentApiError.conflict(`Content with slug "${slug}" already exists`);
    }
    slug = `${slugify(input.title ?? "untitled")}-${randomSuffix()}`;
    if (attempt > 5) throw ContentApiError.conflict("Could not generate a unique slug");
  }

  try {
    await db.insert(content).values({
      title: input.title ?? "",
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content ?? "",
      type: dbType,
      status: UI_STATUS_TO_DB[status],
      visibility: UI_VISIBILITY_TO_DB[visibility],
      categoryId,
      authorId,
      featuredImage: input.featuredImage ?? null,
      tags: input.tagIds ?? [],
      metadata: { ui: { ...ui, slug, status, visibility } },
      publishedAt: publishedAt ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict("Content with this slug already exists");
    }
    throw error;
  }

  const rows = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.slug, slug))
    .limit(1);
  const created = await selectContentRow(rows[0]!.id);
  if (!created) throw ContentApiError.internal();
  return rowToItem(created, collection);
}

async function patchContent(
  collection: ContentCollection,
  id: string,
  input: ContentInput,
  actorId: string,
): Promise<Record<string, unknown>> {
  const existing = await selectContentRow(id);
  if (!existing || existing.type !== COLLECTION_DB_TYPE[collection]) {
    throw ContentApiError.notFound();
  }

  const metadata = (existing.metadata ?? {}) as { ui?: Record<string, unknown> };
  const previousUi = metadata.ui ?? {};
  const incomingUi = buildUiPayload(input);
  const mergedUi = { ...previousUi, ...incomingUi };

  // Status handling
  const nextStatus =
    (incomingUi.status as UiStatus | undefined) ?? (previousUi.status as UiStatus | undefined);
  const dbStatus = nextStatus ? UI_STATUS_TO_DB[nextStatus] : existing.status;
  if (incomingUi.status === "review") {
    mergedUi.reviewedAt = new Date().toISOString();
  }

  // Visibility handling
  const nextVisibility =
    (incomingUi.visibility as UiVisibility | undefined) ??
    (previousUi.visibility as UiVisibility | undefined) ??
    "public";

  // publishedAt: preserve, accept override, or stamp on publish
  let publishedAt = existing.publishedAt ?? undefined;
  if (input.publishedAt !== undefined) {
    publishedAt = toDate(input.publishedAt);
  } else if (nextStatus === "published" && !publishedAt) {
    publishedAt = new Date();
  }
  if (input.status === "scheduled" && !incomingUi.scheduledFor) {
    // keep prior scheduledFor if present
  }

  // Version bump
  mergedUi.version =
    (incomingUi.version as number | undefined) ??
    ((previousUi.version as number | undefined) ?? 1) + 1;
  mergedUi.status = nextStatus ?? DB_STATUS_TO_UI[dbStatus];
  mergedUi.visibility = nextVisibility;

  // Slug change
  let slug = existing.slug;
  if (input.slug && input.slug.trim() !== existing.slug) {
    const candidate = input.slug.trim();
    if (await slugExists(candidate)) {
      throw ContentApiError.conflict(`Content with slug "${candidate}" already exists`);
    }
    slug = candidate;
    mergedUi.slug = slug;
  }

  const categoryId =
    input.category !== undefined ? await resolveCategoryId(input.category) : existing.categoryId;
  const authorId =
    input.authorId !== undefined
      ? await resolveAuthorId(input.authorId, actorId)
      : (existing.authorId ?? actorId);

  try {
    await db
      .update(content)
      .set({
        title: input.title ?? existing.title,
        slug,
        excerpt: input.excerpt !== undefined ? input.excerpt : existing.excerpt,
        content: input.content ?? existing.content,
        status: dbStatus,
        visibility: UI_VISIBILITY_TO_DB[nextVisibility],
        categoryId,
        authorId,
        featuredImage:
          input.featuredImage !== undefined ? input.featuredImage : existing.featuredImage,
        tags: input.tagIds !== undefined ? input.tagIds : (existing.tags ?? []),
        metadata: { ...metadata, ui: mergedUi },
        publishedAt: publishedAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(content.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict("Content with this slug already exists");
    }
    throw error;
  }

  const updated = await selectContentRow(id);
  if (!updated) throw ContentApiError.internal();
  return rowToItem(updated, collection);
}

// ── Public API: content collections ─────────────────────────────────────────

export async function listContent(
  collection: ContentCollection,
  query: ContentListQuery,
): Promise<{
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const conditions = [eq(content.type, COLLECTION_DB_TYPE[collection])];
  if (query.status && query.status.length > 0) {
    conditions.push(
      inArray(
        content.status,
        query.status.map((s) => UI_STATUS_TO_DB[s]),
      ),
    );
  }
  if (query.search) {
    const needle = `%${query.search}%`;
    conditions.push(or(ilike(content.title, needle), ilike(content.excerpt, needle))!);
  }
  const where = and(...conditions);

  const totalRows = await db.select({ value: count() }).from(content).where(where);
  const total = totalRows[0]?.value ?? 0;

  const sortColumn =
    query.sortBy === "title"
      ? content.title
      : query.sortBy === "updatedAt"
        ? content.updatedAt
        : query.sortBy === "publishedAt"
          ? content.publishedAt
          : content.createdAt;
  const order = query.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

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
    .where(where)
    .orderBy(order)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  return {
    items: rows.map((row) => rowToItem(row as ContentRow, collection)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getContentItem(
  collection: ContentCollection,
  id: string,
): Promise<Record<string, unknown>> {
  const row = await selectContentRow(id);
  if (!row || row.type !== COLLECTION_DB_TYPE[collection]) throw ContentApiError.notFound();
  return rowToItem(row, collection);
}

export async function createContentItem(
  collection: ContentCollection,
  input: ContentInput,
  actorId: string,
): Promise<Record<string, unknown>> {
  return insertContent(collection, input, actorId);
}

export async function updateContentItem(
  collection: ContentCollection,
  id: string,
  input: ContentInput,
  actorId: string,
): Promise<Record<string, unknown>> {
  return patchContent(collection, id, input, actorId);
}

export async function deleteContentItem(collection: ContentCollection, id: string): Promise<void> {
  const result = await db
    .delete(content)
    .where(and(eq(content.id, id), eq(content.type, COLLECTION_DB_TYPE[collection])))
    .returning({ id: content.id });
  if (result.length === 0) throw ContentApiError.notFound();
}

// ── Public API: categories ──────────────────────────────────────────────────

type CategoryRow = typeof contentCategory.$inferSelect;

interface CategoryUi {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  scope: string;
  status: "active" | "inactive" | "archived";
  color?: string;
  icon?: string;
  emoji?: string;
  order: number;
  parentId?: string;
  contentCount: number;
  allowedRoles: string[];
  allowedChapters: string[];
  allowedCommittees: string[];
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

function categoryRowToUi(row: CategoryRow, contentCount: number): CategoryUi {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const status =
    (metadata.status as CategoryUi["status"] | undefined) ?? (row.isActive ? "active" : "inactive");
  return {
    id: row.id,
    name: row.name,
    slug: (metadata.slug as string | undefined) ?? slugify(row.name),
    description: row.description ?? "",
    type: (metadata.type as string | undefined) ?? "article",
    scope: (metadata.scope as string | undefined) ?? "global",
    status,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    emoji: metadata.emoji as string | undefined,
    order: row.sortOrder ?? 0,
    parentId: row.parentId ?? undefined,
    contentCount,
    allowedRoles: (metadata.allowedRoles as string[] | undefined) ?? [],
    allowedChapters: (metadata.allowedChapters as string[] | undefined) ?? [],
    allowedCommittees: (metadata.allowedCommittees as string[] | undefined) ?? [],
    createdBy: (metadata.createdBy as string | undefined) ?? row.id,
    lastModifiedBy: metadata.lastModifiedBy as string | undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function categoryContentCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ categoryId: content.categoryId, value: count() })
    .from(content)
    .groupBy(content.categoryId);
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.categoryId) map.set(row.categoryId, row.value);
  }
  return map;
}

export async function listCategories(query: CategoryListQuery): Promise<{
  items: CategoryUi[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const where = query.search ? ilike(contentCategory.name, `%${query.search}%`) : undefined;

  const totalRows = await db.select({ value: count() }).from(contentCategory).where(where);
  const total = totalRows[0]?.value ?? 0;

  const rows = await db
    .select()
    .from(contentCategory)
    .where(where)
    .orderBy(asc(contentCategory.sortOrder), asc(contentCategory.name))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  const counts = await categoryContentCounts();
  return {
    items: rows.map((row) => categoryRowToUi(row, counts.get(row.id) ?? 0)),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getCategoryItem(id: string): Promise<CategoryUi> {
  const rows = await db.select().from(contentCategory).where(eq(contentCategory.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw ContentApiError.notFound("Category");
  // A single-category read must not pay for the whole-table GROUP BY that
  // categoryContentCounts() performs; mirror that aggregation exactly (no
  // status/deletion filters) so single-item and list views agree.
  const countRows = await db
    .select({ value: count() })
    .from(content)
    .where(eq(content.categoryId, id));
  return categoryRowToUi(row, countRows[0]?.value ?? 0);
}

export async function createCategoryItem(
  input: CreateCategoryInput,
  actorId: string,
): Promise<CategoryUi> {
  const now = new Date();
  const isActive =
    (input.status ?? "active") !== "archived" && (input.status ?? "active") !== "inactive";
  const metadata: Record<string, unknown> = {
    slug: input.slug ?? slugify(input.name),
    type: input.type,
    scope: input.scope,
    status: input.status,
    emoji: input.emoji,
    allowedRoles: input.allowedRoles,
    allowedChapters: input.allowedChapters,
    allowedCommittees: input.allowedCommittees,
    createdBy: actorId,
  };

  try {
    await db.insert(contentCategory).values({
      name: input.name.trim(),
      displayName: input.name.trim(),
      description: input.description ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.order ?? 0,
      isActive,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict(`Category "${input.name}" already exists`);
    }
    throw error;
  }

  const rows = await db
    .select()
    .from(contentCategory)
    .where(eq(contentCategory.name, input.name.trim()))
    .limit(1);
  const created = rows[0];
  if (!created) throw ContentApiError.internal();
  return categoryRowToUi(created, 0);
}

export async function updateCategoryItem(
  id: string,
  input: UpdateCategoryInput,
  actorId: string,
): Promise<CategoryUi> {
  const rows = await db.select().from(contentCategory).where(eq(contentCategory.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) throw ContentApiError.notFound("Category");

  const metadata = (existing.metadata ?? {}) as Record<string, unknown>;
  const nextName = input.name?.trim() ?? existing.name;

  if (input.slug !== undefined) metadata.slug = input.slug;
  if (input.type !== undefined) metadata.type = input.type;
  if (input.scope !== undefined) metadata.scope = input.scope;
  if (input.status !== undefined) metadata.status = input.status;
  if (input.emoji !== undefined) metadata.emoji = input.emoji;
  if (input.allowedRoles !== undefined) metadata.allowedRoles = input.allowedRoles;
  if (input.allowedChapters !== undefined) metadata.allowedChapters = input.allowedChapters;
  if (input.allowedCommittees !== undefined) metadata.allowedCommittees = input.allowedCommittees;
  metadata.lastModifiedBy = actorId;

  const isActive = input.status !== undefined ? input.status === "active" : existing.isActive;

  try {
    await db
      .update(contentCategory)
      .set({
        name: nextName,
        displayName: nextName,
        description: input.description !== undefined ? input.description : existing.description,
        icon: input.icon !== undefined ? input.icon : existing.icon,
        color: input.color !== undefined ? input.color : existing.color,
        parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
        sortOrder: input.order ?? existing.sortOrder,
        isActive,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(contentCategory.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      throw ContentApiError.conflict(`Category "${nextName}" already exists`);
    }
    throw error;
  }

  return getCategoryItem(id);
}

export async function deleteCategoryItem(id: string): Promise<void> {
  const rows = await db
    .select({ id: contentCategory.id })
    .from(contentCategory)
    .where(eq(contentCategory.id, id))
    .limit(1);
  if (rows.length === 0) throw ContentApiError.notFound("Category");
  try {
    await db.delete(contentCategory).where(eq(contentCategory.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      throw ContentApiError.conflict("Category is in use by content items and cannot be deleted");
    }
    throw error;
  }
}
