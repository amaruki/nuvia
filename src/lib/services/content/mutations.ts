import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { content } from "@/db/schema";

import { ContentApiError, pgErrorCode } from "./errors";
import { assertPlainTextContent } from "./content-safety";
import {
  buildUiPayload,
  randomSuffix,
  resolveAuthorId,
  resolveCategoryId,
  rowToItem,
  selectContentRow,
  slugExists,
  slugify,
  toDate,
} from "./helpers";
import {
  COLLECTION_DB_TYPE,
  DB_STATUS_TO_UI,
  UI_STATUS_TO_DB,
  UI_VISIBILITY_TO_DB,
  type ContentCollection,
  type ContentInput,
  type UiStatus,
  type UiVisibility,
} from "./types";

async function insertContent(
  collection: ContentCollection,
  input: ContentInput,
  actorId: string,
): Promise<Record<string, unknown>> {
  const dbType = COLLECTION_DB_TYPE[collection];
  assertPlainTextContent(input.content ?? "");
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
  // Only re-validate when the caller actually supplies new content; legacy
  // rows that predate this guard stay updatable on other fields.
  if (input.content !== undefined) {
    assertPlainTextContent(input.content);
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
