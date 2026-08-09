import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { forumPost } from "@/db/schema";
import { getModerationQueue, moderatePost, moderatePostSchema } from "@/lib/services/forum";
import { createActor, createTestCategory, createTestPost, registerCleanup } from "./helpers";

registerCleanup();

describe("moderation queue", () => {
  test("member posts queue as PENDING_REVIEW, approval publishes", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id);
    expect(post.status).toBe("PENDING_REVIEW");
    expect(post.author.id).toBe(member.id);

    const queue = await getModerationQueue();
    const entry = queue.items.find((row) => row.id === post.id);
    expect(entry).toBeDefined();
    expect(entry?.category.id).toBe(category.id);
    expect(entry?.reportCount).toBe(0);

    const approved = await moderatePost(post.id, { action: "approve" }, moderator);
    expect(approved.status).toBe("PUBLISHED");

    const queueAfter = await getModerationQueue();
    expect(queueAfter.items.some((row) => row.id === post.id)).toBe(false);
  });

  test("explicit PUBLISHED from a non-moderator is forced to PENDING_REVIEW", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id, {
      status: "PUBLISHED",
    });
    expect(post.status).toBe("PENDING_REVIEW");

    // Drafts stay drafts even for members.
    const draft = await createTestPost(member, category.id, {
      status: "DRAFT",
    });
    expect(draft.status).toBe("DRAFT");
  });

  test("reject hides the post and records the moderation metadata", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id);

    const rejected = await moderatePost(
      post.id,
      { action: "reject", reason: "Spam or promotional content" },
      moderator,
    );
    expect(rejected.status).toBe("HIDDEN");

    const [row] = await db
      .select({ metadata: forumPost.metadata })
      .from(forumPost)
      .where(eq(forumPost.id, post.id));
    const moderation = (row.metadata as Record<string, unknown> | null)?.moderation as Record<
      string,
      unknown
    >;
    expect(moderation.action).toBe("reject");
    expect(moderation.reason).toBe("Spam or promotional content");
    expect(moderation.by).toBe(moderator.id);
  });

  test("reject requires a reason", () => {
    const parsed = moderatePostSchema.safeParse({ action: "reject" });
    expect(parsed.success).toBe(false);
    const withReason = moderatePostSchema.safeParse({
      action: "reject",
      reason: "Off-topic",
    });
    expect(withReason.success).toBe(true);
  });

  test("actors with forum:moderate publish directly", async () => {
    const admin = await createActor("admin");
    const category = await createTestCategory(admin);

    const post = await createTestPost(admin, category.id);
    expect(post.status).toBe("PUBLISHED");
  });
});
