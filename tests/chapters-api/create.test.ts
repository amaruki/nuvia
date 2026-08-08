/**
 * D1 — Chapters API: creation validation, envelope shape, conflicts.
 * Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createChapter } from "@/app/api/v1/chapters/route";
import { API, buildRequest, createFixtures, parseEnvelope } from "./helpers";

const { RUN_ID, chapterIds, signUpWithRole, chapterPayload, cleanup } = createFixtures();

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
});

afterAll(cleanup);

describe("chapter creation", () => {
  test("create validates the payload", async () => {
    const empty = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: {} }),
    );
    expect(empty.status).toBe(422);

    const badStatus = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("bad", { status: "dormant" }),
      }),
    );
    expect(badStatus.status).toBe(422);

    const shortName = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("short", { name: "ab" }),
      }),
    );
    expect(shortName.status).toBe(422);
  });

  test("admin creates a chapter and the envelope carries the full UI shape", async () => {
    const res = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("alpha") }),
    );
    expect(res.status).toBe(201);

    const envelope = await parseEnvelope(res);
    const created = envelope.data;
    chapterIds.push(created.id);

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.name).toBe(`d1-chapter-alpha-${RUN_ID}`);
    expect(created.displayName).toBe(`D1 alpha Chapter ${RUN_ID}`);
    expect(created.status).toBe("active");
    expect(created.location.city).toBe("Testville");
    expect(created.location.coordinates).toEqual({ latitude: 12.5, longitude: -45.25 });
    expect(created.leadership).toEqual([]);
    expect(created.memberCount).toBe(0);
    expect(created.subChapterIds).toEqual([]);
    expect(created.settings.membershipDues).toBe(25);
    expect(created.contactInfo.email).toBe(`chapter-alpha-${RUN_ID}@example.test`);
    expect(created.createdBy).toBe(admin.email);
    expect(typeof created.establishedDate).toBe("string");
    expect(created.metrics.engagementScore).toBe(0);
    expect(created.finances.totalRevenue).toBe(0);
  });

  test("duplicate name is rejected with a conflict", async () => {
    const res = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("alpha") }),
    );
    expect(res.status).toBe(409);
    const body = await parseEnvelope(res);
    // RFC 9457 problem document, not the success envelope
    expect(body.data).toBeUndefined();
  });

  test("unknown parent chapter is a validation error", async () => {
    const res = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("orphan", { parentChapterId: "00000000-0000-4000-8000-000000000000" }),
      }),
    );
    expect(res.status).toBe(422);
  });
});
