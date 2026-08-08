/**
 * D1 — Chapters API: authentication and per-action RBAC.
 * Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GET as listChapters, POST as createChapter } from "@/app/api/v1/chapters/route";
import { GET as getChapter } from "@/app/api/v1/chapters/[id]/route";
import { API, buildRequest, createFixtures, ctx } from "./helpers";

const { signUpWithRole, chapterPayload, cleanup } = createFixtures();

let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [staff, member] = await Promise.all([
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
});

afterAll(cleanup);

describe("chapters authentication and RBAC", () => {
  test("listing and creating require authentication and chapters permissions", async () => {
    expect((await listChapters(buildRequest(API))).status).toBe(401);
    expect((await listChapters(buildRequest(API, { cookie: member.cookie }))).status).toBe(403);

    expect(
      (await createChapter(buildRequest(API, { method: "POST", body: chapterPayload("anon") })))
        .status,
    ).toBe(401);
    expect(
      (
        await createChapter(
          buildRequest(API, { method: "POST", cookie: member.cookie, body: chapterPayload("m") }),
        )
      ).status,
    ).toBe(403);
    // staff holds chapters:read/update/manage but not chapters:create
    expect(
      (
        await createChapter(
          buildRequest(API, { method: "POST", cookie: staff.cookie, body: chapterPayload("s") }),
        )
      ).status,
    ).toBe(403);
  });

  test("item reads require chapters:read", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect((await getChapter(buildRequest(`${API}/${missing}`), ctx({ id: missing }))).status).toBe(
      401,
    );
    expect(
      (
        await getChapter(
          buildRequest(`${API}/${missing}`, { cookie: member.cookie }),
          ctx({ id: missing }),
        )
      ).status,
    ).toBe(403);
  });
});
