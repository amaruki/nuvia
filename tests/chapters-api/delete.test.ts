/**
 * D1 — Chapters API: deletion (permission gate, member-row cascade,
 * child set-null). Part of the split chapters suite in tests/chapters-api/.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chapterMember } from "@/db/schema";
import { POST as createChapter } from "@/app/api/v1/chapters/route";
import {
  DELETE as deleteChapter,
  GET as getChapter,
  PATCH as updateChapter,
} from "@/app/api/v1/chapters/[id]/route";
import { API, buildRequest, createFixtures, ctx, parseEnvelope } from "./helpers";

const { RUN_ID, chapterIds, signUpWithRole, chapterPayload, cleanup } = createFixtures();

/** Values shared between ordered tests within this file. */
const state: Record<string, string> = {};

let admin = { userId: "", email: "", cookie: "" };
let staff = { userId: "", email: "", cookie: "" };
let member = { userId: "", email: "", cookie: "" };

beforeAll(async () => {
  [admin, staff, member] = await Promise.all([
    signUpWithRole("admin", "admin"),
    signUpWithRole("staff", "staff"),
    signUpWithRole("member", "member"),
  ]);
  // Gamma is the chapter this file deletes; child is re-linked onto it so
  // the delete's set-null behavior is observable. Both came from earlier
  // describes in the original single-file suite; seed own copies here.
  for (const [suffix, status] of [
    ["gamma", "inactive"],
    ["child", "active"],
  ] as const) {
    const res = await createChapter(
      buildRequest(API, {
        method: "POST",
        cookie: admin.cookie,
        body: chapterPayload(suffix, { status }),
      }),
    );
    const envelope = await parseEnvelope(res);
    chapterIds.push(envelope.data.id);
    state[`${suffix}Id`] = envelope.data.id;
  }
});

afterAll(cleanup);

describe("chapter deletion", () => {
  test("delete requires chapters:delete", async () => {
    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: member.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
    // staff holds read/update/manage but not delete
    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: staff.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(403);
  });

  test("delete cascades chapter_members and set-nulls children", async () => {
    // Seed a member row directly — the API surface does not manage rosters yet.
    await db.insert(chapterMember).values({
      chapterId: state.gammaId,
      name: `D1 Officer ${RUN_ID}`,
      email: `officer-${RUN_ID}@example.test`,
      role: "TREASURER",
    });

    // Re-link the child to the parent we are about to delete.
    await updateChapter(
      buildRequest(`${API}/${state.childId}`, {
        method: "PATCH",
        cookie: admin.cookie,
        body: { parentChapterId: state.gammaId },
      }),
      ctx({ id: state.childId }),
    );

    const res = await deleteChapter(
      buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
      ctx({ id: state.gammaId }),
    );
    expect(res.status).toBe(200);
    const envelope = await parseEnvelope(res);
    expect(envelope.data).toEqual({ id: state.gammaId, deleted: true });

    const memberRows = await db
      .select()
      .from(chapterMember)
      .where(eq(chapterMember.chapterId, state.gammaId));
    expect(memberRows.length).toBe(0);

    const childFetch = await parseEnvelope(
      await getChapter(
        buildRequest(`${API}/${state.childId}`, { cookie: admin.cookie }),
        ctx({ id: state.childId }),
      ),
    );
    expect(childFetch.data.parentChapterId ?? null).toBeNull();

    expect(
      (
        await deleteChapter(
          buildRequest(`${API}/${state.gammaId}`, { method: "DELETE", cookie: admin.cookie }),
          ctx({ id: state.gammaId }),
        )
      ).status,
    ).toBe(404);
  });
});
