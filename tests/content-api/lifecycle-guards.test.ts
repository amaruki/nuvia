/**
 * Issue #25 regression guards — content lifecycle state machine.
 *
 * Before the fix, `patchContent` accepted any status verbatim: an organizer
 * (content:update, no content:publish) could PATCH {"status":"published"}
 * and go live instantly; submitting to "review" stamped reviewedAt
 * immediately (faking the review pass); authorId was client-settable so
 * anyone with content:update could reassign authorship; and delete was a
 * hard DELETE with no actor and no audit trail.
 *
 * These tests exercise the service layer directly (the routes delegate to
 * it), covering: the publish gate, the transition table, ownership,
 * authorship reassignment, reviewedAt ownership, and soft-delete.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { content } from "@/db/schema";
import {
  createContentItem,
  updateContentItem,
  deleteContentItem,
  getContentItem,
} from "@/lib/services/content";
import type { ContentActor } from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const {
  uniqueSuffix,
  expectApiError,
  setup,
  cleanupRows,
  teardown,
  createAuthorActor,
  actor,
  createdContentIds,
} = createContentApiFixtures();

let editorial: ContentActor;
let authorActor: ContentActor;

beforeAll(async () => {
  await setup();
  editorial = actor;
  authorActor = await createAuthorActor();
});

afterEach(cleanupRows);

afterAll(teardown);

async function createDraft(creator: ContentActor) {
  const suffix = uniqueSuffix();
  const item = await createContentItem(
    "articles",
    {
      title: `Lifecycle Draft ${suffix}`,
      content: "Plain body for lifecycle tests.",
      status: "draft",
      visibility: "public",
    },
    creator,
  );
  createdContentIds.push(item.id as string);
  return item;
}

describe("content publish gate (issue #25)", () => {
  test("a non-editorial author cannot publish their own draft via PATCH", async () => {
    const draft = await createDraft(authorActor);
    await expectApiError(
      () => updateContentItem("articles", draft.id as string, { status: "published" }, authorActor),
      403,
      "insufficient-permission",
    );
  });

  test("a non-editorial author cannot create content straight at published", async () => {
    await expectApiError(
      () =>
        createContentItem(
          "articles",
          {
            title: `Direct Publish ${uniqueSuffix()}`,
            content: "Body",
            status: "published",
          },
          authorActor,
        ),
      403,
      "insufficient-permission",
    );
  });

  test("an editorial caller can approve a draft into published", async () => {
    const draft = await createDraft(authorActor);
    const published = await updateContentItem(
      "articles",
      draft.id as string,
      { status: "published" },
      editorial,
    );
    expect(published.status).toBe("published");
  });

  test("the author can still submit their draft for review", async () => {
    const draft = await createDraft(authorActor);
    const submitted = await updateContentItem(
      "articles",
      draft.id as string,
      { status: "review" },
      authorActor,
    );
    expect(submitted.status).toBe("review");
  });
});

describe("content reviewedAt is service-owned (issue #25)", () => {
  test("submitting to review does NOT stamp reviewedAt", async () => {
    const draft = await createDraft(authorActor);
    const submitted = await updateContentItem(
      "articles",
      draft.id as string,
      { status: "review", reviewedAt: "2020-01-01T00:00:00.000Z" },
      authorActor,
    );
    expect(submitted.reviewedAt).toBeUndefined();
  });

  test("approval stamps reviewedAt; later edits preserve the stamp", async () => {
    const draft = await createDraft(authorActor);
    const published = await updateContentItem(
      "articles",
      draft.id as string,
      { status: "published" },
      editorial,
    );
    expect(published.reviewedAt).toBeTruthy();
    const stamp = published.reviewedAt;

    const edited = await updateContentItem(
      "articles",
      draft.id as string,
      { title: `Renamed ${uniqueSuffix()}`, reviewedAt: "1999-01-01T00:00:00.000Z" },
      editorial,
    );
    expect(edited.reviewedAt).toBe(stamp);
  });
});

describe("content ownership and authorship (issue #25)", () => {
  test("a non-author without editorial rights cannot edit someone else's content", async () => {
    const draft = await createDraft(editorial);
    await expectApiError(
      () =>
        updateContentItem("articles", draft.id as string, { title: "Hijacked title" }, authorActor),
      403,
      "insufficient-permission",
    );
  });

  test("the author can edit their own content", async () => {
    const draft = await createDraft(authorActor);
    const updated = await updateContentItem(
      "articles",
      draft.id as string,
      { title: `Own edit ${uniqueSuffix()}` },
      authorActor,
    );
    expect(updated.title).toContain("Own edit");
  });

  test("authorship reassignment requires an editorial role", async () => {
    const draft = await createDraft(authorActor);
    // The author cannot transfer authorship...
    await expectApiError(
      () =>
        updateContentItem("articles", draft.id as string, { authorId: editorial.id }, authorActor),
      403,
      "insufficient-permission",
    );
    // ...but an editorial caller can reassign it.
    const reassigned = await updateContentItem(
      "articles",
      draft.id as string,
      { authorId: editorial.id },
      editorial,
    );
    expect((reassigned.author as { id: string }).id).toBe(editorial.id);
  });
});

describe("content transition table (issue #25)", () => {
  test("illegal transitions are rejected with a conflict", async () => {
    const draft = await createDraft(editorial);
    const published = await updateContentItem(
      "articles",
      draft.id as string,
      { status: "published" },
      editorial,
    );
    expect(published.status).toBe("published");

    // published -> review is not a legal transition (must go via draft).
    await expectApiError(
      () => updateContentItem("articles", draft.id as string, { status: "review" }, editorial),
      409,
      "conflict",
    );
  });
});

describe("content delete is soft with an audit trail (issue #25)", () => {
  test("delete hides the row, records the deleter, and forbids undelete", async () => {
    const draft = await createDraft(editorial);
    const id = draft.id as string;

    await deleteContentItem("articles", id, editorial);

    // Invisible on every read path...
    await expectApiError(() => getContentItem("articles", id), 404, "not-found");

    // ...but the row survives with a DELETED status and an audit stamp.
    const [row] = await db.select().from(content).where(eq(content.id, id));
    expect(row.status).toBe("DELETED");
    const meta = row.metadata as { deleted?: { by: string; at: string } };
    expect(meta.deleted?.by).toBe(editorial.id);

    // PATCH cannot resurrect it...
    await expectApiError(
      () => updateContentItem("articles", id, { status: "draft" }, editorial),
      404,
      "not-found",
    );
    // ...and deleting again is idempotent.
    await deleteContentItem("articles", id, editorial);
  });
});
