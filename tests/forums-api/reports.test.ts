import { describe, expect, test } from "bun:test";
import {
  createReport,
  createReportSchema,
  getModerationQueue,
  getPost,
  listReports,
  moderatePost,
  resolveReport,
} from "@/lib/services/forum";
import {
  createActor,
  createTestCategory,
  createTestComment,
  createTestPost,
  createTestReport,
  expectForumProblem,
  registerCleanup,
  uniqueSuffix,
} from "./helpers";

registerCleanup();

describe("forum reports", () => {
  test("report a post: created PENDING with a target snapshot", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);

    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Spam",
    });
    expect(report.status).toBe("PENDING");
    expect(report.targetId).toBe(post.id);
    expect(report.reportedBy.id).toBe(member.id);
    expect(report.targetContent?.title).toBe(post.title);

    const list = await listReports();
    expect(list.items.some((row) => row.id === report.id)).toBe(true);

    const pendingOnly = await listReports("PENDING");
    expect(pendingOnly.items.some((row) => row.id === report.id)).toBe(true);
    const resolvedOnly = await listReports("RESOLVED");
    expect(resolvedOnly.items.some((row) => row.id === report.id)).toBe(false);
  });

  test("report a comment", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const comment = await createTestComment(admin, post.id);

    const report = await createTestReport(member, {
      targetType: "COMMENT",
      commentId: comment.id,
      reason: "Harassment",
    });
    expect(report.targetId).toBe(comment.id);
    expect(report.targetContent?.content).toContain(comment.content.slice(0, 20));
  });

  test("schema enforces exactly one matching target id", () => {
    const both = createReportSchema.safeParse({
      targetType: "POST",
      postId: "p1",
      commentId: "c1",
      reason: "x",
    });
    expect(both.success).toBe(false);

    const mismatch = createReportSchema.safeParse({
      targetType: "COMMENT",
      postId: "p1",
      reason: "x",
    });
    expect(mismatch.success).toBe(false);
  });

  test("reporting a missing target is a 404", async () => {
    const member = await createActor("member");
    await expectForumProblem(
      createReport(
        {
          targetType: "POST",
          postId: `missing-${uniqueSuffix()}`,
          reason: "Ghost",
        },
        member,
      ),
      404,
    );
  });

  test("resolve closes the report; double resolve conflicts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Off-topic",
    });

    const resolved = await resolveReport(report.id, { action: "RESOLVED" }, moderator);
    expect(resolved.status).toBe("RESOLVED");

    await expectForumProblem(resolveReport(report.id, { action: "DISMISSED" }, moderator), 409);
  });

  test("resolve with deleteContent soft-deletes the target", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(admin, category.id);
    const report = await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Abuse",
    });

    await resolveReport(report.id, { action: "RESOLVED", deleteContent: true }, moderator);
    const reloaded = await getPost(post.id);
    expect(reloaded.status).toBe("DELETED");
  });

  test("queue entries carry pending report counts", async () => {
    const admin = await createActor("admin");
    const member = await createActor("member");
    const moderator = await createActor("moderator");

    const category = await createTestCategory(admin);
    const post = await createTestPost(member, category.id); // PENDING_REVIEW

    await createTestReport(member, {
      targetType: "POST",
      postId: post.id,
      reason: "Spam",
    });
    await createTestReport(admin, {
      targetType: "POST",
      postId: post.id,
      reason: "Duplicate",
    });

    const queue = await getModerationQueue();
    const entry = queue.items.find((row) => row.id === post.id);
    expect(entry?.reportCount).toBe(2);

    // Approving the post does not resolve its reports.
    await moderatePost(post.id, { action: "approve" }, moderator);
    const reports = await listReports("PENDING");
    expect(reports.items.filter((row) => row.targetId === post.id)).toHaveLength(2);
  });
});
