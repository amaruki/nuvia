import { and, eq, ne } from "drizzle-orm";

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
  canPublishContent,
  isEditorial,
  isLegalTransition,
  transitionTouchesPublish,
  type ContentActor,
} from "./lifecycle";
import {
  COLLECTION_DB_TYPE,
  DB_STATUS_TO_UI,
  UI_STATUS_TO_DB,
  UI_VISIBILITY_TO_DB,
  type ContentCollection,
  type ContentInput,
  type ContentRow,
  type UiStatus,
  type UiVisibility,
} from "./types";

async function insertContent(
  collection: ContentCollection,
  input: ContentInput,
  actor: ContentActor,
): Promise<Record<string, unknown>> {
  const dbType = COLLECTION_DB_TYPE[collection];
  assertPlainTextContent(input.content ?? "");
  const ui = buildUiPayload(input);
  const status = (input.status ?? "draft") as UiStatus;
  const visibility = (input.visibility ?? "public") as UiVisibility;

  // Issue #25: creating content straight at published/scheduled is a publish
  // decision and requires content:publish, exactly like the PATCH path.
  if ((status === "published" || status === "scheduled") && !canPublishContent(actor)) {
    throw ContentApiError.forbidden("Publishing content requires the content:publish permission");
  }
  // Ghost-writing (creating content attributed to someone else) is an
  // editorial act; non-editorial callers may only author their own items.
  if (input.authorId !== undefined && input.authorId !== actor.id && !isEditorial(actor)) {
    throw ContentApiError.forbidden(
      "Attributing content to another author requires an editorial role",
    );
  }

  const authorId = await resolveAuthorId(input.authorId, actor.id);
  const categoryId = await resolveCategoryId(input.category);

  const now = new Date();
  const publishedAt =
    status === "published" ? (toDate(input.publishedAt) ?? now) : toDate(input.publishedAt);

  // Issue #25: reviewedAt is service-owned. It is stamped when a publisher
  // approves content, never supplied by the client and never stamped on
  // review submission (the old behavior faked the review pass).
  if (status === "published") {
    ui.reviewedAt = now.toISOString();
    ui.reviewedBy = actor.id;
  } else {
    delete ui.reviewedAt;
  }

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

/** Fields whose modification is a content edit (vs. a lifecycle action). */
function hasContentFieldEdits(input: ContentInput, existing: ContentRow): boolean {
  if (input.title !== undefined && input.title !== existing.title) return true;
  if (input.content !== undefined && input.content !== existing.content) return true;
  if (input.excerpt !== undefined && input.excerpt !== existing.excerpt) return true;
  if (input.slug !== undefined && input.slug.trim() !== existing.slug) return true;
  if (input.featuredImage !== undefined && input.featuredImage !== existing.featuredImage) {
    return true;
  }
  if (
    input.tagIds !== undefined &&
    JSON.stringify(input.tagIds) !== JSON.stringify(existing.tags)
  ) {
    return true;
  }
  return false;
}

async function patchContent(
  collection: ContentCollection,
  id: string,
  input: ContentInput,
  actor: ContentActor,
): Promise<Record<string, unknown>> {
  const existing = await selectContentRow(id);
  if (!existing || existing.type !== COLLECTION_DB_TYPE[collection]) {
    throw ContentApiError.notFound();
  }
  // Issue #25: soft-deleted rows are terminal. They are hidden from every
  // read path and immutable through the API (no undelete via PATCH).
  if (existing.status === "DELETED") {
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

  // ── Issue #25 lifecycle enforcement ───────────────────────────────────────
  const isAuthor = existing.authorId === actor.id;
  const editorial = isEditorial(actor);

  const currentStatus =
    (previousUi.status as UiStatus | undefined) ?? DB_STATUS_TO_UI[existing.status] ?? "draft";
  const requestedStatus = incomingUi.status as UiStatus | undefined;
  const nextStatus = requestedStatus ?? currentStatus;
  const statusChanged = requestedStatus !== undefined && requestedStatus !== currentStatus;

  if (statusChanged) {
    if (!isLegalTransition(currentStatus, requestedStatus!)) {
      throw ContentApiError.conflict(
        `Cannot change content status from "${currentStatus}" to "${requestedStatus}"`,
      );
    }
    if (transitionTouchesPublish(currentStatus, requestedStatus!)) {
      if (!canPublishContent(actor)) {
        throw ContentApiError.forbidden(
          "Publishing or unpublishing content requires the content:publish permission",
        );
      }
    } else if (!isAuthor && !editorial) {
      throw ContentApiError.forbidden("Only the author can change this content's status");
    }
  }

  // Non-status field edits are reserved for the author or editorial callers
  // (content:publish / content:manage holders, superadmin). Category and
  // visibility ride along with content edits.
  if (!isAuthor && !editorial) {
    if (
      hasContentFieldEdits(input, existing) ||
      input.visibility !== undefined ||
      input.category !== undefined
    ) {
      throw ContentApiError.forbidden("Only the author or an editorial role can edit this content");
    }
  }

  // Issue #25: authorship reassignment is an explicit editorial act. A
  // client-settable authorId on PATCH let a chapter_admin claim (or frame)
  // another member's work; only editorial callers may reassign it now.
  let authorId = existing.authorId ?? actor.id;
  if (input.authorId !== undefined && input.authorId !== authorId) {
    if (!editorial) {
      throw ContentApiError.forbidden("Reassigning authorship requires an editorial role");
    }
    authorId = await resolveAuthorId(input.authorId, actor.id);
  }

  const mergedUi = { ...previousUi, ...incomingUi };

  // Issue #25: reviewedAt is service-owned. Stamp it only when a publisher
  // approves content (transition into published); otherwise preserve the
  // existing stamp and ignore any client-supplied value.
  if (statusChanged && requestedStatus === "published") {
    mergedUi.reviewedAt = new Date().toISOString();
    mergedUi.reviewedBy = actor.id;
  } else {
    if (previousUi.reviewedAt !== undefined) mergedUi.reviewedAt = previousUi.reviewedAt;
    else delete mergedUi.reviewedAt;
    if (previousUi.reviewedBy !== undefined) mergedUi.reviewedBy = previousUi.reviewedBy;
    else delete mergedUi.reviewedBy;
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
  mergedUi.status = nextStatus ?? DB_STATUS_TO_UI[existing.status];
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

  try {
    await db
      .update(content)
      .set({
        title: input.title ?? existing.title,
        slug,
        excerpt: input.excerpt !== undefined ? input.excerpt : existing.excerpt,
        content: input.content ?? existing.content,
        status: UI_STATUS_TO_DB[nextStatus],
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
      .where(and(eq(content.id, id), ne(content.status, "DELETED")));
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
  actor: ContentActor,
): Promise<Record<string, unknown>> {
  return insertContent(collection, input, actor);
}

export async function updateContentItem(
  collection: ContentCollection,
  id: string,
  input: ContentInput,
  actor: ContentActor,
): Promise<Record<string, unknown>> {
  return patchContent(collection, id, input, actor);
}

/**
 * Soft delete with an audit trail (issue #25). The row flips to DELETED and
 * records who deleted it and when; it disappears from every read path
 * (list/get/categories counts) and becomes immutable through the API. The
 * previous hard DELETE left no audit trail at all.
 */
export async function deleteContentItem(
  collection: ContentCollection,
  id: string,
  actor: ContentActor,
): Promise<void> {
  const existing = await selectContentRow(id);
  if (!existing || existing.type !== COLLECTION_DB_TYPE[collection]) {
    throw ContentApiError.notFound();
  }
  if (existing.status === "DELETED") return; // idempotent

  const metadata = (existing.metadata ?? {}) as { ui?: Record<string, unknown> };

  await db
    .update(content)
    .set({
      status: "DELETED",
      metadata: {
        ...metadata,
        deleted: { by: actor.id, at: new Date().toISOString() },
      },
      updatedAt: new Date(),
    })
    .where(and(eq(content.id, id), ne(content.status, "DELETED")));
}
