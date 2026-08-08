/**
 * Content API (B4) — shared fixtures for the split content suite (see the
 * sibling *.test.ts files). The suite covers service-level CRUD round-trips
 * for articles, publications, announcements, and categories.
 *
 * Route-level permission checks are enforced by requirePermission()
 * (covered by the auth/rbac suites); here we exercise the same service
 * the routes delegate to, including UI-field round-trips through
 * content.metadata.ui, slug collision handling, and category
 * content counts.
 *
 * Each call to createContentApiFixtures() returns a fresh isolated
 * context — an actor user, row trackers, and factory helpers — plus
 * cleanup that removes everything the file created, so each part stays
 * self-cleaning and safe to run alongside the rest of the suite.
 *
 * Rows are id-isolated with unique suffixes and cleaned up per test in
 * FK-safe order (content -> content_categories, then users in teardown)
 * because the test DB is shared.
 */

import { expect } from "bun:test";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { content, contentCategory, user } from "@/db/schema";
import {
  ContentApiError,
  createCategoryItem,
  createContentItem,
  type ContentCollection,
} from "@/lib/services/content";

export function createContentApiFixtures() {
  const createdContentIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdUserIds: string[] = [];

  let actorId = "";

  function uniqueSuffix(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async function expectApiError(
    action: () => Promise<unknown>,
    status: number,
    slug: string,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(ContentApiError);
      expect((error as ContentApiError).status).toBe(status);
      expect((error as ContentApiError).slug).toBe(slug);
      return;
    }
    throw new Error(`Expected ContentApiError ${status}/${slug}, but no error was thrown`);
  }

  async function trackCreate(
    collection: ContentCollection,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const item = await createContentItem(
      collection,
      input as Parameters<typeof createContentItem>[1],
      actorId,
    );
    createdContentIds.push(item.id as string);
    return item;
  }

  async function makeCategory(suffix: string, type: string): Promise<Record<string, unknown>> {
    const category = await createCategoryItem(
      {
        name: `Content Cat ${suffix}`,
        description: "Test category for content API tests",
        type,
        scope: "global",
        status: "active",
        color: "#123456",
        emoji: "🧪",
        order: 1,
        allowedRoles: ["admin"],
      },
      actorId,
    );
    createdCategoryIds.push(category.id);
    return category as unknown as Record<string, unknown>;
  }

  /** Create the shared content-manager actor; returns its user id. */
  async function setup(): Promise<string> {
    const suffix = uniqueSuffix();
    const [row] = await db
      .insert(user)
      .values({
        username: `content-actor-${suffix}`,
        email: `content-actor-${suffix}@example.test`,
        name: "Content Test Actor",
        role: "content_manager",
        emailVerified: false,
      })
      .returning({ id: user.id });
    actorId = row.id;
    createdUserIds.push(actorId);
    return actorId;
  }

  /** Per-test cleanup in FK-safe order: content, then content_categories. */
  async function cleanupRows(): Promise<void> {
    if (createdContentIds.length > 0) {
      await db.delete(content).where(inArray(content.id, createdContentIds));
      createdContentIds.length = 0;
    }
    if (createdCategoryIds.length > 0) {
      await db.delete(contentCategory).where(inArray(contentCategory.id, createdCategoryIds));
      createdCategoryIds.length = 0;
    }
  }

  /** Final cleanup: remove the actor user(s) this file created. */
  async function teardown(): Promise<void> {
    if (createdUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
  }

  return {
    createdContentIds,
    createdCategoryIds,
    uniqueSuffix,
    expectApiError,
    trackCreate,
    makeCategory,
    setup,
    cleanupRows,
    teardown,
  };
}
