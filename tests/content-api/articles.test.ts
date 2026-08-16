/**
 * Content API (B4) — articles round-trips: full CRUD, cross-collection
 * isolation, slug collision handling (explicit conflicts, derived retries),
 * and list pagination metadata.
 * Part of the split content suite in tests/content-api/.
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import {
  type ContentReadScope,
  deleteContentItem,
  getContentItem,
  listContent,
  updateContentItem,
} from "@/lib/services/content";
import { createContentApiFixtures } from "./helpers";

const {
  uniqueSuffix,
  expectApiError,
  trackCreate,
  makeCategory,
  setup,
  cleanupRows,
  teardown,
  actor,
} = createContentApiFixtures();

let actorId = "";

/**
 * Issue #8: the shared actor is a content_manager (an elevated caller, like
 * every content:create role), so round-trip tests pass the same scope the
 * route layer resolves for editorial users. The dedicated "read scope"
 * describe block below exercises the non-elevated (member-tier) side.
 */
const EDITORIAL_SCOPE: ContentReadScope = { canSeeUnpublished: true, includeAuthorEmail: true };
const MEMBER_SCOPE: ContentReadScope = {};

beforeAll(async () => {
  actorId = await setup();
});

afterEach(cleanupRows);

afterAll(teardown);

describe("articles round-trip", () => {
  test("create, read, update, list, and delete an article", async () => {
    const suffix = uniqueSuffix();
    const category = await makeCategory(suffix, "article");

    const article = await trackCreate("articles", {
      title: `Test Article ${suffix}`,
      excerpt: "An excerpt for the test article",
      content: "The body of the test article with enough words to count properly.",
      type: "tutorial",
      category: category.name,
      status: "draft",
      visibility: "members_only",
      tagIds: ["testing", "content"],
      authorId: actorId,
    });

    expect(article.id).toBeTruthy();
    expect(article.title).toBe(`Test Article ${suffix}`);
    expect(article.status).toBe("draft");
    // UI-only visibility survives the DB mapping via metadata.ui.
    expect(article.visibility).toBe("members_only");
    expect(article.type).toBe("tutorial");
    expect(article.category).toBe(category.name);
    expect((article.author as { id: string }).id).toBe(actorId);
    expect(article.tags).toHaveLength(2);
    expect((article.wordCount as number) ?? 0).toBeGreaterThan(0);
    expect((article.readTime as number) ?? 0).toBeGreaterThanOrEqual(1);

    const fetched = await getContentItem("articles", article.id as string, EDITORIAL_SCOPE);
    expect(fetched.title).toBe(`Test Article ${suffix}`);
    expect(fetched.visibility).toBe("members_only");

    const updated = await updateContentItem(
      "articles",
      article.id as string,
      { title: `Renamed Article ${suffix}`, status: "published", excerpt: "Updated excerpt" },
      actor,
    );
    expect(updated.title).toBe(`Renamed Article ${suffix}`);
    expect(updated.status).toBe("published");
    expect(updated.publishedAt).toBeTruthy();

    const listed = await listContent(
      "articles",
      {
        page: 1,
        limit: 10,
        search: `Renamed Article ${suffix}`,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      EDITORIAL_SCOPE,
    );
    expect(listed.items.some((item) => item.id === article.id)).toBe(true);

    await deleteContentItem("articles", article.id as string, actor);
    await expectApiError(() => getContentItem("articles", article.id as string), 404, "not-found");
  });

  test("articles are isolated from other collections", async () => {
    const suffix = uniqueSuffix();
    const article = await trackCreate("articles", {
      title: `Isolation Article ${suffix}`,
      content: "Body",
    });
    const publication = await trackCreate("publications", {
      title: `Isolation Publication ${suffix}`,
      content: "Body",
    });

    const publications = await listContent(
      "publications",
      {
        page: 1,
        limit: 100,
        search: suffix,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      EDITORIAL_SCOPE,
    );
    const ids = publications.items.map((item) => item.id);
    expect(ids).toContain(publication.id);
    expect(ids).not.toContain(article.id);

    // Cross-collection lookups miss: the item exists but under another type.
    await expectApiError(
      () => getContentItem("publications", article.id as string, EDITORIAL_SCOPE),
      404,
      "not-found",
    );
  });

  test("explicit slug collisions surface a conflict, derived slugs retry", async () => {
    const suffix = uniqueSuffix();
    const slug = `explicit-content-slug-${suffix}`;

    await trackCreate("articles", {
      title: `Slug First ${suffix}`,
      content: "Body",
      slug,
    });
    await expectApiError(
      () => trackCreate("articles", { title: `Slug Second ${suffix}`, content: "Body", slug }),
      409,
      "conflict",
    );

    // Same title without an explicit slug: the second insert derives a
    // suffixed slug instead of failing.
    const first = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    const second = await trackCreate("articles", {
      title: `Derived Slug ${suffix}`,
      content: "Body",
    });
    expect(first.slug).not.toBe(second.slug);
  });

  test("list pagination returns page metadata", async () => {
    const suffix = uniqueSuffix();
    const batch = `Page-${suffix}`;
    for (let index = 0; index < 3; index += 1) {
      await trackCreate("articles", {
        title: `${batch} Item ${index}`,
        content: "Body",
      });
    }

    const page = await listContent(
      "articles",
      {
        page: 1,
        limit: 2,
        search: batch,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      EDITORIAL_SCOPE,
    );
    expect(page.items.length).toBeLessThanOrEqual(2);
    expect(page.total).toBeGreaterThanOrEqual(3);
    expect(page.totalPages).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Issue #8 regression guard: members hold content:read but must not see
 * drafts/scheduled content or author emails. These tests exercise the
 * non-elevated (member-tier) scope directly against the service layer.
 */
describe("articles read scope (issue #8)", () => {
  test("member scope hides drafts from list", async () => {
    const suffix = uniqueSuffix();
    const draft = await trackCreate("articles", {
      title: `Scope Draft ${suffix}`,
      content: "Body",
      status: "draft",
      authorId: actorId,
    });

    // Non-elevated listing never surfaces the draft...
    const memberList = await listContent(
      "articles",
      { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
      MEMBER_SCOPE,
    );
    expect(memberList.items.some((item) => item.id === draft.id)).toBe(false);

    // ...even when the caller explicitly asks for drafts (intersection).
    const memberDraftQuery = await listContent(
      "articles",
      { page: 1, limit: 10, status: ["draft"], sortBy: "createdAt", sortOrder: "desc" },
      MEMBER_SCOPE,
    );
    expect(memberDraftQuery.items.some((item) => item.id === draft.id)).toBe(false);

    // Elevated callers still see the draft.
    const editorialList = await listContent(
      "articles",
      {
        page: 1,
        limit: 10,
        search: `Scope Draft ${suffix}`,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      EDITORIAL_SCOPE,
    );
    expect(editorialList.items.some((item) => item.id === draft.id)).toBe(true);
  });

  test("member scope 404s unpublished reads by id", async () => {
    const suffix = uniqueSuffix();
    const draft = await trackCreate("articles", {
      title: `Scope Probe ${suffix}`,
      content: "Body",
      status: "draft",
      authorId: actorId,
    });

    // 404 (not 403): the probe must not reveal that the draft exists.
    await expectApiError(
      () => getContentItem("articles", draft.id as string, MEMBER_SCOPE),
      404,
      "not-found",
    );

    // Same row is readable with the editorial scope.
    const fetched = await getContentItem("articles", draft.id as string, EDITORIAL_SCOPE);
    expect(fetched.id).toBe(draft.id);
  });

  test("member scope lists published items but strips author email", async () => {
    const suffix = uniqueSuffix();
    const published = await trackCreate("articles", {
      title: `Scope Published ${suffix}`,
      content: "Body",
      status: "published",
      authorId: actorId,
    });

    const list = await listContent(
      "articles",
      {
        page: 1,
        limit: 10,
        search: `Scope Published ${suffix}`,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      MEMBER_SCOPE,
    );
    const item = list.items.find((entry) => entry.id === published.id);
    expect(item).toBeTruthy();

    // Published content is visible; the author email is not.
    const author = item!.author as { email?: string };
    expect(author.email).toBe("");

    // Elevated callers get the email back.
    const editorial = await getContentItem("articles", published.id as string, EDITORIAL_SCOPE);
    expect(((editorial.author as { email?: string }).email ?? "").length).toBeGreaterThan(0);
  });

  test("authors can still read their own drafts (chair/organizer workflow)", async () => {
    const suffix = uniqueSuffix();
    const draft = await trackCreate("articles", {
      title: `Scope Own Draft ${suffix}`,
      content: "Body",
      status: "draft",
      authorId: actorId,
    });

    // Roles like committee_chair hold content:create/update without
    // content:publish: they stay non-elevated but must see their own work.
    const authorScope: ContentReadScope = { authorUserId: actorId };

    const list = await listContent(
      "articles",
      {
        page: 1,
        limit: 10,
        search: `Scope Own Draft ${suffix}`,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      authorScope,
    );
    expect(list.items.some((item) => item.id === draft.id)).toBe(true);

    const fetched = await getContentItem("articles", draft.id as string, authorScope);
    expect(fetched.id).toBe(draft.id);
    // Authorship still does not grant other authors' emails.
    expect((fetched.author as { email?: string }).email ?? "").toBe("");
  });
});
