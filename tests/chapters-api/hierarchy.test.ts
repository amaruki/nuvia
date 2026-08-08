/**
 * D1 — Chapters API: parent/child hierarchy.
 * Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { POST as createChapter } from "@/app/api/v1/chapters/route";
import { GET as getChapter, PATCH as updateChapter } from "@/app/api/v1/chapters/[id]/route";
import { API, buildRequest, createFixtures, ctx, parseEnvelope } from "./helpers";

const { chapterIds, signUpWithRole, chapterPayload, cleanup } = createFixtures();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  admin = await signUpWithRole("admin", "admin");
});

afterAll(cleanup);

describe("chapter hierarchy", () => {
  test("child links to parent and parent lists subChapterIds", async () => {
    const parentRes = await createChapter(
      buildRequest(API, { method: "POST", cookie: admin.cookie, body: chapterPayload("parent") }),
    );
    const parentEnvelope = await parseEnvelope(parentRes);
    chapterIds.push(parentEnvelope.data.id);
    state.parentId = parentEnvelope.data.id;

    const childRes = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload("child", { parentChapterId: state.parentId }),
      }),
    );
    expect(childRes.status).toBe(201);
    const childEnvelope = await parseEnvelope(childRes);
    chapterIds.push(childEnvelope.data.id);
    state.childId = childEnvelope.data.id;
    expect(childEnvelope.data.parentChapterId).toBe(state.parentId);

    const parentFetch = await parseEnvelope(
      await getChapter(
        buildRequest(`${API}/${state.parentId}`, { cookie: admin.cookie }),
        ctx({ id: state.parentId }),
      ),
    );
    expect(parentFetch.data.subChapterIds).toEqual([state.childId]);
  });

  test("a chapter cannot become its own parent", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: state.childId },
      }),
      ctx({ id: state.childId }),
    );
    expect(res.status).toBe(422);
  });

  test("null clears the parent link", async () => {
    const res = await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: null },
      }),
      ctx({ id: state.childId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data.parentChapterId ?? null).toBeNull();
  });
});
